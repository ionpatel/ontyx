import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Product, ProductCategory, StockMovement, StockMovementType } from '@/types/operations'

// ============================================================================
// DEMO DATA (Used when Supabase isn't configured or no org context)
// ============================================================================

const demoCategories: ProductCategory[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', description: 'Electronic devices and components', productCount: 45, isActive: true, createdAt: '2024-01-15' },
  { id: '2', name: 'Pharmaceuticals', slug: 'pharmaceuticals', description: 'Medications and health products', productCount: 128, isActive: true, createdAt: '2024-01-15' },
  { id: '3', name: 'Office Supplies', slug: 'office-supplies', description: 'Office and stationery items', productCount: 67, isActive: true, createdAt: '2024-01-15' },
  { id: '4', name: 'Raw Materials', slug: 'raw-materials', description: 'Manufacturing inputs', productCount: 34, isActive: true, createdAt: '2024-01-15' },
]

const demoProducts: Product[] = [
  {
    id: '1',
    sku: 'PHAR-001',
    barcode: '8901234567890',
    name: 'Acetaminophen 500mg',
    description: 'Pain reliever and fever reducer',
    categoryId: '2',
    categoryName: 'Pharmaceuticals',
    status: 'active',
    unitPrice: 12.99,
    costPrice: 8.50,
    taxRate: 0,
    stockQuantity: 2450,
    reorderLevel: 500,
    reorderQuantity: 1000,
    unit: 'bottle',
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-02-10',
  },
  {
    id: '2',
    sku: 'PHAR-002',
    barcode: '8901234567891',
    name: 'Ibuprofen 400mg',
    description: 'Anti-inflammatory pain reliever',
    categoryId: '2',
    categoryName: 'Pharmaceuticals',
    status: 'active',
    unitPrice: 15.99,
    costPrice: 10.25,
    taxRate: 0,
    stockQuantity: 1820,
    reorderLevel: 400,
    reorderQuantity: 800,
    unit: 'bottle',
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-02-08',
  },
  {
    id: '3',
    sku: 'ELEC-001',
    barcode: '8901234567892',
    name: 'USB-C Cable 2m',
    description: 'High-speed USB-C charging cable',
    categoryId: '1',
    categoryName: 'Electronics',
    status: 'active',
    unitPrice: 24.99,
    costPrice: 12.00,
    taxRate: 13,
    stockQuantity: 856,
    reorderLevel: 200,
    reorderQuantity: 500,
    unit: 'piece',
    isActive: true,
    createdAt: '2024-01-20',
    updatedAt: '2024-02-12',
  },
  {
    id: '4',
    sku: 'ELEC-002',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with USB receiver',
    categoryId: '1',
    categoryName: 'Electronics',
    status: 'out_of_stock',
    unitPrice: 39.99,
    costPrice: 22.00,
    taxRate: 13,
    stockQuantity: 0,
    reorderLevel: 50,
    reorderQuantity: 100,
    unit: 'piece',
    isActive: true,
    createdAt: '2024-01-20',
    updatedAt: '2024-02-15',
  },
  {
    id: '5',
    sku: 'OFF-001',
    name: 'A4 Copy Paper (500 sheets)',
    description: 'Premium white copy paper',
    categoryId: '3',
    categoryName: 'Office Supplies',
    status: 'active',
    unitPrice: 8.99,
    costPrice: 5.50,
    taxRate: 13,
    stockQuantity: 3200,
    reorderLevel: 500,
    reorderQuantity: 1000,
    unit: 'ream',
    isActive: true,
    createdAt: '2024-01-25',
    updatedAt: '2024-02-10',
  },
  {
    id: '6',
    sku: 'RAW-001',
    name: 'Steel Rod 10mm',
    description: 'Industrial grade steel rod',
    categoryId: '4',
    categoryName: 'Raw Materials',
    status: 'active',
    unitPrice: 45.00,
    costPrice: 32.00,
    taxRate: 13,
    stockQuantity: 450,
    reorderLevel: 100,
    reorderQuantity: 200,
    unit: 'meter',
    isActive: true,
    createdAt: '2024-02-01',
    updatedAt: '2024-02-14',
  },
]

