import { createClient } from '@/lib/supabase/client'

// =============================================================================
// TYPES
// =============================================================================

export type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'partial' | 'completed' | 'cancelled'

export interface PurchaseOrder {
  id: string
  organizationId: string
  orderNumber: string
  vendorRef?: string
  contactId: string
  vendorName?: string
  orderDate: string
  expectedDate?: string
  status: OrderStatus
  currency: string
  subtotal: number
  discountAmount: number
  taxAmount: number
  shippingAmount: number
  total: number
  shipToAddress?: any
  warehouseId?: string
  warehouseName?: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
  internalNotes?: string
  billId?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  lineNumber: number
  productId?: string
  productName?: string
  productSku?: string
  variantId?: string
  description: string
  quantity: number
  quantityReceived: number
  unitPrice: number
  taxRate: number
  taxAmount: number
  lineTotal: number
}

export interface CreatePurchaseOrderInput {
  vendorRef?: string
  contactId: string
  orderDate?: string
  expectedDate?: string
  warehouseId?: string
  notes?: string
  internalNotes?: string
  items: CreatePurchaseOrderItemInput[]
}

export interface CreatePurchaseOrderItemInput {
  productId?: string
  variantId?: string
  description: string
  quantity: number
  unitPrice: number
  taxRate?: number
}

export interface PurchaseStats {
  totalOrders: number
  draftOrders: number
  pendingReceipt: number
  totalValue: number
  overdueOrders: number
}

// =============================================================================
// SERVICE
// =============================================================================

