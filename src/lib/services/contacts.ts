// ============================================================
// Contacts Service — CRUD for Customers, Vendors, Leads
// ============================================================

import { supabase, getAll, getById, create, update, remove, type QueryOptions } from './base'
import type { Contact, ContactStats } from '@/types/contacts'

const TABLE = 'contacts'

export const contactsService = {
  async list(options: QueryOptions = {}) {
    return getAll<Contact>(TABLE, {
      ...options,
      searchFields: ['name', 'email', 'company', 'phone'],
    })
  },

  async getById(id: string) {
    // Fetch contact with addresses and activities
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        contact_addresses(*),
        contact_activities(*, order: date.desc)
      `)
      .eq('id', id)
      .single()

    if (error) return { data: null, error: error.message, success: false }
    return { data: data as any, error: null, success: true }
  },

  async create(contact: Partial<Contact>) {
    return create<Contact>(TABLE, contact)
  },

  async update(id: string, updates: Partial<Contact>) {
    return update<Contact>(TABLE, id, updates)
  },

  async delete(id: string) {
    return remove(TABLE, id)
  },

  async getCustomers(options: QueryOptions = {}) {
    return getAll<Contact>(TABLE, {
      ...options,
      filters: { ...options.filters, type: 'customer' },
      searchFields: ['name', 'email', 'company'],
    })
  },

  async getVendors(options: QueryOptions = {}) {
    return getAll<Contact>(TABLE, {
      ...options,
      filters: { ...options.filters, type: 'vendor' },
      searchFields: ['name', 'email', 'company'],
    })
  },

  async getStats(): Promise<ContactStats> {
    const [total, customers, vendors] = await Promise.all([
      supabase.from(TABLE).select('*', { count: 'exact', head: true }),
      supabase.from(TABLE).select('*', { count: 'exact', head: true }).in('type', ['customer', 'both']),
      supabase.from(TABLE).select('*', { count: 'exact', head: true }).in('type', ['vendor', 'both']),
    ])

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { count: newThisMonth } = await supabase
      .from(TABLE)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    const { count: activeDeals } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .not('stage', 'in', '("won","lost")')

    return {
      total: total.count || 0,
      customers: customers.count || 0,
      vendors: vendors.count || 0,
      newThisMonth: newThisMonth || 0,
      activeDeals: activeDeals || 0,
    }
  },

  async addAddress(contactId: string, address: any) {
    return create('contact_addresses', { ...address, contact_id: contactId })
  },

  async addActivity(contactId: string, activity: any) {
    return create('contact_activities', { ...activity, contact_id: contactId })
  },

  async search(query: string, limit = 10) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, name, email, type, company')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`)
      .limit(limit)

    if (error) return []
    return data
  },
}