const demoMovements: StockMovement[] = [
  { id: '1', productId: '1', productName: 'Acetaminophen 500mg', warehouseId: '1', warehouseName: 'Main Warehouse', type: 'in', quantity: 500, previousStock: 1950, newStock: 2450, reference: 'PO-2024-0156', createdAt: '2024-02-15T10:30:00', createdBy: 'John Smith' },
  { id: '2', productId: '2', productName: 'Ibuprofen 400mg', warehouseId: '1', warehouseName: 'Main Warehouse', type: 'out', quantity: 180, previousStock: 2000, newStock: 1820, reference: 'SO-2024-0892', createdAt: '2024-02-15T09:15:00', createdBy: 'Jane Doe' },
  { id: '3', productId: '3', productName: 'USB-C Cable 2m', warehouseId: '2', warehouseName: 'Toronto DC', type: 'adjustment', quantity: -44, previousStock: 900, newStock: 856, notes: 'Inventory count adjustment', createdAt: '2024-02-14T16:00:00', createdBy: 'Mike Johnson' },
]

// In-memory store for demo mode mutations
let demoProductStore = [...demoProducts]
let demoCategoryStore = [...demoCategories]
let demoMovementStore = [...demoMovements]

// ============================================================================
// HELPER: Transform DB row to Product type
// ============================================================================

function transformProduct(row: any): Product {
  return {
    id: row.id,
    sku: row.sku || '',
    barcode: row.barcode,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    categoryName: row.product_categories?.name || 'Uncategorized',
    status: row.is_active 
      ? (row.total_stock <= 0 ? 'out_of_stock' : 'active') 
      : 'inactive',
    unitPrice: parseFloat(row.sell_price) || 0,
    costPrice: parseFloat(row.cost_price) || 0,
    taxRate: row.tax_rates?.rate || 0,
    stockQuantity: row.total_stock || 0,
    reorderLevel: row.reorder_point || 0,
    reorderQuantity: row.reorder_quantity || 0,
    unit: row.weight_unit || 'piece',
    weight: row.weight ? parseFloat(row.weight) : undefined,
    dimensions: row.length || row.width || row.height ? {
      length: parseFloat(row.length) || 0,
      width: parseFloat(row.width) || 0,
      height: parseFloat(row.height) || 0,
    } : undefined,
    imageUrl: row.images?.[0],
    tags: row.tags,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function transformCategory(row: any): ProductCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    parentId: row.parent_id,
    productCount: row.product_count || 0,
    isActive: row.is_active,
    createdAt: row.created_at,
  }
}

// ============================================================================
// INVENTORY SERVICE
// ============================================================================

