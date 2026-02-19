import { createClient } from '@/lib/supabase/client'
import type { PurchaseOrder, POStatus, CreatePOInput, POStats, POLineItem, ReceiveItemInput } from '@/types/purchase-orders'

// Generate PO number
function generatePONumber(): string {
  const prefix = 'PO'
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${year}${month}-${random}`
}

export const purchaseOrdersService = {
  /**
   * Get all purchase orders
   */
  async getPurchaseOrders(organizationId: string, status?: POStatus): Promise<PurchaseOrder[]> {
    const supabase = createClient()

    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        vendor:contacts(id, display_name, email, phone)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch POs:', error)
      return []
    }

    return (data || []).map(po => ({
      ...po,
      vendor_name: po.vendor?.display_name || po.vendor_name,
      vendor_email: po.vendor?.email || po.vendor_email,
      items: po.items || [],
    }))
  },

  /**
   * Get a single PO
   */
  async getPurchaseOrder(poId: string, organizationId: string): Promise<PurchaseOrder | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        vendor:contacts(id, display_name, email, phone, billing_address_line1, billing_city, billing_state, billing_postal_code)
      `)
      .eq('id', poId)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Failed to fetch PO:', error)
      return null
    }

    return {
      ...data,
      vendor_name: data.vendor?.display_name || data.vendor_name,
      items: data.items || [],
    }
  },

  /**
   * Create a new purchase order
   */
  async createPO(organizationId: string, userId: string, input: CreatePOInput): Promise<PurchaseOrder | null> {
    const supabase = createClient()

    // Calculate items with amounts
    const items: POLineItem[] = input.items.map((item, idx) => {
      const base = item.quantity * item.unit_price
      const taxAmount = base * (item.tax_rate / 100)
      return {
        id: `item-${idx + 1}`,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate || 0,
        received_qty: 0,
        amount: base + taxAmount,
      }
    })

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const taxTotal = items.reduce((sum, item) => {
      const base = item.quantity * item.unit_price
      return sum + (base * item.tax_rate / 100)
    }, 0)
    const shipping = input.shipping || 0
    const total = subtotal + taxTotal + shipping

    const po = {
      organization_id: organizationId,
      po_number: generatePONumber(),
      vendor_id: input.vendor_id,
      vendor_name: input.vendor_name,
      vendor_email: input.vendor_email,
      order_date: input.order_date || new Date().toISOString().split('T')[0],
      expected_date: input.expected_date,
      items,
      subtotal,
      tax_total: taxTotal,
      shipping,
      total,
      currency: 'CAD',
      status: 'draft' as POStatus,
      shipping_method: input.shipping_method,
      notes: input.notes,
      internal_notes: input.internal_notes,
      created_by: userId,
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .insert(po)
      .select()
      .single()

    if (error) {
      console.error('Failed to create PO:', error)
      return null
    }

    return data
  },

  /**
   * Update a PO
   */
  async updatePO(poId: string, organizationId: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | null> {
    const supabase = createClient()

    // Recalculate totals if items changed
    if (updates.items) {
      const items = updates.items.map(item => ({
        ...item,
        amount: (item.quantity * item.unit_price) * (1 + item.tax_rate / 100),
      }))

      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
      const taxTotal = items.reduce((sum, item) => {
        const base = item.quantity * item.unit_price
        return sum + (base * item.tax_rate / 100)
      }, 0)

      updates.items = items
      updates.subtotal = subtotal
      updates.tax_total = taxTotal
      updates.total = subtotal + taxTotal + (updates.shipping || 0)
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', poId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update PO:', error)
      return null
    }

    return data
  },

  /**
   * Send PO to vendor
   */
  async sendPO(poId: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', poId)
      .eq('organization_id', organizationId)

    // TODO: Send email to vendor

    return !error
  },

  /**
   * Confirm PO (vendor accepted)
   */
  async confirmPO(poId: string, organizationId: string, expectedDate?: string): Promise<boolean> {
    const supabase = createClient()

    const updates: any = {
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (expectedDate) {
      updates.expected_date = expectedDate
    }

    const { error } = await supabase
      .from('purchase_orders')
      .update(updates)
      .eq('id', poId)
      .eq('organization_id', organizationId)

    return !error
  },

  /**
   * Receive items
   */
  async receiveItems(poId: string, organizationId: string, receivedItems: ReceiveItemInput[]): Promise<boolean> {
    const supabase = createClient()

    // Get current PO
    const po = await this.getPurchaseOrder(poId, organizationId)
    if (!po) return false

    // Update received quantities
    const updatedItems = po.items.map(item => {
      const received = receivedItems.find(r => r.line_item_id === item.id)
      if (received) {
        return { ...item, received_qty: item.received_qty + received.quantity }
      }
      return item
    })

    // Check if fully received
    const allReceived = updatedItems.every(item => item.received_qty >= item.quantity)
    const anyReceived = updatedItems.some(item => item.received_qty > 0)

    let newStatus: POStatus = po.status
    if (allReceived) {
      newStatus = 'received'
    } else if (anyReceived) {
      newStatus = 'partial'
    }

    const { error } = await supabase
      .from('purchase_orders')
      .update({
        items: updatedItems,
        status: newStatus,
        received_date: allReceived ? new Date().toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', poId)
      .eq('organization_id', organizationId)

    if (error) return false

    // Update inventory quantities for received items
    for (const item of updatedItems) {
      if (item.product_id) {
        const received = receivedItems.find(r => r.line_item_id === item.id)
        if (received && received.quantity > 0) {
          // Increment product inventory
          await supabase.rpc('increment_inventory', {
            p_product_id: item.product_id,
            p_quantity: received.quantity,
          })
        }
      }
    }

    return true
  },

  /**
   * Create bill from PO
   */
  async createBill(poId: string, organizationId: string): Promise<string | null> {
    const supabase = createClient()

    const po = await this.getPurchaseOrder(poId, organizationId)
    if (!po) return null

    // Create bill
    const billNumber = `BILL-${Date.now().toString().slice(-8)}`
    
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert({
        organization_id: organizationId,
        bill_number: billNumber,
        vendor_id: po.vendor_id,
        vendor_name: po.vendor_name,
        bill_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: po.items,
        subtotal: po.subtotal,
        tax_amount: po.tax_total,
        total: po.total,
        amount_due: po.total,
        currency: po.currency,
        status: 'pending',
        from_po_id: poId,
      })
      .select('id')
      .single()

    if (billError) {
      console.error('Failed to create bill from PO:', billError)
      return null
    }

    // Update PO status
    await supabase
      .from('purchase_orders')
      .update({
        status: 'billed',
        bill_id: bill.id,
        billed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', poId)

    return bill.id
  },

  /**
   * Cancel PO
   */
  async cancelPO(poId: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', poId)
      .eq('organization_id', organizationId)

    return !error
  },

  /**
   * Delete a PO (draft only)
   */
  async deletePO(poId: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', poId)
      .eq('organization_id', organizationId)
      .eq('status', 'draft')

    return !error
  },

  /**
   * Get PO statistics
   */
  async getPOStats(organizationId: string): Promise<POStats> {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: pos } = await supabase
      .from('purchase_orders')
      .select('status, total, expected_date')
      .eq('organization_id', organizationId)

    if (!pos) {
      return {
        total: 0,
        draft: 0,
        pending: 0,
        received: 0,
        total_value: 0,
        pending_value: 0,
        overdue: 0,
      }
    }

    return {
      total: pos.length,
      draft: pos.filter(p => p.status === 'draft').length,
      pending: pos.filter(p => ['sent', 'confirmed', 'partial'].includes(p.status)).length,
      received: pos.filter(p => p.status === 'received').length,
      total_value: pos.reduce((sum, p) => sum + (p.total || 0), 0),
      pending_value: pos
        .filter(p => ['sent', 'confirmed', 'partial'].includes(p.status))
        .reduce((sum, p) => sum + (p.total || 0), 0),
      overdue: pos.filter(p => 
        ['sent', 'confirmed'].includes(p.status) && 
        p.expected_date && 
        p.expected_date < today
      ).length,
    }
  },
}

export default purchaseOrdersService
