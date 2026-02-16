import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

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
  taxRate: number // percentage
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
  
  // Addresses
  billingAddress: {
    street: string
    city: string
    province: string
    postalCode: string
    country: string
  }
  
  // Dates
  invoiceDate: string
  dueDate: string
  paidDate?: string
  
  // Status
  status: InvoiceStatus
  
  // Line items
  items: InvoiceLineItem[]
  
  // Totals
  subtotal: number
  discountTotal: number
  taxTotal: number
  total: number
  amountPaid: number
  amountDue: number
  
  // Tax breakdown (Canadian)
  gstAmount?: number
  hstAmount?: number
  pstAmount?: number
  qstAmount?: number
  
  // Settings
  currency: string
  paymentTerms: string
  
  // References
  salesOrderId?: string
  quoteId?: string
  
  // Notes
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
  items: {
    productId?: string
    description: string
    quantity: number
    unitPrice: number
    taxRate?: number
    discount?: number
  }[]
  invoiceDate?: string
  dueDate?: string
  paymentTerms?: string
  notes?: string
  internalNotes?: string
  terms?: string
  footer?: string
  salesOrderId?: string
}

export interface InvoiceStats {
  totalInvoices: number
  totalRevenue: number
  totalPaid: number
  totalOutstanding: number
  overdueCount: number
  overdueAmount: number
}

// ============================================================================
// DEMO DATA
// ============================================================================

const demoInvoices: Invoice[] = [
  {
    id: 'demo-inv-1',
    organizationId: 'demo',
    invoiceNumber: 'INV-2024-0001',
    customerId: 'demo-1',
    customerName: 'Maple Leaf Pharmacy',
    customerEmail: 'orders@mapleleafpharmacy.ca',
    customerPhone: '416-555-0101',
    billingAddress: {
      street: '123 Yonge Street',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5B 1M4',
      country: 'CA',
    },
    invoiceDate: '2024-02-01',
    dueDate: '2024-03-02',
    status: 'paid',
    paidDate: '2024-02-15',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        description: 'Acetaminophen 500mg - 100 bottles',
        quantity: 100,
        unitPrice: 12.99,
        taxRate: 13,
        discount: 0,
        amount: 1467.87,
      },
    ],
    subtotal: 1299.00,
    discountTotal: 0,
    taxTotal: 168.87,
    hstAmount: 168.87,
    total: 1467.87,
    amountPaid: 1467.87,
    amountDue: 0,
    currency: 'CAD',
    paymentTerms: 'Net 30',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-15T14:30:00Z',
    sentAt: '2024-02-01T10:15:00Z',
  },
  {
    id: 'demo-inv-2',
    organizationId: 'demo',
    invoiceNumber: 'INV-2024-0002',
    customerId: 'demo-2',
    customerName: 'Northern Health Clinic',
    customerEmail: 'purchasing@northernhealth.ca',
    billingAddress: {
      street: '456 King Street West',
      city: 'Mississauga',
      province: 'ON',
      postalCode: 'L5B 3M7',
      country: 'CA',
    },
    invoiceDate: '2024-02-10',
    dueDate: '2024-02-25',
    status: 'sent',
    items: [
      {
        id: 'item-2',
        productId: 'prod-3',
        description: 'Blood Pressure Monitor - Pro Series',
        quantity: 5,
        unitPrice: 89.99,
        taxRate: 13,
        discount: 45.00,
        amount: 462.94,
      },
      {
        id: 'item-3',
        description: 'Installation and Training',
        quantity: 1,
        unitPrice: 150.00,
        taxRate: 13,
        discount: 0,
        amount: 169.50,
      },
    ],
    subtotal: 599.95,
    discountTotal: 45.00,
    taxTotal: 77.49,
    hstAmount: 77.49,
    total: 632.44,
    amountPaid: 0,
    amountDue: 632.44,
    currency: 'CAD',
    paymentTerms: 'Net 15',
    notes: 'Thank you for your business!',
    createdAt: '2024-02-10T09:00:00Z',
    updatedAt: '2024-02-10T09:30:00Z',
    sentAt: '2024-02-10T09:30:00Z',
  },
  {
    id: 'demo-inv-3',
    organizationId: 'demo',
    invoiceNumber: 'INV-2024-0003',
    customerId: 'demo-4',
    customerName: 'PharmaCare Distribution',
    customerEmail: 'info@pharmacare.ca',
    billingAddress: {
      street: '321 Centre Street',
      city: 'Calgary',
      province: 'AB',
      postalCode: 'T2G 0B5',
      country: 'CA',
    },
    invoiceDate: '2024-01-15',
    dueDate: '2024-02-14',
    status: 'overdue',
    items: [
      {
        id: 'item-4',
        description: 'Wholesale Medication Bundle Q1',
        quantity: 1,
        unitPrice: 5000.00,
        taxRate: 5,
        discount: 250.00,
        amount: 4987.50,
      },
    ],
    subtotal: 5000.00,
    discountTotal: 250.00,
    taxTotal: 237.50,
    gstAmount: 237.50,
    total: 4987.50,
    amountPaid: 2000.00,
    amountDue: 2987.50,
    currency: 'CAD',
    paymentTerms: 'Net 30',
    notes: 'Partial payment received. Balance due immediately.',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
    sentAt: '2024-01-15T11:30:00Z',
  },
]

