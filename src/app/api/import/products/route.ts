import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface ColumnMapping {
  sourceColumn: string
  targetField: string
}

interface ImportRow {
  [key: string]: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const { rows, mappings } = await request.json() as { rows: ImportRow[], mappings: ColumnMapping[] }
    
    let success = 0
    let failed = 0
    const errors: string[] = []

    for (const row of rows) {
      try {
        const product: Record<string, any> = {
          organization_id: member.organization_id,
          is_active: true,
          track_inventory: true,
          created_at: new Date().toISOString(),
        }
        
        let stockQuantity = 0

        for (const mapping of mappings) {
          const value = row[mapping.sourceColumn]?.trim()
          if (!value) continue

          switch (mapping.targetField) {
            case 'name':
              product.name = value
              // Generate slug from name
              product.slug = value.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
              break
            case 'sku':
              product.sku = value.toUpperCase()
              break
            case 'description':
              product.description = value
              break
            case 'price':
              const price = parseFloat(value.replace(/[^0-9.-]/g, ''))
              if (!isNaN(price)) {
                product.price = Math.round(price * 100) // Store in cents
              }
              break
            case 'cost':
              const cost = parseFloat(value.replace(/[^0-9.-]/g, ''))
              if (!isNaN(cost)) {
                product.cost = Math.round(cost * 100)
              }
              break
            case 'quantity':
              const qty = parseInt(value)
              if (!isNaN(qty)) {
                stockQuantity = qty
              }
              break
            case 'category':
              // Look up or create category
              const { data: existingCat } = await supabase
                .from('product_categories')
                .select('id')
                .eq('organization_id', member.organization_id)
                .ilike('name', value)
                .single()

              if (existingCat) {
                product.category_id = existingCat.id
              } else {
                // Create new category
                const { data: newCat } = await supabase
                  .from('product_categories')
                  .insert({
                    organization_id: member.organization_id,
                    name: value,
                    slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    is_active: true,
                  })
                  .select('id')
                  .single()
                
                if (newCat) {
                  product.category_id = newCat.id
                }
              }
              break
            case 'barcode':
              product.barcode = value
              break
            case 'reorder_point':
              const reorder = parseInt(value)
              if (!isNaN(reorder)) {
                product.reorder_point = reorder
              }
              break
          }
        }

        // Validate required fields
        if (!product.name) {
          throw new Error('Product name is required')
        }
        if (product.price === undefined) {
          throw new Error('Price is required')
        }

        // Generate SKU if not provided
        if (!product.sku) {
          product.sku = `SKU-${Date.now().toString(36).toUpperCase()}`
        }

        // Insert product
        const { data: insertedProduct, error } = await supabase
          .from('products')
          .insert(product)
          .select('id')
          .single()
        
        if (error) throw error

        // Create initial inventory level if quantity provided
        if (stockQuantity > 0 && insertedProduct) {
          // Get default location or create one
          let { data: location } = await supabase
            .from('inventory_locations')
            .select('id')
            .eq('organization_id', member.organization_id)
            .limit(1)
            .single()

          if (!location) {
            const { data: newLocation } = await supabase
              .from('inventory_locations')
              .insert({
                organization_id: member.organization_id,
                name: 'Main Warehouse',
                is_active: true,
              })
              .select('id')
              .single()
            location = newLocation
          }

          if (location) {
            await supabase.from('inventory_levels').insert({
              product_id: insertedProduct.id,
              location_id: location.id,
              quantity: stockQuantity,
            })
          }
        }

        success++
      } catch (err: any) {
        failed++
        const name = row[mappings.find(m => m.targetField === 'name')?.sourceColumn || ''] || 'Unknown'
        errors.push(`"${name}": ${err.message}`)
      }
    }

    return NextResponse.json({ success, failed, errors: errors.slice(0, 10) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