export const purchasesService = {
  async getPurchaseOrders(organizationId: string, filters?: {
    status?: OrderStatus
    contactId?: string
    startDate?: string
    endDate?: string
  }): Promise<PurchaseOrder[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        contact:contacts(name),
        warehouse:warehouses(name)
      `)
      .eq('organization_id', organizationId)
      .order('order_date', { ascending: false })
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.contactId) {
      query = query.eq('contact_id', filters.contactId)
    }
    if (filters?.startDate) {
      query = query.gte('order_date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('order_date', filters.endDate)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching purchase orders:', error)
      return []
    }
    
    return (data || []).map(row => ({
      ...mapPurchaseOrderFromDb(row),
      vendorName: row.contact?.name,
      warehouseName: row.warehouse?.name,
    }))
  },
  
  async getPurchaseOrder(id: string, organizationId: string): Promise<PurchaseOrder | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        contact:contacts(name),
        warehouse:warehouses(name),
        items:purchase_order_items(
          *,
          product:products(name, sku)
        )
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()
    
    if (error) {
      console.error('Error fetching purchase order:', error)
      return null
    }
    
    return {
      ...mapPurchaseOrderFromDb(data),
      vendorName: data.contact?.name,
      warehouseName: data.warehouse?.name,
      items: (data.items || []).map((item: any) => ({
        ...mapItemFromDb(item),
        productName: item.product?.name,
        productSku: item.product?.sku,
      })),
    }
  },
  
  async createPurchaseOrder(input: CreatePurchaseOrderInput, organizationId: string, userId: string): Promise<PurchaseOrder | null> {
    const supabase = createClient()
    
    // Generate order number
    const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}`
    
    // Calculate totals
    let subtotal = 0
    let taxAmount = 0
    
    input.items.forEach(item => {
      const lineTotal = item.quantity * item.unitPrice
      const lineTax = lineTotal * ((item.taxRate || 0) / 100)
      subtotal += lineTotal
      taxAmount += lineTax
    })
    
    const total = subtotal + taxAmount
    
    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        organization_id: organizationId,
        order_number: orderNumber,
        vendor_ref: input.vendorRef,
        contact_id: input.contactId,
        order_date: input.orderDate || new Date().toISOString().split('T')[0],
        expected_date: input.expectedDate,
        warehouse_id: input.warehouseId,
        notes: input.notes,
        internal_notes: input.internalNotes,
        status: 'draft',
        currency: 'CAD',
        subtotal,
        tax_amount: taxAmount,
        total,
        created_by: userId,
      })
      .select()
      .single()
    
    if (orderError) {
      console.error('Error creating purchase order:', orderError)
      return null
    }
    
    // Insert items
    const items = input.items.map((item, index) => ({
      purchase_order_id: order.id,
      line_number: index + 1,
      product_id: item.productId,
      variant_id: item.variantId,
      description: item.description,
      quantity: item.quantity,
      quantity_received: 0,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate || 0,
      tax_amount: item.quantity * item.unitPrice * ((item.taxRate || 0) / 100),
      line_total: item.quantity * item.unitPrice,
    }))
    
    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(items)
    
    if (itemsError) {
      console.error('Error creating purchase order items:', itemsError)
    }
    
    return mapPurchaseOrderFromDb(order)
  },
  
  async updatePurchaseOrder(id: string, input: Partial<CreatePurchaseOrderInput>, organizationId: string): Promise<PurchaseOrder | null> {
    const supabase = createClient()
    
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    
    if (input.vendorRef !== undefined) updates.vendor_ref = input.vendorRef
    if (input.contactId !== undefined) updates.contact_id = input.contactId
    if (input.orderDate !== undefined) updates.order_date = input.orderDate
    if (input.expectedDate !== undefined) updates.expected_date = input.expectedDate
    if (input.warehouseId !== undefined) updates.warehouse_id = input.warehouseId
    if (input.notes !== undefined) updates.notes = input.notes
    if (input.internalNotes !== undefined) updates.internal_notes = input.internalNotes
    
    // If items provided, recalculate totals and update items
    if (input.items) {
      let subtotal = 0
      let taxAmount = 0
      
      input.items.forEach(item => {
        const lineTotal = item.quantity * item.unitPrice
        const lineTax = lineTotal * ((item.taxRate || 0) / 100)
        subtotal += lineTotal
        taxAmount += lineTax
      })
      
      updates.subtotal = subtotal
      updates.tax_amount = taxAmount
      updates.total = subtotal + taxAmount
      
      // Delete existing items
      await supabase
        .from('purchase_order_items')
        .delete()
        .eq('purchase_order_id', id)
      
      // Insert new items
      const items = input.items.map((item, index) => ({
        purchase_order_id: id,
        line_number: index + 1,
        product_id: item.productId,
        variant_id: item.variantId,
        description: item.description,
        quantity: item.quantity,
        quantity_received: 0,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate || 0,
        tax_amount: item.quantity * item.unitPrice * ((item.taxRate || 0) / 100),
        line_total: item.quantity * item.unitPrice,
      }))
      
      await supabase.from('purchase_order_items').insert(items)
    }
    
    const { data, error } = await supabase
      .from('purchase_orders')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating purchase order:', error)
      return null
    }
    
    return mapPurchaseOrderFromDb(data)
  },
  
  async updateStatus(id: string, status: OrderStatus, organizationId: string, userId?: string): Promise<boolean> {
    const supabase = createClient()
    
    const updates: Record<string, any> = { 
      status,
      updated_at: new Date().toISOString()
    }
    
    if (status === 'confirmed' && userId) {
      updates.approved_by = userId
      updates.approved_at = new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('purchase_orders')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error updating purchase order status:', error)
      return false
    }
    
    return true
  },
  
  async receiveItems(id: string, items: { itemId: string; quantityReceived: number }[], organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    // Update each item
    for (const item of items) {
      const { error } = await supabase
        .from('purchase_order_items')
        .update({ quantity_received: item.quantityReceived })
        .eq('id', item.itemId)
        .eq('purchase_order_id', id)
      
      if (error) {
        console.error('Error receiving item:', error)
        return false
      }
    }
    
    // Check if all items are received
    const { data: orderItems } = await supabase
      .from('purchase_order_items')
      .select('quantity, quantity_received')
      .eq('purchase_order_id', id)
    
    if (orderItems) {
      const allReceived = orderItems.every(item => item.quantity_received >= item.quantity)
      const someReceived = orderItems.some(item => item.quantity_received > 0)
      
      let newStatus: OrderStatus = 'processing'
      if (allReceived) {
        newStatus = 'completed'
      } else if (someReceived) {
        newStatus = 'partial'
      }
      
      await supabase
        .from('purchase_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('organization_id', organizationId)
    }
    
    return true
  },
  
  async deletePurchaseOrder(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    // Only allow deleting draft orders
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('status', 'draft')
    
    if (error) {
      console.error('Error deleting purchase order:', error)
      return false
    }
    
    return true
  },
  
  async getStats(organizationId: string): Promise<PurchaseStats> {
    const supabase = createClient()
    
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('status, total, expected_date')
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error fetching purchase stats:', error)
      return { totalOrders: 0, draftOrders: 0, pendingReceipt: 0, totalValue: 0, overdueOrders: 0 }
    }
    
    const orders = data || []
    
    return {
      totalOrders: orders.length,
      draftOrders: orders.filter(o => o.status === 'draft').length,
      pendingReceipt: orders.filter(o => ['confirmed', 'processing', 'partial'].includes(o.status)).length,
      totalValue: orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0),
      overdueOrders: orders.filter(o => 
        o.expected_date && 
        o.expected_date < today && 
        !['completed', 'cancelled'].includes(o.status)
      ).length,
    }
  },
  
  async getVendors(organizationId: string): Promise<{ id: string; name: string }[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('contacts')
      .select('id, name')
      .eq('organization_id', organizationId)
      .eq('is_vendor', true)
      .order('name')
    
    if (error) {
      console.error('Error fetching vendors:', error)
      return []
    }
    
    return data || []
  },
}

// =============================================================================
// MAPPERS
// =============================================================================

function mapPurchaseOrderFromDb(row: any): PurchaseOrder {
  return {
    id: row.id,
    organizationId: row.organization_id,
    orderNumber: row.order_number,
    vendorRef: row.vendor_ref,
    contactId: row.contact_id,
    orderDate: row.order_date,
    expectedDate: row.expected_date,
    status: row.status || 'draft',
    currency: row.currency || 'CAD',
    subtotal: row.subtotal || 0,
    discountAmount: row.discount_amount || 0,
    taxAmount: row.tax_amount || 0,
    shippingAmount: row.shipping_amount || 0,
    total: row.total || 0,
    shipToAddress: row.ship_to_address,
    warehouseId: row.warehouse_id,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    notes: row.notes,
    internalNotes: row.internal_notes,
    billId: row.bill_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapItemFromDb(row: any): PurchaseOrderItem {
  return {
    id: row.id,
    purchaseOrderId: row.purchase_order_id,
    lineNumber: row.line_number,
    productId: row.product_id,
    variantId: row.variant_id,
    description: row.description,
    quantity: row.quantity || 0,
    quantityReceived: row.quantity_received || 0,
    unitPrice: row.unit_price || 0,
    taxRate: row.tax_rate || 0,
    taxAmount: row.tax_amount || 0,
    lineTotal: row.line_total || 0,
  }
}

export default purchasesService
