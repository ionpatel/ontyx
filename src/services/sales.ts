import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { SalesOrder, SalesOrderItem, Quote, QuoteItem, SalesOrderStatus, PaymentStatus } from '@/types/operations'

// ============================================================================
// ADDITIONAL TYPES
// ============================================================================

export interface CreateSalesOrderInput {
  customerId: string
  items: {
    productId: string
    quantity: number
    unitPrice: number
    taxRate?: number
    discount?: number
  }[]
  shippingAddress: {
    street: string
    city: string
    state?: string
    postalCode: string
    country: string
  }
  billingAddress?: {
    street: string
    city: string
    state?: string
    postalCode: string
    country: string
  }
  shippingMethod?: 'standard' | 'express' | 'overnight' | 'pickup'
  shippingCost?: number
  discount?: number
  notes?: string
  internalNotes?: string
  expectedDelivery?: string
  warehouseId?: string
}

export interface SalesStats {
  totalOrders: number
  totalRevenue: number
  avgOrderValue: number
  pendingOrders: number
  shippedOrders: number
  deliveredOrders: number
}

// ============================================================================
// DEMO DATA
// ============================================================================

const demoOrders: SalesOrder[] = [
  {
    id: 'demo-so-1',
    orderNumber: 'SO-2024-0001',
    customerId: 'demo-1',
    customerName: 'Maple Leaf Pharmacy',
    customerEmail: 'orders@mapleleafpharmacy.ca',
    customerPhone: '416-555-0101',
    shippingAddress: {
      street: '123 Yonge Street',
      city: 'Toronto',
      state: 'ON',
      postalCode: 'M5B 1M4',
      country: 'CA',
    },
    status: 'confirmed',
    paymentStatus: 'pending',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Acetaminophen 500mg',
        sku: 'PHAR-001',
        quantity: 100,
        unitPrice: 12.99,
        taxRate: 13,
        discount: 0,
        total: 1468.87,
        fulfilledQuantity: 0,
        backorderedQuantity: 0,
      },
      {
        id: 'item-2',
        productId: 'prod-2',
        productName: 'Ibuprofen 400mg',
        sku: 'PHAR-002',
        quantity: 50,
        unitPrice: 15.99,
        taxRate: 13,
        discount: 0,
        total: 903.44,
        fulfilledQuantity: 0,
        backorderedQuantity: 0,
      },
    ],
    subtotal: 2099.50,
    taxTotal: 272.94,
    shippingCost: 25.00,
    discount: 0,
    total: 2397.44,
    amountPaid: 0,
    amountDue: 2397.44,
    currency: 'CAD',
    shippingMethod: 'standard',
    orderDate: '2024-02-14',
    expectedDelivery: '2024-02-21',
    createdAt: '2024-02-14T10:30:00Z',
    updatedAt: '2024-02-14T10:30:00Z',
  },
  {
    id: 'demo-so-2',
    orderNumber: 'SO-2024-0002',
    customerId: 'demo-2',
    customerName: 'Northern Health Clinic',
    customerEmail: 'purchasing@northernhealth.ca',
    shippingAddress: {
      street: '456 King Street West',
      city: 'Mississauga',
      state: 'ON',
      postalCode: 'L5B 3M7',
      country: 'CA',
    },
    status: 'shipped',
    paymentStatus: 'paid',
    items: [
      {
        id: 'item-3',
        productId: 'prod-3',
        productName: 'Blood Pressure Monitor',
        sku: 'MED-001',
        quantity: 5,
        unitPrice: 89.99,
        taxRate: 13,
        discount: 10,
        total: 457.95,
        fulfilledQuantity: 5,
        backorderedQuantity: 0,
      },
    ],
    subtotal: 404.96,
    taxTotal: 52.99,
    shippingCost: 0,
    discount: 40.50,
    total: 457.95,
    amountPaid: 457.95,
    amountDue: 0,
    currency: 'CAD',
    shippingMethod: 'express',
    trackingNumber: 'CP123456789CA',
    orderDate: '2024-02-10',
    expectedDelivery: '2024-02-15',
    shippedAt: '2024-02-11T14:00:00Z',
    createdAt: '2024-02-10T09:00:00Z',
    updatedAt: '2024-02-11T14:00:00Z',
  },
  {
    id: 'demo-so-3',
    orderNumber: 'SO-2024-0003',
    customerId: 'demo-4',
    customerName: 'PharmaCare Distribution',
    customerEmail: 'info@pharmacare.ca',
    shippingAddress: {
      street: '321 Centre Street',
      city: 'Calgary',
      state: 'AB',
      postalCode: 'T2G 0B5',
      country: 'CA',
    },
    status: 'delivered',
    paymentStatus: 'paid',
    items: [
      {
        id: 'item-4',
        productId: 'prod-1',
        productName: 'Acetaminophen 500mg',
        sku: 'PHAR-001',
        quantity: 500,
        unitPrice: 11.99,
        taxRate: 5,
        discount: 5,
        total: 5983.03,
        fulfilledQuantity: 500,
        backorderedQuantity: 0,
      },
    ],
    subtotal: 5695.50,
    taxTotal: 287.53,
    shippingCost: 0,
    discount: 284.78,
    total: 5983.03,
    amountPaid: 5983.03,
    amountDue: 0,
    currency: 'CAD',
    shippingMethod: 'pickup',
    orderDate: '2024-02-05',
    deliveredAt: '2024-02-08T16:00:00Z',
    createdAt: '2024-02-05T11:00:00Z',
    updatedAt: '2024-02-08T16:00:00Z',
  },
]

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `SO-${year}-${seq}`
}

