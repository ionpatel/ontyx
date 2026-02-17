import { createClient } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'void'

export interface InvoiceLineItem {
  id: string
  productId?: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  discount: number
  amount: number
}

export interface Invoice {
  id: string
  organizationId: string
  invoiceNumber: string
  customerId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  billingAddress: {
    street: string
    city: string
    province: string
    postalCode: string
    country: string
  }
  invoiceDate: string
  dueDate: string
  paidDate?: string
  status: InvoiceStatus
  items: InvoiceLineItem[]
  subtotal: number
  discountTotal: number
  taxTotal: number
  total: number
  amountPaid: number
  amountDue: number
  gstAmount?: number
  hstAmount?: number
  pstAmount?: number
  qstAmount?: number
  currency: string
  paymentTerms: string
  salesOrderId?: string
  quoteId?: string
  notes?: string
  internalNotes?: string
  terms?: string
  footer?: string
  createdAt: string
  updatedAt: string
  sentAt?: string
}

export interface CreateInvoiceInput {
  customerId: string
  invoiceDate?: string
  dueDate?: string
  items: {
    productId?: string
    description: string
    quantity: number
    unitPrice: number
    taxRate?: number
    discount?: number
  }[]
  paymentTerms?: string
  notes?: string
  internalNotes?: string
  terms?: string
  footer?: string
  salesOrderId?: string
}

// ============================================================================
// SERVICE
// ============================================================================

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `INV-${year}-${seq}`
}

export const invoicesService = {
  async getInvoices(organizationId: string, filters?: {
    status?: InvoiceStatus
    customerId?: string
    fromDate?: string
    toDate?: string
  }): Promise<Invoice[]> {
    const supabase = createClient()

    let query = supabase
      .from('invoices')
      .select(`
        *,
        customer:contacts!invoices_contact_id_fkey(id, display_name, email, phone),
        items:invoice_items(*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.customerId) query = query.eq('contact_id', filters.customerId)
    if (filters?.fromDate) query = query.gte('invoice_date', filters.fromDate)
    if (filters?.toDate) query = query.lte('invoice_date', filters.toDate)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching invoices:', error)
      return []
    }

    return (data || []).map(mapInvoiceFromDb)
  },

  async getInvoice(id: string, organizationId: string): Promise<Invoice | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:contacts!invoices_contact_id_fkey(id, display_name, email, phone, billing_address_line1, billing_city, billing_state, billing_postal_code, billing_country),
        items:invoice_items(*)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching invoice:', error)
      return null
    }

    return mapInvoiceFromDb(data)
  },

  async createInvoice(input: CreateInvoiceInput, organizationId: string): Promise<Invoice | null> {
    const supabase = createClient()
    
    // Calculate totals
    let subtotal = 0
    let discountTotal = 0
    let taxTotal = 0
    
    const items = input.items.map(item => {
      const itemSubtotal = item.quantity * item.unitPrice
      const itemDiscount = item.discount || 0
      const itemAfterDiscount = itemSubtotal - itemDiscount
      const itemTax = itemAfterDiscount * ((item.taxRate || 0) / 100)
      const itemTotal = itemAfterDiscount + itemTax
      
      subtotal += itemSubtotal
      discountTotal += itemDiscount
      taxTotal += itemTax
      
      return { ...item, taxRate: item.taxRate || 0, discount: itemDiscount, amount: itemTotal }
    })
    
    const total = subtotal - discountTotal + taxTotal
    const invoiceDate = input.invoiceDate || new Date().toISOString().split('T')[0]
    const dueDate = input.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        organization_id: organizationId,
        invoice_number: generateInvoiceNumber(),
        contact_id: input.customerId,
        invoice_date: invoiceDate,
        due_date: dueDate,
        status: 'draft',
        subtotal,
        discount_amount: discountTotal,
        tax_amount: taxTotal,
        total,
        amount_paid: 0,
        balance_due: total,
        currency: 'CAD',
        payment_terms: 30,
        notes: input.notes,
        internal_notes: input.internalNotes,
        terms: input.terms,
        footer: input.footer,
        sales_order_id: input.salesOrderId,
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      return null
    }

    // Insert line items
    if (items.length > 0) {
      const lineItems = items.map((item, idx) => ({
        invoice_id: invoiceData.id,
        line_number: idx + 1,
        product_id: item.productId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        discount_amount: item.discount,
        line_total: item.amount,
      }))

      const { error: itemsError } = await supabase.from('invoice_items').insert(lineItems)
      if (itemsError) console.error('Error inserting invoice items:', itemsError)
    }

    return this.getInvoice(invoiceData.id, organizationId)
  },

  async updateInvoiceStatus(id: string, status: InvoiceStatus, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    const updates: Record<string, any> = { status, updated_at: new Date().toISOString() }
    if (status === 'sent') updates.sent_at = new Date().toISOString()
    if (status === 'paid') updates.paid_date = new Date().toISOString()

    const { error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating invoice status:', error)
      return false
    }
    return true
  },

  async recordPayment(id: string, amount: number, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    // Get current invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('amount_paid, total')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError || !invoice) {
      console.error('Error fetching invoice for payment:', fetchError)
      return false
    }

    const newAmountPaid = (invoice.amount_paid || 0) + amount
    const balanceDue = invoice.total - newAmountPaid
    const status = balanceDue <= 0 ? 'paid' : newAmountPaid > 0 ? 'partial' : 'sent'

    const { error } = await supabase
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        balance_due: balanceDue,
        status,
        paid_date: status === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error recording payment:', error)
      return false
    }
    return true
  },

  async deleteInvoice(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('invoices')
      .update({ status: 'void', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting invoice:', error)
      return false
    }
    return true
  },

  async getStats(organizationId: string): Promise<{
    totalInvoices: number
    totalAmount: number
    paidAmount: number
    overdueAmount: number
    draftCount: number
    sentCount: number
    paidCount: number
    overdueCount: number
  }> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('invoices')
      .select('status, total, amount_paid, balance_due')
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error fetching invoice stats:', error)
      return { totalInvoices: 0, totalAmount: 0, paidAmount: 0, overdueAmount: 0, draftCount: 0, sentCount: 0, paidCount: 0, overdueCount: 0 }
    }

    const invoices = data || []
    return {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, i) => sum + (i.total || 0), 0),
      paidAmount: invoices.reduce((sum, i) => sum + (i.amount_paid || 0), 0),
      overdueAmount: invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (i.balance_due || 0), 0),
      draftCount: invoices.filter(i => i.status === 'draft').length,
      sentCount: invoices.filter(i => i.status === 'sent').length,
      paidCount: invoices.filter(i => i.status === 'paid').length,
      overdueCount: invoices.filter(i => i.status === 'overdue').length,
    }
  },

  async searchInvoices(query: string, organizationId: string): Promise<Invoice[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('invoices')
      .select(`*, customer:contacts!invoices_contact_id_fkey(id, display_name, email), items:invoice_items(*)`)
      .eq('organization_id', organizationId)
      .or(`invoice_number.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error searching invoices:', error)
      return []
    }

    return (data || []).map(mapInvoiceFromDb)
  },
}

