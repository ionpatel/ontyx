import { createClient } from '@/lib/supabase/client'
import type { 
  PurchaseOrder, 
  PurchaseOrderItem, 
  CreatePurchaseOrderInput, 
  UpdatePurchaseOrderInput,
  PurchaseOrderSummary,
  OrderStatus
} from '@/types/purchase-orders'

// Generate order number
async function generateOrderNumber(organizationId: string): Promise<string> {
  const supabase = createClient()
  const year = new Date().getFullYear()
  const prefix = `PO-${year}-`
  
  const { data } = await supabase
    .from('purchase_orders')
    .select('order_number')
    .eq('organization_id', organizationId)
    .ilike('order_number', `${prefix}%`)
    .order('order_number', { ascending: false })
    .limit(1)
    .single()
  
  if (data?.order_number) {
    const lastNum = parseInt(data.order_number.replace(prefix, ''), 10) || 0
    return `${prefix}${String(lastNum + 1).padStart(4, '0')}`
  }
  return `${prefix}0001`
}

// Calculate totals from items
function calculateTotals(items: CreatePurchaseOrderInput['items']) {
  let subtotal = 0
  let taxAmount = 0
  
  for (const item of items) {
    const lineTotal = item.quantity * item.unit_price
    const lineTax = lineTotal * ((item.tax_rate || 0) / 100)
    subtotal += lineTotal
    taxAmount += lineTax
  }
  
  return {
    subtotal,
    tax_amount: taxAmount,
    total: subtotal + taxAmount
  }
}

