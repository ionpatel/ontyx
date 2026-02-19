import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    const { rows } = await request.json() as { rows: Record<string, any>[] }

    const duplicates: { rowIndex: number; field: string; value: string; existingId: string }[] = []

    // Get all existing products for comparison
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id, sku, name')
      .eq('organization_id', member.organization_id)

    if (!existingProducts) {
      return NextResponse.json({ duplicates: [] })
    }

    // Build lookup maps
    const skuMap = new Map<string, string>()
    const nameMap = new Map<string, string>()
    
    existingProducts.forEach(p => {
      if (p.sku) skuMap.set(p.sku.toLowerCase().trim(), p.id)
      if (p.name) nameMap.set(p.name.toLowerCase().trim(), p.id)
    })

    // Check each row
    rows.forEach((row) => {
      const rowIndex = row._rowIndex as number

      // Check SKU first (primary identifier)
      if (row.sku) {
        const sku = row.sku.toLowerCase().trim()
        const existingId = skuMap.get(sku)
        if (existingId) {
          duplicates.push({ rowIndex, field: 'sku', value: row.sku, existingId })
          return
        }
      }

      // Check name
      if (row.name) {
        const name = row.name.toLowerCase().trim()
        const existingId = nameMap.get(name)
        if (existingId) {
          duplicates.push({ rowIndex, field: 'name', value: row.name, existingId })
        }
      }
    })

    return NextResponse.json({ duplicates })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
