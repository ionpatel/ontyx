import { createClient } from '@/lib/supabase/client'

// ============================================================================
// CONTACT TYPES
// ============================================================================

export type ContactType = 'customer' | 'vendor' | 'both'

export interface Contact {
  id: string
  organizationId: string
  type: ContactType
  code: string
  name: string
  email?: string
  phone?: string
  mobile?: string
  company?: string
  jobTitle?: string
  website?: string
  
  // Address
  street?: string
  city?: string
  province?: string
  postalCode?: string
  country: string
  
  // Financial
  currency: string
  taxNumber?: string
  paymentTerms: string
  creditLimit?: number
  currentBalance: number
  
  // Stats
  totalOrders: number
  totalSpent: number
  totalReceived: number
  lastOrderDate?: string
  
  // Meta
  tags?: string[]
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateContactInput {
  type: ContactType
  name: string
  email?: string
  phone?: string
  mobile?: string
  company?: string
  jobTitle?: string
  website?: string
  street?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
  currency?: string
  taxNumber?: string
  paymentTerms?: string
  creditLimit?: number
  tags?: string[]
  notes?: string
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

export const contactsService = {
  async getContacts(organizationId: string, type?: ContactType): Promise<Contact[]> {
    const supabase = createClient()

    let query = supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('display_name', { ascending: true })

    if (type === 'customer') {
      query = query.eq('is_customer', true)
    } else if (type === 'vendor') {
      query = query.eq('is_vendor', true)
    } else if (type === 'both') {
      query = query.eq('is_customer', true).eq('is_vendor', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching contacts:', error)
      return []
    }

    return (data || []).map(mapContactFromDb)
  },

  async getContact(id: string, organizationId: string): Promise<Contact | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching contact:', error)
      return null
    }

    return mapContactFromDb(data)
  },

  async createContact(input: CreateContactInput, organizationId: string): Promise<Contact | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        organization_id: organizationId,
        is_customer: input.type === 'customer' || input.type === 'both',
        is_vendor: input.type === 'vendor' || input.type === 'both',
        type: input.company ? 'company' : 'individual',
        display_name: input.name,
        company_name: input.company,
        email: input.email,
        phone: input.phone,
        mobile: input.mobile,
        website: input.website,
        billing_address_line1: input.street,
        billing_city: input.city,
        billing_state: input.province,
        billing_postal_code: input.postalCode,
        billing_country: input.country || 'CA',
        currency: input.currency || 'CAD',
        tax_id: input.taxNumber,
        payment_terms: 30,
        credit_limit: input.creditLimit,
        tags: input.tags,
        notes: input.notes,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating contact:', error)
      return null
    }

    return mapContactFromDb(data)
  },

  async updateContact(id: string, updates: Partial<CreateContactInput>, organizationId: string): Promise<Contact | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('contacts')
      .update({
        ...mapContactToDb(updates),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating contact:', error)
      return null
    }

    return mapContactFromDb(data)
  },

  async deleteContact(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('contacts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting contact:', error)
      return false
    }

    return true
  },

  async searchContacts(query: string, organizationId: string, type?: ContactType): Promise<Contact[]> {
    const supabase = createClient()

    let dbQuery = supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .or(`display_name.ilike.%${query}%,email.ilike.%${query}%,company_name.ilike.%${query}%`)
      .order('display_name', { ascending: true })
      .limit(20)

    if (type === 'customer') {
      dbQuery = dbQuery.eq('is_customer', true)
    } else if (type === 'vendor') {
      dbQuery = dbQuery.eq('is_vendor', true)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Error searching contacts:', error)
      return []
    }

    return (data || []).map(mapContactFromDb)
  },

  async getContactStats(organizationId: string): Promise<{ customers: number; vendors: number; total: number }> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('contacts')
      .select('is_customer, is_vendor')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching contact stats:', error)
      return { customers: 0, vendors: 0, total: 0 }
    }

    const contacts = data || []
    return {
      customers: contacts.filter(c => c.is_customer).length,
      vendors: contacts.filter(c => c.is_vendor).length,
      total: contacts.length,
    }
  },
}

// ============================================================================
// MAPPERS
// ============================================================================

function mapContactFromDb(row: any): Contact {
  let type: ContactType = 'customer'
  if (row.is_customer && row.is_vendor) type = 'both'
  else if (row.is_vendor) type = 'vendor'

  return {
    id: row.id,
    organizationId: row.organization_id,
    type,
    code: row.account_number || '',
    name: row.display_name,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    company: row.company_name,
    jobTitle: row.job_title,
    website: row.website,
    street: row.billing_address_line1,
    city: row.billing_city,
    province: row.billing_state,
    postalCode: row.billing_postal_code,
    country: row.billing_country || 'CA',
    currency: row.currency || 'CAD',
    taxNumber: row.tax_id,
    paymentTerms: `Net ${row.payment_terms || 30}`,
    creditLimit: row.credit_limit,
    currentBalance: row.balance || 0,
    totalOrders: row.total_orders || 0,
    totalSpent: row.total_spent || 0,
    totalReceived: row.total_received || 0,
    lastOrderDate: row.last_order_date,
    tags: row.tags,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapContactToDb(updates: Partial<CreateContactInput>): Record<string, any> {
  const mapped: Record<string, any> = {}
  
  if (updates.type !== undefined) {
    mapped.is_customer = updates.type === 'customer' || updates.type === 'both'
    mapped.is_vendor = updates.type === 'vendor' || updates.type === 'both'
  }
  if (updates.name !== undefined) mapped.display_name = updates.name
  if (updates.company !== undefined) mapped.company_name = updates.company
  if (updates.email !== undefined) mapped.email = updates.email
  if (updates.phone !== undefined) mapped.phone = updates.phone
  if (updates.mobile !== undefined) mapped.mobile = updates.mobile
  if (updates.website !== undefined) mapped.website = updates.website
  if (updates.street !== undefined) mapped.billing_address_line1 = updates.street
  if (updates.city !== undefined) mapped.billing_city = updates.city
  if (updates.province !== undefined) mapped.billing_state = updates.province
  if (updates.postalCode !== undefined) mapped.billing_postal_code = updates.postalCode
  if (updates.country !== undefined) mapped.billing_country = updates.country
  if (updates.currency !== undefined) mapped.currency = updates.currency
  if (updates.taxNumber !== undefined) mapped.tax_id = updates.taxNumber
  if (updates.creditLimit !== undefined) mapped.credit_limit = updates.creditLimit
  if (updates.tags !== undefined) mapped.tags = updates.tags
  if (updates.notes !== undefined) mapped.notes = updates.notes
  
  return mapped
}

// Named exports for direct imports
export const getContacts = contactsService.getContacts
export const getContact = contactsService.getContact
export const createContact = contactsService.createContact
export const updateContact = contactsService.updateContact
export const deleteContact = contactsService.deleteContact
export const searchContacts = contactsService.searchContacts
export const getContactStats = contactsService.getContactStats

export default contactsService