export const inventoryService = {
  // --------------------------------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------------------------------
  
  async getProducts(options?: {
    search?: string
    categoryId?: string
    status?: string
    limit?: number
    offset?: number
    organizationId?: string
  }): Promise<{ data: Product[]; count: number }> {
    // Demo mode check FIRST - never hit Supabase in demo mode
    if (!options?.organizationId || options.organizationId === 'demo') {
      // Demo mode
      let filtered = [...demoProductStore]
      
      if (options?.search) {
        const search = options.search.toLowerCase()
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(search) || 
          p.sku.toLowerCase().includes(search)
        )
      }
      
      if (options?.categoryId) {
        filtered = filtered.filter(p => p.categoryId === options.categoryId)
      }
      
      if (options?.status) {
        filtered = filtered.filter(p => p.status === options.status)
      }
      
      const count = filtered.length
      const start = options?.offset || 0
      const end = start + (options?.limit || 50)
      
      return { data: filtered.slice(start, end), count }
    }

    // Real Supabase query with stock aggregation
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
    
    if (options?.status === 'active') {
      query = query.eq('is_active', true)
    } else if (options?.status === 'inactive') {
      query = query.eq('is_active', false)
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }
    
    const { data, error, count } = await query.order('name')
    
    if (error) throw error
    
    // Calculate total stock from inventory_levels
    const products = (data || []).map((row: any) => {
      const totalStock = row.inventory_levels?.reduce((sum: number, il: any) => sum + (il.on_hand || 0), 0) || 0
      return transformProduct({ ...row, total_stock: totalStock })
    })
    
    return { data: products, count: count || 0 }
  },

  async getProduct(id: string, organizationId?: string): Promise<Product | null> {
    // Demo mode check FIRST
    if (!organizationId || organizationId === 'demo') {
      return demoProductStore.find(p => p.id === id) || null
    }
    
    const supabase = createClient()
    
    if (!supabase) {
      return demoProductStore.find(p => p.id === id) || null
    }

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
    
    if (error) throw error
    
    const totalStock = data.inventory_levels?.reduce((sum: number, il: any) => sum + (il.on_hand || 0), 0) || 0
    return transformProduct({ ...data, total_stock: totalStock })
  },

  async createProduct(product: Partial<Product>, organizationId?: string): Promise<Product> {
    // Demo mode check FIRST
    if (!organizationId || organizationId === 'demo') {
      // Demo mode - create in memory
      const newProduct: Product = {
        id: String(demoProductStore.length + 1),
        sku: product.sku || `SKU-${Date.now()}`,
        name: product.name || 'New Product',
        description: product.description,
        categoryId: product.categoryId || '1',
        categoryName: demoCategoryStore.find(c => c.id === product.categoryId)?.name || 'Electronics',
        status: 'active',
        unitPrice: product.unitPrice || 0,
        costPrice: product.costPrice || 0,
        taxRate: product.taxRate || 13,
        stockQuantity: product.stockQuantity || 0,
        reorderLevel: product.reorderLevel || 10,
        reorderQuantity: product.reorderQuantity || 50,
        unit: product.unit || 'piece',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      demoProductStore.push(newProduct)
      return newProduct
    }

    // Transform to DB schema
    const dbProduct = {
      organization_id: organizationId,
      sku: product.sku,
      name: product.name,
      description: product.description,
      category_id: product.categoryId,
      sell_price: product.unitPrice,
      cost_price: product.costPrice,
      reorder_point: product.reorderLevel,
      reorder_quantity: product.reorderQuantity,
      weight: product.weight,
      weight_unit: product.unit,
      length: product.dimensions?.length,
      width: product.dimensions?.width,
      height: product.dimensions?.height,
      is_active: true,
      is_taxable: (product.taxRate || 0) > 0,
    }

    const { data, error } = await supabase
      .from('products')
      .insert(dbProduct)
      .select(`
        *,
        product_categories(name)
      `)
      .single()
    
    if (error) throw error
    
    // Create initial inventory level if stock quantity provided
    if (product.stockQuantity && product.stockQuantity > 0) {
      // Get default warehouse
      const { data: warehouse } = await supabase
        .from('warehouses')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_primary', true)
        .single()
      
      if (warehouse) {
        await supabase.from('inventory_levels').insert({
          organization_id: organizationId,
          product_id: data.id,
          warehouse_id: warehouse.id,
          on_hand: product.stockQuantity,
          available: product.stockQuantity,
        })
      }
    }
    
    return transformProduct({ ...data, total_stock: product.stockQuantity || 0 })
  },

  async updateProduct(id: string, updates: Partial<Product>, organizationId?: string): Promise<Product> {
    const supabase = createClient()
    
    if (!organizationId || organizationId === 'demo') {
      const index = demoProductStore.findIndex(p => p.id === id)
      if (index === -1) throw new Error('Product not found')
      
      demoProductStore[index] = {
        ...demoProductStore[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      return demoProductStore[index]
    }

    const dbUpdates: any = { updated_at: new Date().toISOString() }
    
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId
    if (updates.unitPrice !== undefined) dbUpdates.sell_price = updates.unitPrice
    if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice
    if (updates.reorderLevel !== undefined) dbUpdates.reorder_point = updates.reorderLevel
    if (updates.reorderQuantity !== undefined) dbUpdates.reorder_quantity = updates.reorderQuantity
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
    if (updates.status !== undefined) dbUpdates.is_active = updates.status !== 'inactive'

    const { data, error } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        product_categories(name),
        inventory_levels(on_hand)
      `)
      .single()
    
    if (error) throw error
    
    const totalStock = data.inventory_levels?.reduce((sum: number, il: any) => sum + (il.on_hand || 0), 0) || 0
    return transformProduct({ ...data, total_stock: totalStock })
  },

  async deleteProduct(id: string, organizationId?: string): Promise<void> {
    const supabase = createClient()
    
    if (!organizationId || organizationId === 'demo') {
      demoProductStore = demoProductStore.filter(p => p.id !== id)
      return
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)
    
    if (error) throw error
  },

  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------

  async getCategories(organizationId?: string): Promise<ProductCategory[]> {
    const supabase = createClient()
    
    if (!organizationId || organizationId === 'demo') {
      return demoCategoryStore
    }

    const { data, error } = await supabase
      .from('product_categories')
      .select(`
        *,
        products(count)
      `)
      .eq('organization_id', organizationId)
      .order('name')
    
    if (error) throw error
    
    return (data || []).map((row: any) => ({
      ...transformCategory(row),
      productCount: row.products?.[0]?.count || 0,
    }))
  },

  async createCategory(category: Partial<ProductCategory>, organizationId?: string): Promise<ProductCategory> {
    const supabase = createClient()
    
    if (!organizationId || organizationId === 'demo') {
      const newCategory: ProductCategory = {
        id: String(demoCategoryStore.length + 1),
        name: category.name || 'New Category',
        slug: category.slug || category.name?.toLowerCase().replace(/\s+/g, '-') || 'new-category',
        description: category.description,
        productCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      }
      demoCategoryStore.push(newCategory)
      return newCategory
    }

    const { data, error } = await supabase
      .from('product_categories')
      .insert({
        organization_id: organizationId,
        name: category.name,
        slug: category.slug || category.name?.toLowerCase().replace(/\s+/g, '-'),
        description: category.description,
        is_active: true,
      })
      .select()
      .single()
    
    if (error) throw error
    return transformCategory(data)
  },

  // --------------------------------------------------------------------------
  // STOCK MOVEMENTS
  // --------------------------------------------------------------------------

  async getStockMovements(productId?: string, organizationId?: string): Promise<StockMovement[]> {
    const supabase = createClient()
    
    if (!organizationId || organizationId === 'demo') {
      if (productId) {
        return demoMovementStore.filter(m => m.productId === productId)
      }
      return demoMovementStore
    }

    let query = supabase
      .from('inventory_movements')
      .select(`
        *,
        products(name),
        warehouses(name),
        users(full_name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    
    if (productId) {
      query = query.eq('product_id', productId)
    }
    
    const { data, error } = await query.limit(100)
    
    if (error) throw error
    
    return (data || []).map((row: any) => ({
      id: row.id,
      productId: row.product_id,
      productName: row.products?.name || 'Unknown',
      warehouseId: row.warehouse_id,
      warehouseName: row.warehouses?.name || 'Unknown',
      type: row.movement_type as StockMovementType,
      quantity: row.quantity,
      previousStock: row.quantity_before,
      newStock: row.quantity_after,
      reference: row.reference_number,
      notes: row.notes,
      createdAt: row.created_at,
      createdBy: row.users?.full_name || 'System',
    }))
  },

  async createStockMovement(movement: {
    productId: string
    warehouseId: string
    type: StockMovementType
    quantity: number
    reference?: string
    notes?: string
  }, organizationId?: string): Promise<StockMovement> {
    const supabase = createClient()
    
    if (!organizationId || organizationId === 'demo') {
      const product = demoProductStore.find(p => p.id === movement.productId)
      if (!product) throw new Error('Product not found')
      
      const previousStock = product.stockQuantity
      const quantityChange = movement.type === 'out' ? -movement.quantity : movement.quantity
      const newStock = previousStock + quantityChange
      
      // Update product stock
      product.stockQuantity = newStock
      product.status = newStock <= 0 ? 'out_of_stock' : 'active'
      
      const newMovement: StockMovement = {
        id: String(demoMovementStore.length + 1),
        productId: movement.productId,
        productName: product.name,
        warehouseId: movement.warehouseId,
        warehouseName: 'Main Warehouse',
        type: movement.type,
        quantity: movement.quantity,
        previousStock,
        newStock,
        reference: movement.reference,
        notes: movement.notes,
        createdAt: new Date().toISOString(),
        createdBy: 'Demo User',
      }
      
      demoMovementStore.unshift(newMovement)
      return newMovement
    }

    // Get current inventory level
    const { data: invLevel } = await supabase
      .from('inventory_levels')
      .select('id, on_hand, available')
      .eq('product_id', movement.productId)
      .eq('warehouse_id', movement.warehouseId)
      .single()
    
    const previousStock = invLevel?.on_hand || 0
    const quantityChange = movement.type === 'out' || movement.type === 'adjustment' && movement.quantity < 0
      ? -Math.abs(movement.quantity) 
      : movement.quantity
    const newStock = previousStock + quantityChange

    // Create movement record
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert({
        organization_id: organizationId,
        product_id: movement.productId,
        warehouse_id: movement.warehouseId,
        movement_type: movement.type,
        quantity: movement.quantity,
        quantity_before: previousStock,
        quantity_after: newStock,
        reference_number: movement.reference,
        notes: movement.notes,
      })
      .select(`
        *,
        products(name),
        warehouses(name)
      `)
      .single()
    
    if (error) throw error

    // Update inventory level
    if (invLevel) {
      await supabase
        .from('inventory_levels')
        .update({ 
          on_hand: newStock, 
          available: newStock,
          updated_at: new Date().toISOString() 
        })
        .eq('id', invLevel.id)
    } else {
      // Create new inventory level
      await supabase.from('inventory_levels').insert({
        organization_id: organizationId,
        product_id: movement.productId,
        warehouse_id: movement.warehouseId,
        on_hand: newStock,
        available: newStock,
      })
    }
    
    return {
      id: data.id,
      productId: data.product_id,
      productName: data.products?.name || 'Unknown',
      warehouseId: data.warehouse_id,
      warehouseName: data.warehouses?.name || 'Unknown',
      type: data.movement_type,
      quantity: data.quantity,
      previousStock: data.quantity_before,
      newStock: data.quantity_after,
      reference: data.reference_number,
      notes: data.notes,
      createdAt: data.created_at,
      createdBy: 'Current User',
    }
  },

  // --------------------------------------------------------------------------
  // STATS
  // --------------------------------------------------------------------------

  async getInventoryStats(organizationId?: string): Promise<{
    totalProducts: number
    totalValue: number
    lowStockCount: number
    outOfStockCount: number
  }> {
    const supabase = createClient()
    
    if (!organizationId || organizationId === 'demo') {
      const products = demoProductStore
      return {
        totalProducts: products.length,
        totalValue: products.reduce((sum, p) => sum + (p.stockQuantity * p.costPrice), 0),
        lowStockCount: products.filter(p => p.stockQuantity <= p.reorderLevel && p.stockQuantity > 0).length,
        outOfStockCount: products.filter(p => p.stockQuantity === 0).length,
      }
    }

    // Get products with inventory levels
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        cost_price,
        reorder_point,
        inventory_levels(on_hand)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
    
    if (error) throw error

    let totalValue = 0
    let lowStockCount = 0
    let outOfStockCount = 0

    for (const product of products || []) {
      const totalStock = product.inventory_levels?.reduce((sum: number, il: any) => sum + (il.on_hand || 0), 0) || 0
      const costPrice = parseFloat(product.cost_price) || 0
      const reorderPoint = product.reorder_point || 0

      totalValue += totalStock * costPrice

      if (totalStock === 0) {
        outOfStockCount++
      } else if (totalStock <= reorderPoint) {
        lowStockCount++
      }
    }

    return {
      totalProducts: products?.length || 0,
      totalValue,
      lowStockCount,
      outOfStockCount,
    }
  },

  // --------------------------------------------------------------------------
  // WAREHOUSES
  // --------------------------------------------------------------------------

  async getWarehouses(organizationId?: string): Promise<any[]> {
    const supabase = createClient()
    
    if (!organizationId || organizationId === 'demo') {
      return [
        { id: '1', name: 'Main Warehouse', code: 'MAIN', isPrimary: true },
        { id: '2', name: 'Toronto DC', code: 'TOR', isPrimary: false },
      ]
    }

    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    
    return (data || []).map((w: any) => ({
      id: w.id,
      name: w.name,
      code: w.code,
      isPrimary: w.is_primary,
    }))
  },
}

export default inventoryService
