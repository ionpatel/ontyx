import { createClient } from '@/lib/supabase/client'
import type { InvoiceLineItem } from './invoices'

// ============================================================================
// TYPES
// ============================================================================

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
export type RecurringStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export interface RecurringInvoice {
  id: string
  organizationId: string
  customerId: string
  customerName: string
  customerEmail?: string
  frequency: RecurringFrequency
  nextDate: string
  endDate?: string
  items: InvoiceLineItem[]
  subtotal: number
  taxTotal: number
  total: number
  currency: string
  paymentTerms: string
  notes?: string
  status: RecurringStatus
  lastGeneratedAt?: string
  invoicesGenerated: number
  createdAt: string
  updatedAt: string
}

export interface CreateRecurringInput {
  customerId: string
  frequency: RecurringFrequency
  startDate: string
  endDate?: string
  items: {
    description: string
    quantity: number
    unitPrice: number
    taxRate?: number
    discount?: number
  }[]
  paymentTerms?: string
  notes?: string
}

// ============================================================================
// SERVICE
// ============================================================================

export const recurringInvoicesService = {
  async getRecurringInvoices(organizationId: string): Promise<RecurringInvoice[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('recurring_invoices')
      .select(`
        *,
        customer:contacts!recurring_invoices_customer_id_fkey(display_name, email),
        items:recurring_invoice_items(*)
      `)
      .eq('organization_id', organizationId)
      .order('next_date', { ascending: true })

    if (error) {
      console.error('Error fetching recurring invoices:', error)
      return []
    }

    return (data || []).map(mapRecurringFromDb)
  },

  async getRecurringInvoice(id: string, organizationId: string): Promise<RecurringInvoice | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('recurring_invoices')
      .select(`
        *,
        customer:contacts!recurring_invoices_customer_id_fkey(display_name, email),
        items:recurring_invoice_items(*)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching recurring invoice:', error)
      return null
    }

    return mapRecurringFromDb(data)
  },

  async createRecurringInvoice(input: CreateRecurringInput, organizationId: string): Promise<RecurringInvoice | null> {
    const supabase = createClient()

    // Calculate totals
    let subtotal = 0
    let taxTotal = 0

    const items = input.items.map(item => {
      const itemSubtotal = item.quantity * item.unitPrice
      const itemDiscount = item.discount || 0
      const itemAfterDiscount = itemSubtotal - itemDiscount
      const itemTax = itemAfterDiscount * ((item.taxRate || 0) / 100)
      
      subtotal += itemAfterDiscount
      taxTotal += itemTax
      
      return { ...item, taxRate: item.taxRate || 0, discount: itemDiscount, amount: itemAfterDiscount + itemTax }
    })

    const total = subtotal + taxTotal

    const { data, error } = await supabase
      .from('recurring_invoices')
      .insert({
        organization_id: organizationId,
        customer_id: input.customerId,
        frequency: input.frequency,
        next_date: input.startDate,
        end_date: input.endDate,
        subtotal,
        tax_total: taxTotal,
        total,
        currency: 'CAD',
        payment_terms: input.paymentTerms || 'Net 30',
        notes: input.notes,
        status: 'active',
        invoices_generated: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating recurring invoice:', error)
      return null
    }

    // Insert items
    const itemRecords = items.map((item, idx) => ({
      recurring_invoice_id: data.id,
      line_number: idx + 1,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate,
      discount_amount: item.discount,
      line_total: item.amount,
    }))

    const { error: itemsError } = await supabase.from('recurring_invoice_items').insert(itemRecords)
    if (itemsError) console.error('Error inserting recurring invoice items:', itemsError)

    return this.getRecurringInvoice(data.id, organizationId)
  },

  async updateStatus(id: string, status: RecurringStatus, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('recurring_invoices')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating recurring invoice status:', error)
      return false
    }
    return true
  },

  async deleteRecurringInvoice(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    // Delete items first
    await supabase.from('recurring_invoice_items').delete().eq('recurring_invoice_id', id)

    const { error } = await supabase
      .from('recurring_invoices')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting recurring invoice:', error)
      return false
    }
    return true
  },

  async getStats(organizationId: string): Promise<{
    active: number
    paused: number
    totalMonthlyValue: number
  }> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('recurring_invoices')
      .select('status, total, frequency')
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error fetching recurring stats:', error)
      return { active: 0, paused: 0, totalMonthlyValue: 0 }
    }

    const invoices = data || []
    const active = invoices.filter(i => i.status === 'active')
    
    // Calculate monthly value based on frequency
    const monthlyValue = active.reduce((sum, inv) => {
      const multiplier = 
        inv.frequency === 'weekly' ? 4 :
        inv.frequency === 'biweekly' ? 2 :
        inv.frequency === 'monthly' ? 1 :
        inv.frequency === 'quarterly' ? 1/3 :
        1/12
      return sum + (inv.total * multiplier)
    }, 0)

    return {
      active: active.length,
      paused: invoices.filter(i => i.status === 'paused').length,
      totalMonthlyValue: monthlyValue,
    }
  },
}

// ============================================================================
// MAPPER
// ============================================================================

function mapRecurringFromDb(row: any): RecurringInvoice {
  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    customerName: row.customer?.display_name || 'Unknown',
    customerEmail: row.customer?.email,
    frequency: row.frequency,
    nextDate: row.next_date,
    endDate: row.end_date,
    items: (row.items || []).map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      taxRate: item.tax_rate || 0,
      discount: item.discount_amount || 0,
      amount: item.line_total,
    })),
    subtotal: row.subtotal,
    taxTotal: row.tax_total || 0,
    total: row.total,
    currency: row.currency || 'CAD',
    paymentTerms: row.payment_terms || 'Net 30',
    notes: row.notes,
    status: row.status,
    lastGeneratedAt: row.last_generated_at,
    invoicesGenerated: row.invoices_generated || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default recurringInvoicesService
