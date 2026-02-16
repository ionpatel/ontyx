// ============================================================
// Invoices Service — Accounts Receivable CRUD
// ============================================================

import { supabase, getAll, create, update, remove, type QueryOptions } from './base'
import type { Invoice, InvoiceLineItem, InvoicePayment } from '@/types/finance'

const TABLE = 'invoices'

export const invoicesService = {
  async list(options: QueryOptions = {}) {
    const { page = 1, pageSize = 25, orderBy = 'created_at', orderDir = 'desc', filters = {} } = options

    let query = supabase
      .from(TABLE)
      .select(`
        *,
        customer:contacts!customer_id(id, name, email, phone)
      `, { count: 'exact' })

    for (const [key, value] of Object.entries(filters)) {
      if (value) query = query.eq(key, value)
    }

    query = query.order(orderBy, { ascending: orderDir === 'asc' })
    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1)

    const { data, error, count } = await query

    return {
      data: (data || []) as any[],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    }
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        customer:contacts!customer_id(id, name, email, phone, company),
        invoice_line_items(*),
        invoice_payments(*)
      `)
      .eq('id', id)
      .single()

    if (error) return { data: null, error: error.message, success: false }
    return { data: data as any, error: null, success: true }
  },

  async create(invoice: Partial<Invoice>, lineItems: Partial<InvoiceLineItem>[] = []) {
    // Generate invoice number
    const { data: settings } = await supabase
      .from('system_settings')
      .select('invoice_prefix, invoice_next_number')
      .single()

    const prefix = settings?.invoice_prefix || 'INV'
    const nextNum = settings?.invoice_next_number || 1
    const invoiceNumber = `${prefix}-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`

    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...invoice, invoice_number: invoiceNumber } as any)
      .select()
      .single()

    if (error) return { data: null, error: error.message, success: false }

    // Insert line items
    if (lineItems.length > 0) {
      await supabase.from('invoice_line_items').insert(
        lineItems.map((item, i) => ({ ...item, invoice_id: data.id, sort_order: i }))
      )
    }

    // Increment next number
    await supabase
      .from('system_settings')
      .update({ invoice_next_number: nextNum + 1 })
      .eq('id', settings?.id)

    return { data: data as any, error: null, success: true }
  },

  async update(id: string, updates: Partial<Invoice>) {
    return update<Invoice>(TABLE, id, updates)
  },

  async delete(id: string) {
    return remove(TABLE, id)
  },

  async addPayment(invoiceId: string, payment: Partial<InvoicePayment>) {
    const result = await create('invoice_payments', { ...payment, invoice_id: invoiceId })

    if (result.success) {
      // Recalculate amount_paid and amount_due
      const { data: payments } = await supabase
        .from('invoice_payments')
        .select('amount')
        .eq('invoice_id', invoiceId)

      const totalPaid = (payments || []).reduce((sum: number, p: any) => sum + p.amount, 0)

      const { data: invoice } = await supabase
        .from(TABLE)
        .select('total')
        .eq('id', invoiceId)
        .single()

      const total = invoice?.total || 0
      const newStatus = totalPaid >= total ? 'paid' : totalPaid > 0 ? 'partial' : 'sent'

      await supabase
        .from(TABLE)
        .update({
          amount_paid: totalPaid,
          amount_due: total - totalPaid,
          status: newStatus,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', invoiceId)
    }

    return result
  },

  async markSent(id: string) {
    return update(TABLE, id, { status: 'sent', sent_at: new Date().toISOString() } as any)
  },

  async getSummary() {
    const { data: invoices } = await supabase
      .from(TABLE)
      .select('status, total, amount_due')

    if (!invoices) return { total: 0, paid: 0, overdue: 0, outstanding: 0, count: 0 }

    const total = invoices.reduce((s, i) => s + (i.total || 0), 0)
    const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0)
    const overdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.amount_due || 0), 0)
    const outstanding = invoices.reduce((s, i) => s + (i.amount_due || 0), 0)

    return { total, paid, overdue, outstanding, count: invoices.length }
  },
}