// Get all purchase orders
export async function getPurchaseOrders(organizationId: string): Promise<PurchaseOrder[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      contact:contacts!contact_id (
        id,
        display_name,
        email,
        phone
      ),
      warehouse:warehouses!warehouse_id (
        id,
        name,
        code
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

// Get single purchase order with items
export async function getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
  const supabase = createClient()
  
  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      contact:contacts!contact_id (
        id,
        display_name,
        email,
        phone,
        billing_address_line1,
        billing_city,
        billing_state,
        billing_postal_code
      ),
      warehouse:warehouses!warehouse_id (
        id,
        name,
        code
      )
    `)
    .eq('id', id)
    .single()
  
  if (poError) throw poError
  if (!po) return null
  
  // Get items
  const { data: items, error: itemsError } = await supabase
    .from('purchase_order_items')
    .select(`
      *,
      product:products!product_id (
        id,
        name,
        sku
      )
    `)
    .eq('purchase_order_id', id)
    .order('line_number')
  
  if (itemsError) throw itemsError
  
  return { ...po, items: items || [] }
}

// Create purchase order
export async function createPurchaseOrder(
  organizationId: string,
  input: CreatePurchaseOrderInput
): Promise<PurchaseOrder> {
  const supabase = createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // Generate order number
  const orderNumber = await generateOrderNumber(organizationId)
  
  // Calculate totals
  const totals = calculateTotals(input.items)
  
  // Create PO
  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .insert({
      organization_id: organizationId,
      order_number: orderNumber,
      contact_id: input.contact_id,
      order_date: input.order_date || new Date().toISOString().split('T')[0],
      expected_date: input.expected_date,
      vendor_ref: input.vendor_ref,
      currency: input.currency || 'CAD',
      warehouse_id: input.warehouse_id,
      ship_to_address: input.ship_to_address,
      notes: input.notes,
      internal_notes: input.internal_notes,
      status: 'draft',
      subtotal: totals.subtotal,
      tax_amount: totals.tax_amount,
      total: totals.total,
      discount_amount: 0,
      shipping_amount: 0,
      created_by: user.id
    })
    .select()
    .single()
  
  if (poError) throw poError
  
  // Create items
  const itemsToInsert = input.items.map((item, index) => {
    const lineTotal = item.quantity * item.unit_price
    const taxAmount = lineTotal * ((item.tax_rate || 0) / 100)
    
    return {
      purchase_order_id: po.id,
      line_number: index + 1,
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      quantity_received: 0,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate || 0,
      tax_amount: taxAmount,
      line_total: lineTotal + taxAmount
    }
  })
  
  const { error: itemsError } = await supabase
    .from('purchase_order_items')
    .insert(itemsToInsert)
  
  if (itemsError) throw itemsError
  
  return getPurchaseOrder(po.id) as Promise<PurchaseOrder>
}

// Update purchase order (header only)
export async function updatePurchaseOrder(
  id: string,
  input: UpdatePurchaseOrderInput
): Promise<PurchaseOrder> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('purchase_orders')
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
  
  if (error) throw error
  return getPurchaseOrder(id) as Promise<PurchaseOrder>
}

// Update PO status
export async function updatePurchaseOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  const supabase = createClient()
  
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString()
  }
  
  // If confirming, get current user for approval
  if (status === 'confirmed') {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      updateData.approved_by = user.id
      updateData.approved_at = new Date().toISOString()
    }
  }
  
  const { error } = await supabase
    .from('purchase_orders')
    .update(updateData)
    .eq('id', id)
  
  if (error) throw error
}

// Record items received
export async function receiveItems(
  purchaseOrderId: string,
  itemsReceived: { item_id: string; quantity_received: number }[]
): Promise<void> {
  const supabase = createClient()
  
  // Update each item
  for (const item of itemsReceived) {
    const { error } = await supabase
      .from('purchase_order_items')
      .update({ quantity_received: item.quantity_received })
      .eq('id', item.item_id)
    
    if (error) throw error
  }
  
  // Check if all items fully received
  const { data: items } = await supabase
    .from('purchase_order_items')
    .select('quantity, quantity_received')
    .eq('purchase_order_id', purchaseOrderId)
  
  if (items) {
    const allReceived = items.every(i => i.quantity_received >= i.quantity)
    const someReceived = items.some(i => i.quantity_received > 0)
    
    let newStatus: OrderStatus = 'processing'
    if (allReceived) newStatus = 'completed'
    else if (someReceived) newStatus = 'partial'
    
    await updatePurchaseOrderStatus(purchaseOrderId, newStatus)
  }
}

// Delete purchase order (only drafts)
export async function deletePurchaseOrder(id: string): Promise<void> {
  const supabase = createClient()
  
  // Check status first
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('status')
    .eq('id', id)
    .single()
  
  if (po?.status !== 'draft') {
    throw new Error('Only draft purchase orders can be deleted')
  }
  
  // Items deleted via cascade
  const { error } = await supabase
    .from('purchase_orders')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Get purchase order summary
export async function getPurchaseOrderSummary(organizationId: string): Promise<PurchaseOrderSummary> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('status, total')
    .eq('organization_id', organizationId)
  
  if (error) throw error
  
  const orders = data || []
  
  return {
    total_orders: orders.length,
    draft_count: orders.filter(o => o.status === 'draft').length,
    pending_count: orders.filter(o => ['confirmed', 'processing', 'partial'].includes(o.status)).length,
    completed_count: orders.filter(o => o.status === 'completed').length,
    total_value: orders.reduce((sum, o) => sum + (o.total || 0), 0),
    pending_value: orders
      .filter(o => ['confirmed', 'processing', 'partial'].includes(o.status))
      .reduce((sum, o) => sum + (o.total || 0), 0)
  }
}

// Convert PO to Bill
export async function convertToBill(purchaseOrderId: string): Promise<string> {
  const supabase = createClient()
  
  // Get PO with items
  const po = await getPurchaseOrder(purchaseOrderId)
  if (!po) throw new Error('Purchase order not found')
  
  // Generate bill number
  const year = new Date().getFullYear()
  const prefix = `BILL-${year}-`
  
  const { data: lastBill } = await supabase
    .from('bills')
    .select('bill_number')
    .eq('organization_id', po.organization_id)
    .ilike('bill_number', `${prefix}%`)
    .order('bill_number', { ascending: false })
    .limit(1)
    .single()
  
  let billNumber = `${prefix}0001`
  if (lastBill?.bill_number) {
    const lastNum = parseInt(lastBill.bill_number.replace(prefix, ''), 10) || 0
    billNumber = `${prefix}${String(lastNum + 1).padStart(4, '0')}`
  }
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Create bill
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .insert({
      organization_id: po.organization_id,
      bill_number: billNumber,
      vendor_ref: po.vendor_ref || po.order_number,
      contact_id: po.contact_id,
      bill_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: po.currency,
      subtotal: po.subtotal,
      tax_amount: po.tax_amount,
      total: po.total,
      amount_due: po.total,
      status: 'pending',
      notes: `Created from PO ${po.order_number}`,
      created_by: user?.id
    })
    .select()
    .single()
  
  if (billError) throw billError
  
  // Create bill items
  if (po.items && po.items.length > 0) {
    const billItems = po.items.map(item => ({
      bill_id: bill.id,
      line_number: item.line_number,
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      tax_amount: item.tax_amount,
      line_total: item.line_total
    }))
    
    const { error: itemsError } = await supabase
      .from('bill_items')
      .insert(billItems)
    
    if (itemsError) throw itemsError
  }
  
  // Link bill to PO
  await supabase
    .from('purchase_orders')
    .update({ bill_id: bill.id })
    .eq('id', purchaseOrderId)
  
  return bill.id
}