// ============================================================================
// MAPPER
// ============================================================================

function mapInvoiceFromDb(row: any): Invoice {
  return {
    id: row.id,
    organizationId: row.organization_id,
    invoiceNumber: row.invoice_number,
    customerId: row.contact_id,
    customerName: row.customer?.display_name || 'Unknown',
    customerEmail: row.customer?.email,
    customerPhone: row.customer?.phone,
    billingAddress: {
      street: row.customer?.billing_address_line1 || row.billing_street || '',
      city: row.customer?.billing_city || row.billing_city || '',
      province: row.customer?.billing_state || row.billing_state || 'ON',
      postalCode: row.customer?.billing_postal_code || row.billing_postal_code || '',
      country: row.customer?.billing_country || row.billing_country || 'CA',
    },
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    paidDate: row.paid_date,
    status: row.status,
    items: (row.items || []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      taxRate: item.tax_rate || 0,
      discount: item.discount_amount || 0,
      amount: item.line_total,
    })),
    subtotal: row.subtotal,
    discountTotal: row.discount_amount || 0,
    taxTotal: row.tax_amount || 0,
    total: row.total,
    amountPaid: row.amount_paid || 0,
    amountDue: row.balance_due || row.total,
    gstAmount: row.gst_amount,
    hstAmount: row.hst_amount,
    pstAmount: row.pst_amount,
    qstAmount: row.qst_amount,
    currency: row.currency || 'CAD',
    paymentTerms: `Net ${row.payment_terms || 30}`,
    salesOrderId: row.sales_order_id,
    quoteId: row.quote_id,
    notes: row.notes,
    internalNotes: row.internal_notes,
    terms: row.terms,
    footer: row.footer,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentAt: row.sent_at,
  }
}

export default invoicesService
