import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Product, ProductCategory, StockMovement, StockMovementType } from '@/types/operations'

// ============================================================================
// DEMO DATA (Used when Supabase isn't configured)
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
  }): Promise<{ data: Product[]; count: number }> {
    const supabase = createClient()
    
    if (!supabase) {
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

    // Real Supabase query
    let query = supabase
      .from('products')
      .select('*, categories(name)', { count: 'exact' })
    
    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,sku.ilike.%${options.search}%`)
    }
    
    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId)
    }
    
    if (options?.status) {
      query = query.eq('status', options.status)
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }
    
    const { data, error, count } = await query.order('name')
    
    if (error) throw error
    
    return { data: data as unknown as Product[], count: count || 0 }
  },

  async getProduct(id: string): Promise<Product | null> {
    const supabase = createClient()
    
    if (!supabase) {
      return demoProductStore.find(p => p.id === id) || null
    }

    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as unknown as Product
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const supabase = createClient()
    
    if (!supabase) {
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

    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()
    
    if (error) throw error
    return data as unknown as Product
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const supabase = createClient()
    
    if (!supabase) {
      const index = demoProductStore.findIndex(p => p.id === id)
      if (index === -1) throw new Error('Product not found')
      
      demoProductStore[index] = {
        ...demoProductStore[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      return demoProductStore[index]
    }

    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as unknown as Product
  },

  async deleteProduct(id: string): Promise<void> {
    const supabase = createClient()
    
    if (!supabase) {
      demoProductStore = demoProductStore.filter(p => p.id !== id)
      return
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------

  async getCategories(): Promise<ProductCategory[]> {
    const supabase = createClient()
    
    if (!supabase) {
      return demoCategoryStore
    }

    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data as unknown as ProductCategory[]
  },

  async createCategory(category: Partial<ProductCategory>): Promise<ProductCategory> {
    const supabase = createClient()
    
    if (!supabase) {
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
      .insert(category)
      .select()
      .single()
    
    if (error) throw error
    return data as unknown as ProductCategory
  },

  // --------------------------------------------------------------------------
  // STOCK MOVEMENTS
  // --------------------------------------------------------------------------

  async getStockMovements(productId?: string): Promise<StockMovement[]> {
    const supabase = createClient()
    
    if (!supabase) {
      if (productId) {
        return demoMovementStore.filter(m => m.productId === productId)
      }
      return demoMovementStore
    }

    let query = supabase
      .from('stock_movements')
      .select('*, products(name), warehouses(name)')
      .order('created_at', { ascending: false })
    
    if (productId) {
      query = query.eq('product_id', productId)
    }
    
    const { data, error } = await query.limit(100)
    
    if (error) throw error
    return data as unknown as StockMovement[]
  },

  async createStockMovement(movement: {
    productId: string
    warehouseId: string
    type: StockMovementType
    quantity: number
    reference?: string
    notes?: string
  }): Promise<StockMovement> {
    const supabase = createClient()
    
    if (!supabase) {
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

    // Real implementation would use a transaction
    const { data, error } = await supabase
      .from('stock_movements')
      .insert(movement)
      .select()
      .single()
    
    if (error) throw error
    return data as unknown as StockMovement
  },

  // --------------------------------------------------------------------------
  // STATS
  // --------------------------------------------------------------------------

  async getInventoryStats(): Promise<{
    totalProducts: number
    totalValue: number
    lowStockCount: number
    outOfStockCount: number
  }> {
    const supabase = createClient()
    
    if (!supabase) {
      const products = demoProductStore
      return {
        totalProducts: products.length,
        totalValue: products.reduce((sum, p) => sum + (p.stockQuantity * p.costPrice), 0),
        lowStockCount: products.filter(p => p.stockQuantity <= p.reorderLevel && p.stockQuantity > 0).length,
        outOfStockCount: products.filter(p => p.stockQuantity === 0).length,
      }
    }

    const { data, error } = await supabase.rpc('get_inventory_stats')
    
    if (error) throw error
    return data
  },
}

export default inventoryService