export const salesService = {
  // Get all sales orders
  async getOrders(organizationId: string, filters?: {
    status?: SalesOrderStatus
    customerId?: string
    fromDate?: string
    toDate?: string
  }): Promise<SalesOrder[]> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured()) {
      let result = [...demoOrders]
      if (filters?.status) {
        result = result.filter(o => o.status === filters.status)
      }
      if (filters?.customerId) {
        result = result.filter(o => o.customerId === filters.customerId)
      }
      return result
    }

    let query = supabase
      .from('sales_orders')
      .select(`
        *,
        customer:contacts!sales_orders_customer_id_fkey(id, name, email, phone),
        items:sales_order_items(*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId)
    }
    if (filters?.fromDate) {
      query = query.gte('order_date', filters.fromDate)
    }
    if (filters?.toDate) {
      query = query.lte('order_date', filters.toDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching sales orders:', error)
      return demoOrders
    }

    return (data || []).map(mapOrderFromDb)
  },

  // Get single order
  async getOrder(id: string, organizationId: string): Promise<SalesOrder | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured()) {
      return demoOrders.find(o => o.id === id) || null
    }

    const { data, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:contacts!sales_orders_customer_id_fkey(id, name, email, phone),
        items:sales_order_items(
          *,
          product:products(id, name, sku)
        )
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching sales order:', error)
      return null
    }

    return mapOrderFromDb(data)
  },

  // Create order
  async createOrder(input: CreateSalesOrderInput, organizationId: string): Promise<SalesOrder | null> {
    const supabase = createClient()
    
    // Calculate totals
    let subtotal = 0
    let taxTotal = 0
    
    const items = input.items.map(item => {
      const itemSubtotal = item.quantity * item.unitPrice
      const itemDiscount = item.discount || 0
      const itemAfterDiscount = itemSubtotal - itemDiscount
      const itemTax = itemAfterDiscount * ((item.taxRate || 0) / 100)
      const itemTotal = itemAfterDiscount + itemTax
      
      subtotal += itemSubtotal
      taxTotal += itemTax
      
      return {
        ...item,
        total: itemTotal,
      }
    })
    
    const discount = input.discount || 0
    const shippingCost = input.shippingCost || 0
    const total = subtotal - discount + taxTotal + shippingCost
    
    if (!supabase || !isSupabaseConfigured()) {
      const newOrder: SalesOrder = {
        id: `demo-so-${Date.now()}`,
        orderNumber: generateOrderNumber(),
        customerId: input.customerId,
        customerName: 'Demo Customer',
        customerEmail: 'demo@example.com',
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress,
        status: 'draft',
        paymentStatus: 'pending',
        items: items.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          productId: item.productId,
          productName: 'Product',
          sku: 'SKU',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 0,
          discount: item.discount || 0,
          total: item.total,
          fulfilledQuantity: 0,
          backorderedQuantity: 0,
        })),
        subtotal,
        taxTotal,
        shippingCost,
        discount,
        total,
        amountPaid: 0,
        amountDue: total,
        currency: 'CAD',
        shippingMethod: input.shippingMethod || 'standard',
        notes: input.notes,
        internalNotes: input.internalNotes,
        expectedDelivery: input.expectedDelivery,
        warehouseId: input.warehouseId,
        orderDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      demoOrders.push(newOrder)
      return newOrder
    }

    // Insert order
    const { data: orderData, error: orderError } = await supabase
      .from('sales_orders')
      .insert({
        organization_id: organizationId,
        order_number: generateOrderNumber(),
        customer_id: input.customerId,
        shipping_street: input.shippingAddress.street,
        shipping_city: input.shippingAddress.city,
        shipping_state: input.shippingAddress.state,
        shipping_postal_code: input.shippingAddress.postalCode,
        shipping_country: input.shippingAddress.country,
        billing_street: input.billingAddress?.street,
        billing_city: input.billingAddress?.city,
        billing_state: input.billingAddress?.state,
        billing_postal_code: input.billingAddress?.postalCode,
        billing_country: input.billingAddress?.country,
        status: 'draft',
        payment_status: 'pending',
        subtotal,
        tax_total: taxTotal,
        shipping_cost: shippingCost,
        discount,
        total,
        amount_paid: 0,
        amount_due: total,
        currency: 'CAD',
        shipping_method: input.shippingMethod || 'standard',
        notes: input.notes,
        internal_notes: input.internalNotes,
        expected_delivery: input.expectedDelivery,
        warehouse_id: input.warehouseId,
        order_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating sales order:', orderError)
      return null
    }

    // Insert order items
    const orderItems = items.map(item => ({
      sales_order_id: orderData.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate || 0,
      discount: item.discount || 0,
      total: item.total,
      fulfilled_quantity: 0,
      backordered_quantity: 0,
    }))

    const { error: itemsError } = await supabase
      .from('sales_order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Order was created, return it anyway
    }

    return this.getOrder(orderData.id, organizationId)
  },

  // Update order status
  async updateOrderStatus(id: string, status: SalesOrderStatus, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured()) {
      const order = demoOrders.find(o => o.id === id)
      if (order) {
        order.status = status
        order.updatedAt = new Date().toISOString()
        if (status === 'shipped') order.shippedAt = new Date().toISOString()
        if (status === 'delivered') order.deliveredAt = new Date().toISOString()
        return true
      }
      return false
    }

    const updates: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    }
    
    if (status === 'shipped') updates.shipped_at = new Date().toISOString()
    if (status === 'delivered') updates.delivered_at = new Date().toISOString()

    const { error } = await supabase
      .from('sales_orders')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating order status:', error)
      return false
    }

    return true
  },

  // Get sales stats
  async getStats(organizationId: string): Promise<SalesStats> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured()) {
      return {
        totalOrders: demoOrders.length,
        totalRevenue: demoOrders.reduce((sum, o) => sum + o.total, 0),
        avgOrderValue: demoOrders.reduce((sum, o) => sum + o.total, 0) / demoOrders.length,
        pendingOrders: demoOrders.filter(o => o.status === 'confirmed' || o.status === 'processing').length,
        shippedOrders: demoOrders.filter(o => o.status === 'shipped').length,
        deliveredOrders: demoOrders.filter(o => o.status === 'delivered').length,
      }
    }

    const { data, error } = await supabase
      .from('sales_orders')
      .select('status, total')
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error fetching sales stats:', error)
      return {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        pendingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
      }
    }

    const orders = data || []
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
    
    return {
      totalOrders: orders.length,
      totalRevenue,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      pendingOrders: orders.filter(o => o.status === 'confirmed' || o.status === 'processing').length,
      shippedOrders: orders.filter(o => o.status === 'shipped').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length,
    }
  },

  // Search orders
  async searchOrders(query: string, organizationId: string): Promise<SalesOrder[]> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured()) {
      const q = query.toLowerCase()
      return demoOrders.filter(o => 
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
      )
    }

    const { data, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:contacts!sales_orders_customer_id_fkey(id, name, email)
      `)
      .eq('organization_id', organizationId)
      .or(`order_number.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error searching orders:', error)
      return []
    }

    return (data || []).map(mapOrderFromDb)
  },
}

// ============================================================================
// MAPPERS
// ============================================================================

function mapOrderFromDb(row: any): SalesOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    customerName: row.customer?.name || 'Unknown',
    customerEmail: row.customer?.email || '',
    customerPhone: row.customer?.phone,
    shippingAddress: {
      street: row.shipping_street || '',
      city: row.shipping_city || '',
      state: row.shipping_state,
      postalCode: row.shipping_postal_code || '',
      country: row.shipping_country || 'CA',
    },
    billingAddress: row.billing_street ? {
      street: row.billing_street,
      city: row.billing_city || '',
      state: row.billing_state,
      postalCode: row.billing_postal_code || '',
      country: row.billing_country || 'CA',
    } : undefined,
    status: row.status,
    paymentStatus: row.payment_status,
    items: (row.items || []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product?.name || 'Product',
      sku: item.product?.sku || '',
      quantity: item.quantity,
      unitPrice: item.unit_price,
      taxRate: item.tax_rate || 0,
      discount: item.discount || 0,
      total: item.total,
      fulfilledQuantity: item.fulfilled_quantity || 0,
      backorderedQuantity: item.backordered_quantity || 0,
    })),
    subtotal: row.subtotal,
    taxTotal: row.tax_total,
    shippingCost: row.shipping_cost || 0,
    discount: row.discount || 0,
    total: row.total,
    amountPaid: row.amount_paid || 0,
    amountDue: row.amount_due || row.total,
    currency: row.currency || 'CAD',
    shippingMethod: row.shipping_method || 'standard',
    trackingNumber: row.tracking_number,
    notes: row.notes,
    internalNotes: row.internal_notes,
    quoteId: row.quote_id,
    invoiceId: row.invoice_id,
    warehouseId: row.warehouse_id,
    orderDate: row.order_date,
    expectedDelivery: row.expected_delivery,
    shippedAt: row.shipped_at,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default salesService
