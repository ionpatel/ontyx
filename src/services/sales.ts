import { createClient } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export type SalesOrderStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'

export interface SalesOrderItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  taxRate: number
  discount: number
  total: number
  fulfilledQuantity: number
  backorderedQuantity: number
}

export interface SalesOrder {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  shippingAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  billingAddress?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  status: SalesOrderStatus
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded'
  items: SalesOrderItem[]
  subtotal: number
  taxTotal: number
  shippingCost: number
  discount: number
  total: number
  amountPaid: number
  amountDue: number
  currency: string
  shippingMethod?: string
  trackingNumber?: string
  notes?: string
  internalNotes?: string
  expectedDelivery?: string
  shippedAt?: string
  deliveredAt?: string
  warehouseId?: string
  orderDate: string
  createdAt: string
  updatedAt: string
}

export interface CreateSalesOrderInput {
  customerId: string
  shippingAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  billingAddress?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  items: {
    productId: string
    quantity: number
    unitPrice: number
    taxRate?: number
    discount?: number
  }[]
  shippingMethod?: string
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
// SERVICE
// ============================================================================

function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `SO-${year}-${seq}`
}

export const salesService = {
  async getOrders(organizationId: string, filters?: {
    status?: SalesOrderStatus
    customerId?: string
    fromDate?: string
    toDate?: string
  }): Promise<SalesOrder[]> {
    const supabase = createClient()

    let query = supabase
      .from('sales_orders')
      .select(`
        *,
        customer:contacts(id, display_name, email, phone),
        items:sales_order_items(*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.customerId) query = query.eq('contact_id', filters.customerId)
    if (filters?.fromDate) query = query.gte('order_date', filters.fromDate)
    if (filters?.toDate) query = query.lte('order_date', filters.toDate)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching sales orders:', error)
      return []
    }

    return (data || []).map(mapOrderFromDb)
  },

  async getOrder(id: string, organizationId: string): Promise<SalesOrder | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:contacts(id, display_name, email, phone),
        items:sales_order_items(*, product:products(id, name, sku))
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
      
      return { ...item, total: itemTotal }
    })
    
    const discount = input.discount || 0
    const shippingCost = input.shippingCost || 0
    const total = subtotal - discount + taxTotal + shippingCost

    const { data: orderData, error: orderError } = await supabase
      .from('sales_orders')
      .insert({
        organization_id: organizationId,
        order_number: generateOrderNumber(),
        contact_id: input.customerId,
        shipping_address: input.shippingAddress ? {
          street: input.shippingAddress.street,
          city: input.shippingAddress.city,
          state: input.shippingAddress.state,
          postal_code: input.shippingAddress.postalCode,
          country: input.shippingAddress.country,
        } : null,
        billing_address: input.billingAddress ? {
          street: input.billingAddress.street,
          city: input.billingAddress.city,
          state: input.billingAddress.state,
          postal_code: input.billingAddress.postalCode,
          country: input.billingAddress.country,
        } : null,
        status: 'draft',
        fulfillment_status: 'unfulfilled',
        subtotal,
        tax_amount: taxTotal,
        shipping_amount: shippingCost,
        discount_amount: discount,
        total,
        currency: 'CAD',
        shipping_method: input.shippingMethod,
        notes: input.notes,
        internal_notes: input.internalNotes,
        expected_date: input.expectedDelivery,
        warehouse_id: input.warehouseId,
        order_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating sales order:', orderError)
      return null
    }

    // Insert line items
    if (items.length > 0) {
      const lineItems = items.map((item, idx) => ({
        sales_order_id: orderData.id,
        line_number: idx + 1,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate || 0,
        discount_amount: item.discount || 0,
        line_total: item.total,
        fulfilled_quantity: 0,
        backordered_quantity: 0,
      }))

      const { error: itemsError } = await supabase.from('sales_order_items').insert(lineItems)
      if (itemsError) console.error('Error inserting order items:', itemsError)
    }

    return this.getOrder(orderData.id, organizationId)
  },

  async updateOrderStatus(id: string, status: SalesOrderStatus, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    const updates: Record<string, any> = { status, updated_at: new Date().toISOString() }
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

  async getStats(organizationId: string): Promise<SalesStats> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('sales_orders')
      .select('status, total')
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error fetching sales stats:', error)
      return { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, pendingOrders: 0, shippedOrders: 0, deliveredOrders: 0 }
    }

    const orders = data || []
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)

    return {
      totalOrders: orders.length,
      totalRevenue,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      pendingOrders: orders.filter(o => ['draft', 'confirmed', 'processing'].includes(o.status)).length,
      shippedOrders: orders.filter(o => o.status === 'shipped').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length,
    }
  },

  async searchOrders(query: string, organizationId: string): Promise<SalesOrder[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('sales_orders')
      .select(`*, customer:contacts(id, display_name, email)`)
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
// MAPPER
// ============================================================================

function mapOrderFromDb(row: any): SalesOrder {
  const shippingAddr = row.shipping_address || {}
  const billingAddr = row.billing_address || {}
  
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.contact_id,
    customerName: row.customer?.display_name || 'Unknown',
    customerEmail: row.customer?.email || '',
    shippingAddress: {
      street: shippingAddr.street || '',
      city: shippingAddr.city || '',
      state: shippingAddr.state || '',
      postalCode: shippingAddr.postal_code || '',
      country: shippingAddr.country || 'CA',
    },
    billingAddress: billingAddr.street ? {
      street: billingAddr.street,
      city: billingAddr.city,
      state: billingAddr.state,
      postalCode: billingAddr.postal_code,
      country: billingAddr.country || 'CA',
    } : undefined,
    status: row.status,
    paymentStatus: row.fulfillment_status || 'unfulfilled',
    items: (row.items || []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product?.name || 'Unknown',
      sku: item.product?.sku || '',
      quantity: item.quantity,
      unitPrice: item.unit_price,
      taxRate: item.tax_rate || 0,
      discount: item.discount_amount || 0,
      total: item.line_total,
      fulfilledQuantity: item.fulfilled_quantity || 0,
      backorderedQuantity: item.backordered_quantity || 0,
    })),
    subtotal: row.subtotal,
    taxTotal: row.tax_amount || 0,
    shippingCost: row.shipping_amount || 0,
    discount: row.discount_amount || 0,
    total: row.total,
    amountPaid: 0, // sales_orders doesn't track payments - use invoices
    amountDue: row.total,
    currency: row.currency || 'CAD',
    shippingMethod: row.shipping_method,
    trackingNumber: row.tracking_number,
    notes: row.notes,
    internalNotes: row.internal_notes,
    expectedDelivery: row.expected_date,
    shippedAt: null,
    deliveredAt: null,
    warehouseId: row.warehouse_id,
    orderDate: row.order_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default salesService