// ============================================================================
// TAX CALCULATION (Canadian)
// ============================================================================

interface TaxBreakdown {
  gst: number
  hst: number
  pst: number
  qst: number
  total: number
}

const provinceTaxRates: Record<string, { type: 'GST' | 'HST' | 'GST+PST' | 'GST+QST'; rate: number; pstRate?: number }> = {
  AB: { type: 'GST', rate: 5 },
  BC: { type: 'GST+PST', rate: 5, pstRate: 7 },
  MB: { type: 'GST+PST', rate: 5, pstRate: 7 },
  NB: { type: 'HST', rate: 15 },
  NL: { type: 'HST', rate: 15 },
  NS: { type: 'HST', rate: 15 },
  NT: { type: 'GST', rate: 5 },
  NU: { type: 'GST', rate: 5 },
  ON: { type: 'HST', rate: 13 },
  PE: { type: 'HST', rate: 15 },
  QC: { type: 'GST+QST', rate: 5, pstRate: 9.975 },
  SK: { type: 'GST+PST', rate: 5, pstRate: 6 },
  YT: { type: 'GST', rate: 5 },
}

export function calculateCanadianTax(amount: number, province: string): TaxBreakdown {
  const taxInfo = provinceTaxRates[province] || provinceTaxRates.ON
  
  let gst = 0, hst = 0, pst = 0, qst = 0
  
  if (taxInfo.type === 'HST') {
    hst = amount * (taxInfo.rate / 100)
  } else if (taxInfo.type === 'GST') {
    gst = amount * (taxInfo.rate / 100)
  } else if (taxInfo.type === 'GST+PST') {
    gst = amount * (taxInfo.rate / 100)
    pst = amount * ((taxInfo.pstRate || 0) / 100)
  } else if (taxInfo.type === 'GST+QST') {
    gst = amount * (taxInfo.rate / 100)
    qst = amount * ((taxInfo.pstRate || 0) / 100)
  }
  
  return {
    gst: Math.round(gst * 100) / 100,
    hst: Math.round(hst * 100) / 100,
    pst: Math.round(pst * 100) / 100,
    qst: Math.round(qst * 100) / 100,
    total: Math.round((gst + hst + pst + qst) * 100) / 100,
  }
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `INV-${year}-${seq}`
}

