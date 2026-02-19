import { createClient } from '@/lib/supabase/client'
import type { Quote, QuoteStatus, CreateQuoteInput, QuoteStats, QuoteLineItem } from '@/types/quotes'

// Helper to get untyped table access for tables not in Supabase schema
const getQuotesTable = () => {
  const supabase = createClient()
  // Using 'as any' to bypass strict typing for tables not yet in generated types
  return (supabase as any).from('quotes')
}

// Database contact type (matches actual Supabase schema)
interface DBContact {
  id: string
  display_name: string
  email?: string
  phone?: string
  billing_address_line1?: string
  billing_city?: string
  billing_state?: string
  billing_postal_code?: string
}

// Database quote with joined contact
interface DBQuote {
  id: string
  organization_id: string
  contact_id?: string
  quote_number: string
  status: QuoteStatus
  quote_date: string
  valid_until: string
  title?: string
  summary?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  customer_address?: string
  subtotal: number
  discount_total: number
  tax_total: number
  total: number
  items: QuoteLineItem[]
  terms?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by: string
  contact?: DBContact
}

// Generate quote number
function generateQuoteNumber(): string {
  const prefix = 'QT'
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${year}${month}-${random}`
}

// Calculate line item amount
function calculateItemAmount(item: Omit<QuoteLineItem, 'id' | 'amount'>): number {
  const base = item.quantity * item.unitPrice
  const discountAmount = base * (item.discount / 100)
  const afterDiscount = base - discountAmount
  const taxAmount = afterDiscount * (item.taxRate / 100)
  return afterDiscount + taxAmount
}

export const quotesService = {
  /**
   * Get all quotes for an organization
   */
  async getQuotes(organizationId: string, status?: QuoteStatus): Promise<Quote[]> {
    const supabase = createClient()

    let query = supabase
      .from('quotes')
      .select(`
        *,
        contact:contacts(id, display_name, email, phone)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch quotes:', error)
      return []
    }

    return (data || []).map((q: DBQuote) => ({
      ...q,
      customer_name: q.contact?.display_name || q.customer_name,
      customer_email: q.contact?.email || q.customer_email,
      items: q.items || [],
    } as Quote))
  },

  /**
   * Get a single quote by ID
   */
  async getQuote(quoteId: string, organizationId: string): Promise<Quote | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        contact:contacts(id, display_name, email, phone, billing_address_line1, billing_city, billing_state, billing_postal_code)
      `)
      .eq('id', quoteId)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Failed to fetch quote:', error)
      return null
    }

    const q = data as DBQuote
    return {
      ...q,
      customer_name: q.contact?.display_name || q.customer_name,
      customer_email: q.contact?.email || q.customer_email,
      items: q.items || [],
    } as Quote
  },

  /**
   * Create a new quote
   */
  async createQuote(organizationId: string, userId: string, input: CreateQuoteInput): Promise<Quote | null> {
    const supabase = createClient()

    const quoteDate = input.quote_date || new Date().toISOString().split('T')[0]
    const validDays = input.valid_days || 30
    const validUntil = new Date(quoteDate)
    validUntil.setDate(validUntil.getDate() + validDays)

    // Calculate items with amounts
    const items: QuoteLineItem[] = input.items.map((item, idx) => ({
      id: `item-${idx + 1}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      taxRate: item.taxRate || 0,
      amount: calculateItemAmount(item),
    }))

    const subtotal = items.reduce((sum, item) => {
      const base = item.quantity * item.unitPrice
      return sum + base
    }, 0)

    const discountTotal = input.discount_total || items.reduce((sum, item) => {
      const base = item.quantity * item.unitPrice
      return sum + (base * item.discount / 100)
    }, 0)

    const taxTotal = items.reduce((sum, item) => {
      const base = item.quantity * item.unitPrice
      const afterDiscount = base - (base * item.discount / 100)
      return sum + (afterDiscount * item.taxRate / 100)
    }, 0)

    const total = subtotal - discountTotal + taxTotal

    const quote = {
      organization_id: organizationId,
      quote_number: generateQuoteNumber(),
      contact_id: input.contact_id,
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_phone: input.customer_phone,
      customer_address: input.customer_address,
      quote_date: quoteDate,
      valid_until: validUntil.toISOString().split('T')[0],
      title: input.title,
      summary: input.summary,
      items,
      subtotal,
      discount_total: discountTotal,
      tax_total: taxTotal,
      total,
      currency: input.currency || 'CAD',
      status: 'draft' as QuoteStatus,
      terms: input.terms,
      notes: input.notes,
      created_by: userId,
    }

    const { data, error } = await supabase
      .from('quotes')
      .insert(quote as any)
      .select()
      .single()

    if (error) {
      console.error('Failed to create quote:', error)
      return null
    }

    return data as Quote
  },

  /**
   * Update a quote
   */
  async updateQuote(quoteId: string, organizationId: string, updates: Partial<Quote>): Promise<Quote | null> {
    const supabase = createClient()

    // Recalculate totals if items changed
    if (updates.items) {
      const items = updates.items.map(item => ({
        ...item,
        amount: calculateItemAmount(item),
      }))

      const subtotal = items.reduce((sum, item) => {
        const base = item.quantity * item.unitPrice
        return sum + base
      }, 0)

      const discountTotal = items.reduce((sum, item) => {
        const base = item.quantity * item.unitPrice
        return sum + (base * item.discount / 100)
      }, 0)

      const taxTotal = items.reduce((sum, item) => {
        const base = item.quantity * item.unitPrice
        const afterDiscount = base - (base * item.discount / 100)
        return sum + (afterDiscount * item.taxRate / 100)
      }, 0)

      updates.items = items
      updates.subtotal = subtotal
      updates.discount_total = discountTotal
      updates.tax_total = taxTotal
      updates.total = subtotal - discountTotal + taxTotal
    }

    const { data, error } = await supabase
      .from('quotes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', quoteId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update quote:', error)
      return null
    }

    return data as Quote
  },

  /**
   * Send a quote to customer
   */
  async sendQuote(quoteId: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('quotes')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', quoteId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Failed to send quote:', error)
      return false
    }

    // TODO: Actually send email to customer

    return true
  },

  /**
   * Mark quote as accepted
   */
  async acceptQuote(quoteId: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('quotes')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', quoteId)
      .eq('organization_id', organizationId)

    return !error
  },

  /**
   * Mark quote as rejected
   */
  async rejectQuote(quoteId: string, organizationId: string, reason?: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('quotes')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', quoteId)
      .eq('organization_id', organizationId)

    return !error
  },

  /**
   * Convert quote to invoice
   */
  async convertToInvoice(quoteId: string, organizationId: string): Promise<string | null> {
    const supabase = createClient()

    // Get the quote
    const quote = await this.getQuote(quoteId, organizationId)
    if (!quote) return null

    // Create invoice from quote
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`
    
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        organization_id: organizationId,
        invoice_number: invoiceNumber,
        contact_id: quote.contact_id,
        customer_name: quote.customer_name,
        customer_email: quote.customer_email,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: quote.items,
        subtotal: quote.subtotal,
        tax_amount: quote.tax_total,
        total: quote.total,
        amount_due: quote.total,
        currency: quote.currency,
        status: 'draft',
        notes: `Converted from Quote ${quote.quote_number}`,
        from_quote_id: quoteId,
      } as any)
      .select('id')
      .single()

    if (invoiceError || !invoice) {
      console.error('Failed to create invoice from quote:', invoiceError)
      return null
    }

    // Update quote status
    await supabase
      .from('quotes')
      .update({
        status: 'converted',
        converted_to_invoice_id: invoice.id,
        converted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', quoteId)

    return invoice.id
  },

  /**
   * Delete a quote
   */
  async deleteQuote(quoteId: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId)
      .eq('organization_id', organizationId)

    return !error
  },

  /**
   * Get quote statistics
   */
  async getQuoteStats(organizationId: string): Promise<QuoteStats> {
    const supabase = createClient()

    const { data: quotes } = await supabase
      .from('quotes')
      .select('status, total')
      .eq('organization_id', organizationId)

    if (!quotes) {
      return {
        total: 0,
        draft: 0,
        sent: 0,
        accepted: 0,
        rejected: 0,
        expired: 0,
        converted: 0,
        total_value: 0,
        accepted_value: 0,
        conversion_rate: 0,
      }
    }

    const stats = {
      total: quotes.length,
      draft: quotes.filter(q => q.status === 'draft').length,
      sent: quotes.filter(q => q.status === 'sent').length,
      accepted: quotes.filter(q => q.status === 'accepted').length,
      rejected: quotes.filter(q => q.status === 'rejected').length,
      expired: quotes.filter(q => q.status === 'expired').length,
      converted: quotes.filter(q => q.status === 'converted').length,
      total_value: quotes.reduce((sum, q) => sum + (q.total || 0), 0),
      accepted_value: quotes
        .filter(q => q.status === 'accepted' || q.status === 'converted')
        .reduce((sum, q) => sum + (q.total || 0), 0),
      conversion_rate: 0,
    }

    const closedQuotes = stats.accepted + stats.rejected + stats.converted
    if (closedQuotes > 0) {
      stats.conversion_rate = ((stats.accepted + stats.converted) / closedQuotes) * 100
    }

    return stats
  },

  /**
   * Check and expire old quotes
   */
  async expireOldQuotes(organizationId: string): Promise<number> {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('quotes')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .in('status', ['draft', 'sent', 'viewed'])
      .lt('valid_until', today)
      .select('id')

    if (error) {
      console.error('Failed to expire quotes:', error)
      return 0
    }

    return data?.length || 0
  },
}

export default quotesService
