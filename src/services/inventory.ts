import { createClient } from '@/lib/supabase/client'
import type { Product, ProductCategory, StockMovement, StockMovementType } from '@/types/operations'

// ============================================================================
// SERVICE
// ============================================================================

export const inventoryService = {
  async getProducts(options?: {
    search?: string
    categoryId?: string
    status?: string
    limit?: number
    offset?: number
    organizationId?: string
  }): Promise<{ data: Product[]; count: number }> {
    if (!options?.organizationId) {
      return { data: [], count: 0 }
    }

    const supabase = createClient()

    let query = supabase
      .from('products')
      .select(`
        *,
        product_categories(name),
        tax_rates(rate),
        inventory_levels(on_hand)
      `, { count: 'exact' })
      .eq('organization_id', options.organizationId)
    
    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,sku.ilike.%${options.search}%`)
    }
    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId)
    }
    if (options?.status) {
      query = query.eq('status', options.status)
    }

    query = query.order('name', { ascending: true })
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return { data: [], count: 0 }
    }

    return {
      data: (data || []).map(row => {
        const totalStock = row.inventory_levels?.reduce((sum: number, il: any) => sum + (il.on_hand || 0), 0) || 0
        return transformProduct({ ...row, total_stock: totalStock })
      }),
      count: count || 0,
    }
  },

  async getProduct(id: string, organizationId?: string): Promise<Product | null> {
    if (!organizationId) return null
    
    const supabase = createClient()

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories(name),
        tax_rates(rate),
        inventory_levels(on_hand)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()
    
    if (error) {
      console.error('Error fetching product:', error)
      return null
    }
    
    const totalStock = data.inventory_levels?.reduce((sum: number, il: any) => sum + (il.on_hand || 0), 0) || 0
    return transformProduct({ ...data, total_stock: totalStock })
  },

  async createProduct(product: Partial<Product>, organizationId?: string): Promise<Product | null> {
    if (!organizationId) return null
    
    const supabase = createClient()

    const { data, error } = await supabase
      .from('products')
      .insert({
        organization_id: organizationId,
        sku: product.sku || `SKU-${Date.now()}`,
        vendor_sku: product.barcode || null,
        name: product.name,
        description: product.description,
        category_id: product.categoryId,
        product_type: 'inventory',
        sell_price: product.unitPrice || 0,
        cost_price: product.costPrice || 0,
        tax_rate_id: null,
        track_inventory: true,
        reorder_point: product.reorderLevel || 10,
        reorder_quantity: product.reorderQuantity || 50,
        is_active: true,
        is_sellable: true,
        is_purchasable: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return null
    }

    // Create initial inventory level
    if (product.stockQuantity && product.stockQuantity > 0) {
      await supabase.from('inventory_levels').insert({
        product_id: data.id,
        warehouse_id: null,
        on_hand: product.stockQuantity,
        committed: 0,
        available: product.stockQuantity,
      })
    }

    return this.getProduct(data.id, organizationId)
  },

  async updateProduct(id: string, updates: Partial<Product>, organizationId?: string): Promise<Product | null> {
    if (!organizationId) return null
    
    const supabase = createClient()

    const { data, error } = await supabase
      .from('products')
      .update({
        sku: updates.sku,
        vendor_sku: updates.barcode,
        name: updates.name,
        description: updates.description,
        category_id: updates.categoryId,
        sell_price: updates.unitPrice,
        cost_price: updates.costPrice,
        reorder_point: updates.reorderLevel,
        reorder_quantity: updates.reorderQuantity,
        is_active: updates.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return null
    }

    return this.getProduct(data.id, organizationId)
  },

  async deleteProduct(id: string, organizationId?: string): Promise<void> {
    if (!organizationId) return
    
    const supabase = createClient()

    const { error } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting product:', error)
    }
  },

  async getCategories(organizationId?: string): Promise<ProductCategory[]> {
    if (!organizationId) return []
    
    const supabase = createClient()

    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      productCount: 0,
      isActive: row.is_active,
      createdAt: row.created_at,
    }))
  },

  async createCategory(category: Partial<ProductCategory>, organizationId?: string): Promise<ProductCategory | null> {
    if (!organizationId) return null
    
    const supabase = createClient()

    const slug = category.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `cat-${Date.now()}`

    const { data, error } = await supabase
      .from('product_categories')
      .insert({
        organization_id: organizationId,
        name: category.name,
        slug,
        description: category.description,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      productCount: 0,
      isActive: data.is_active,
      createdAt: data.created_at,
    }
  },

  async getStockMovements(productId?: string, organizationId?: string): Promise<StockMovement[]> {
    if (!organizationId) return []
    
    const supabase = createClient()

    let query = supabase
      .from('stock_movements')
      .select(`*, products(name, sku)`)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching stock movements:', error)
      return []
    }

    return (data || []).map(row => ({
      id: row.id,
      productId: row.product_id,
      productName: row.products?.name || 'Unknown',
      type: row.movement_type as StockMovementType,
      quantity: row.quantity,
      reference: row.reference_number,
      notes: row.notes,
      createdAt: row.created_at,
      createdBy: row.created_by,
    }))
  },

  async createStockMovement(movement: {
    productId: string
    type: StockMovementType
    quantity: number
    reference?: string
    notes?: string
  }, organizationId?: string): Promise<StockMovement | null> {
    if (!organizationId) return null
    
    const supabase = createClient()

    // Insert movement
    const { data: movementData, error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        organization_id: organizationId,
        product_id: movement.productId,
        movement_type: movement.type,
        quantity: movement.quantity,
        reference_number: movement.reference,
        notes: movement.notes,
      })
      .select(`*, products(name, sku)`)
      .single()

    if (movementError) {
      console.error('Error creating stock movement:', movementError)
      return null
    }

    // Update inventory level
    const quantityChange = ['purchase', 'adjustment_in', 'return_in', 'transfer_in'].includes(movement.type)
      ? movement.quantity
      : -movement.quantity

    const { data: currentLevel } = await supabase
      .from('inventory_levels')
      .select('on_hand, available')
      .eq('product_id', movement.productId)
      .single()

    if (currentLevel) {
      await supabase
        .from('inventory_levels')
        .update({
          on_hand: (currentLevel.on_hand || 0) + quantityChange,
          available: (currentLevel.available || 0) + quantityChange,
          updated_at: new Date().toISOString(),
        })
        .eq('product_id', movement.productId)
    } else {
      await supabase
        .from('inventory_levels')
        .insert({
          product_id: movement.productId,
          on_hand: quantityChange > 0 ? quantityChange : 0,
          committed: 0,
          available: quantityChange > 0 ? quantityChange : 0,
        })
    }

    return {
      id: movementData.id,
      productId: movementData.product_id,
      productName: movementData.products?.name || 'Unknown',
      type: movementData.movement_type as StockMovementType,
      quantity: movementData.quantity,
      reference: movementData.reference_number,
      notes: movementData.notes,
      createdAt: movementData.created_at,
      createdBy: movementData.created_by,
    }
  },

  async getInventoryStats(organizationId?: string): Promise<{
    totalProducts: number
    totalValue: number
    lowStockCount: number
    outOfStockCount: number
  }> {
    if (!organizationId) {
      return { totalProducts: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 }
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('products')
      .select(`
        id, cost_price, reorder_point,
        inventory_levels(on_hand)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching inventory stats:', error)
      return { totalProducts: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 }
    }

    const products = data || []
    let totalValue = 0
    let lowStockCount = 0
    let outOfStockCount = 0

    for (const product of products) {
      const stock = product.inventory_levels?.reduce((sum: number, il: any) => sum + (il.on_hand || 0), 0) || 0
      totalValue += (product.cost_price || 0) * stock
      if (stock === 0) outOfStockCount++
      else if (stock <= (product.reorder_point || 0)) lowStockCount++
    }

    return {
      totalProducts: products.length,
      totalValue,
      lowStockCount,
      outOfStockCount,
    }
  },

  async getWarehouses(organizationId?: string): Promise<any[]> {
    if (!organizationId) return []
    
    const supabase = createClient()

    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching warehouses:', error)
      return []
    }

    return data || []
  },
}

// ============================================================================
// HELPERS
// ============================================================================

function transformProduct(row: any): Product {
  return {
    id: row.id,
    sku: row.sku,
    barcode: row.vendor_sku || '', // using vendor_sku as barcode fallback
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    categoryName: row.product_categories?.name || 'Uncategorized',
    status: row.is_active ? 'active' : 'inactive',
    unitPrice: row.sell_price || 0,
    costPrice: row.cost_price || 0,
    taxRate: row.tax_rates?.rate || 13,
    stockQuantity: row.total_stock || 0,
    reorderLevel: row.reorder_point || 10,
    reorderQuantity: row.reorder_quantity || 50,
    unit: 'piece',
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default inventoryService