export const invoicesService = {
  // Get all invoices
  async getInvoices(organizationId: string, filters?: {
    status?: InvoiceStatus
    customerId?: string
    fromDate?: string
    toDate?: string
  }): Promise<Invoice[]> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() ) {
      let result = [...demoInvoices]
      if (filters?.status) {
        result = result.filter(i => i.status === filters.status)
      }
      if (filters?.customerId) {
        result = result.filter(i => i.customerId === filters.customerId)
      }
      return result
    }

    let query = supabase
      .from('invoices')
      .select(`
        *,
        customer:contacts!invoices_contact_id_fkey(id, display_name, email, phone),
        items:invoice_items(*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.customerId) {
      query = query.eq('contact_id', filters.customerId)
    }
    if (filters?.fromDate) {
      query = query.gte('invoice_date', filters.fromDate)
    }
    if (filters?.toDate) {
      query = query.lte('invoice_date', filters.toDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching invoices:', error)
      return demoInvoices
    }

    return (data || []).map(mapInvoiceFromDb)
  },

  // Get single invoice
  async getInvoice(id: string, organizationId: string): Promise<Invoice | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() ) {
      return demoInvoices.find(i => i.id === id) || null
    }

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

  // Create invoice
  async createInvoice(input: CreateInvoiceInput, organizationId: string): Promise<Invoice | null> {
    const supabase = createClient()
    
    // Calculate totals
    let subtotal = 0
    let discountTotal = 0
    let taxTotal = 0
    
    const items = input.items.map((item, idx) => {
      const itemSubtotal = item.quantity * item.unitPrice
      const itemDiscount = item.discount || 0
      const itemAfterDiscount = itemSubtotal - itemDiscount
      const itemTax = itemAfterDiscount * ((item.taxRate || 0) / 100)
      const itemTotal = itemAfterDiscount + itemTax
      
      subtotal += itemSubtotal
      discountTotal += itemDiscount
      taxTotal += itemTax
      
      return {
        ...item,
        taxRate: item.taxRate || 0,
        discount: itemDiscount,
        amount: itemTotal,
      }
    })
    
    const total = subtotal - discountTotal + taxTotal
    
    if (!supabase || !isSupabaseConfigured() ) {
      const invoiceDate = input.invoiceDate || new Date().toISOString().split('T')[0]
      const dueDate = input.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const newInvoice: Invoice = {
        id: `demo-inv-${Date.now()}`,
        organizationId: 'demo',
        invoiceNumber: generateInvoiceNumber(),
        customerId: input.customerId,
        customerName: 'Demo Customer',
        billingAddress: {
          street: '',
          city: '',
          province: 'ON',
          postalCode: '',
          country: 'CA',
        },
        invoiceDate,
        dueDate,
        status: 'draft',
        items: items.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          ...item,
        })),
        subtotal,
        discountTotal,
        taxTotal,
        total,
        amountPaid: 0,
        amountDue: total,
        currency: 'CAD',
        paymentTerms: input.paymentTerms || 'Net 30',
        notes: input.notes,
        internalNotes: input.internalNotes,
        terms: input.terms,
        footer: input.footer,
        salesOrderId: input.salesOrderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      demoInvoices.push(newInvoice)
      return newInvoice
    }

    // Insert invoice
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

    // Insert invoice items
    const invoiceItems = items.map((item, idx) => ({
      invoice_id: invoiceData.id,
      product_id: item.productId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate,
      discount_amount: item.discount,
      line_total: item.amount,
      sort_order: idx,
    }))

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)

    if (itemsError) {
      console.error('Error creating invoice items:', itemsError)
    }

    return this.getInvoice(invoiceData.id, organizationId)
  },

  // Update invoice status
  async updateInvoiceStatus(id: string, status: InvoiceStatus, organizationId: string, paidDate?: string): Promise<boolean> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() ) {
      const invoice = demoInvoices.find(i => i.id === id)
      if (invoice) {
        invoice.status = status
        invoice.updatedAt = new Date().toISOString()
        if (status === 'paid') {
          invoice.paidDate = paidDate || new Date().toISOString().split('T')[0]
          invoice.amountPaid = invoice.total
          invoice.amountDue = 0
        }
        if (status === 'sent') {
          invoice.sentAt = new Date().toISOString()
        }
        return true
      }
      return false
    }

    const updates: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    }
    
    if (status === 'paid') {
      updates.paid_date = paidDate || new Date().toISOString().split('T')[0]
    }
    if (status === 'sent') {
      updates.sent_at = new Date().toISOString()
    }

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

  // Record payment
  async recordPayment(id: string, amount: number, organizationId: string, paymentDate?: string): Promise<boolean> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() ) {
      const invoice = demoInvoices.find(i => i.id === id)
      if (invoice) {
        invoice.amountPaid += amount
        invoice.amountDue = Math.max(0, invoice.total - invoice.amountPaid)
        invoice.status = invoice.amountDue === 0 ? 'paid' : 'partial'
        invoice.updatedAt = new Date().toISOString()
        if (invoice.amountDue === 0) {
          invoice.paidDate = paymentDate || new Date().toISOString().split('T')[0]
        }
        return true
      }
      return false
    }

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
    const newBalanceDue = Math.max(0, invoice.total - newAmountPaid)
    const newStatus = newBalanceDue === 0 ? 'paid' : 'partial'

    const updates: Record<string, any> = {
      amount_paid: newAmountPaid,
      balance_due: newBalanceDue,
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (newBalanceDue === 0) {
      updates.paid_date = paymentDate || new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error recording payment:', error)
      return false
    }

    return true
  },

  // Get invoice stats
  async getStats(organizationId: string): Promise<InvoiceStats> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() ) {
      const overdue = demoInvoices.filter(i => i.status === 'overdue')
      return {
        totalInvoices: demoInvoices.length,
        totalRevenue: demoInvoices.reduce((sum, i) => sum + i.total, 0),
        totalPaid: demoInvoices.reduce((sum, i) => sum + i.amountPaid, 0),
        totalOutstanding: demoInvoices.reduce((sum, i) => sum + i.amountDue, 0),
        overdueCount: overdue.length,
        overdueAmount: overdue.reduce((sum, i) => sum + i.amountDue, 0),
      }
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('status, total, amount_paid, balance_due')
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error fetching invoice stats:', error)
      return {
        totalInvoices: 0,
        totalRevenue: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        overdueCount: 0,
        overdueAmount: 0,
      }
    }

    const invoices = data || []
    const overdue = invoices.filter(i => i.status === 'overdue')
    
    return {
      totalInvoices: invoices.length,
      totalRevenue: invoices.reduce((sum, i) => sum + (i.total || 0), 0),
      totalPaid: invoices.reduce((sum, i) => sum + (i.amount_paid || 0), 0),
      totalOutstanding: invoices.reduce((sum, i) => sum + (i.balance_due || 0), 0),
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((sum, i) => sum + (i.balance_due || 0), 0),
    }
  },
}

// ============================================================================
// MAPPERS
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
      province: row.customer?.billing_state || row.billing_state || '',
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
    taxTotal: row.tax_amount,
    gstAmount: row.gst_amount,
    hstAmount: row.hst_amount,
    pstAmount: row.pst_amount,
    qstAmount: row.qst_amount,
    total: row.total,
    amountPaid: row.amount_paid || 0,
    amountDue: row.balance_due || row.total,
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
