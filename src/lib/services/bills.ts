// ============================================================
// Bills Service — Accounts Payable CRUD
// ============================================================

import { supabase, getAll, create, update, remove, type QueryOptions } from './base'
import type { Bill, BillLineItem } from '@/types/finance'

const TABLE = 'bills'

export const billsService = {
  async list(options: QueryOptions = {}) {
    const { page = 1, pageSize = 25, orderBy = 'created_at', orderDir = 'desc', filters = {} } = options

    let query = supabase
      .from(TABLE)
      .select(`
        *,
        vendor:contacts!vendor_id(id, name, email)
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
        vendor:contacts!vendor_id(id, name, email, phone),
        bill_line_items(*),
        bill_payments(*)
      `)
      .eq('id', id)
      .single()

    if (error) return { data: null, error: error.message, success: false }
    return { data: data as any, error: null, success: true }
  },

  async create(bill: Partial<Bill>, lineItems: Partial<BillLineItem>[] = []) {
    const { data: settings } = await supabase
      .from('system_settings')
      .select('bill_prefix, bill_next_number')
      .single()

    const prefix = settings?.bill_prefix || 'BILL'
    const nextNum = settings?.bill_next_number || 1
    const billNumber = `${prefix}-${String(nextNum).padStart(3, '0')}`

    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...bill, bill_number: billNumber } as any)
      .select()
      .single()

    if (error) return { data: null, error: error.message, success: false }

    if (lineItems.length > 0) {
      await supabase.from('bill_line_items').insert(
        lineItems.map((item, i) => ({ ...item, bill_id: data.id, sort_order: i }))
      )
    }

    await supabase
      .from('system_settings')
      .update({ bill_next_number: nextNum + 1 })
      .eq('id', settings?.id)

    return { data: data as any, error: null, success: true }
  },

  async update(id: string, updates: Partial<Bill>) {
    return update<Bill>(TABLE, id, updates)
  },

  async delete(id: string) {
    return remove(TABLE, id)
  },

  async approve(id: string, approver: string) {
    return update(TABLE, id, {
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approver,
    } as any)
  },

  async addPayment(billId: string, payment: any) {
    const result = await create('bill_payments', { ...payment, bill_id: billId })

    if (result.success) {
      const { data: payments } = await supabase
        .from('bill_payments')
        .select('amount')
        .eq('bill_id', billId)

      const totalPaid = (payments || []).reduce((sum: number, p: any) => sum + p.amount, 0)

      const { data: bill } = await supabase
        .from(TABLE)
        .select('total')
        .eq('id', billId)
        .single()

      const total = bill?.total || 0
      const newStatus = totalPaid >= total ? 'paid' : totalPaid > 0 ? 'partial' : 'pending'

      await supabase
        .from(TABLE)
        .update({ amount_paid: totalPaid, amount_due: total - totalPaid, status: newStatus })
        .eq('id', billId)
    }

    return result
  },

  async getSummary() {
    const { data: bills } = await supabase
      .from(TABLE)
      .select('status, total, amount_due')

    if (!bills) return { total: 0, paid: 0, pending: 0, count: 0 }

    return {
      total: bills.reduce((s, b) => s + (b.total || 0), 0),
      paid: bills.filter(b => b.status === 'paid').reduce((s, b) => s + (b.total || 0), 0),
      pending: bills.filter(b => ['pending', 'approved'].includes(b.status)).reduce((s, b) => s + (b.amount_due || 0), 0),
      count: bills.length,
    }
  },
}
