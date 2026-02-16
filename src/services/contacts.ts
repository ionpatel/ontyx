import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

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
// DEMO DATA
// ============================================================================

const demoContacts: Contact[] = [
  {
    id: 'demo-1',
    organizationId: 'demo',
    type: 'customer',
    code: 'CUST-001',
    name: 'Maple Leaf Pharmacy',
    email: 'orders@mapleleafpharmacy.ca',
    phone: '416-555-0101',
    company: 'Maple Leaf Pharmacy Inc.',
    street: '123 Yonge Street',
    city: 'Toronto',
    province: 'ON',
    postalCode: 'M5B 1M4',
    country: 'CA',
    currency: 'CAD',
    paymentTerms: 'Net 30',
    creditLimit: 50000,
    currentBalance: 2500,
    totalOrders: 45,
    totalSpent: 125000,
    totalReceived: 122500,
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-02-10',
  },
  {
    id: 'demo-2',
    organizationId: 'demo',
    type: 'customer',
    code: 'CUST-002',
    name: 'Northern Health Clinic',
    email: 'purchasing@northernhealth.ca',
    phone: '905-555-0202',
    company: 'Northern Health Services Ltd.',
    street: '456 King Street West',
    city: 'Mississauga',
    province: 'ON',
    postalCode: 'L5B 3M7',
    country: 'CA',
    currency: 'CAD',
    paymentTerms: 'Net 15',
    creditLimit: 25000,
    currentBalance: 0,
    totalOrders: 28,
    totalSpent: 67500,
    totalReceived: 67500,
    isActive: true,
    createdAt: '2024-02-01',
    updatedAt: '2024-02-12',
  },
  {
    id: 'demo-3',
    organizationId: 'demo',
    type: 'vendor',
    code: 'VEND-001',
    name: 'Canadian Medical Supplies',
    email: 'sales@canmedsupplies.com',
    phone: '604-555-0303',
    company: 'Canadian Medical Supplies Inc.',
    street: '789 Granville Street',
    city: 'Vancouver',
    province: 'BC',
    postalCode: 'V6Z 1K3',
    country: 'CA',
    currency: 'CAD',
    paymentTerms: 'Net 45',
    currentBalance: -15000,
    totalOrders: 52,
    totalSpent: 0,
    totalReceived: 285000,
    isActive: true,
    createdAt: '2023-06-15',
    updatedAt: '2024-02-08',
  },
  {
    id: 'demo-4',
    organizationId: 'demo',
    type: 'both',
    code: 'CONT-001',
    name: 'PharmaCare Distribution',
    email: 'info@pharmacare.ca',
    phone: '403-555-0404',
    company: 'PharmaCare Distribution Ltd.',
    street: '321 Centre Street',
    city: 'Calgary',
    province: 'AB',
    postalCode: 'T2G 0B5',
    country: 'CA',
    currency: 'CAD',
    paymentTerms: 'Net 30',
    creditLimit: 100000,
    currentBalance: 5000,
    totalOrders: 78,
    totalSpent: 45000,
    totalReceived: 180000,
    isActive: true,
    createdAt: '2023-08-01',
    updatedAt: '2024-02-11',
  },
]

// ============================================================================
// LOCALSTORAGE PERSISTENCE FOR DEMO MODE
// ============================================================================

const DEMO_CONTACTS_STORAGE_KEY = 'ontyx_demo_contacts'

function getDemoContactStore(): Contact[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(DEMO_CONTACTS_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Error reading demo contacts from localStorage:', e)
    }
  }
  return [...demoContacts]
}

function saveDemoContactStore(contacts: Contact[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DEMO_CONTACTS_STORAGE_KEY, JSON.stringify(contacts))
    } catch (e) {
      console.error('Error saving demo contacts to localStorage:', e)
    }
  }
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

function generateContactCode(type: ContactType): string {
  const prefix = type === 'customer' ? 'CUST' : type === 'vendor' ? 'VEND' : 'CONT'
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

export const contactsService = {
  // Get all contacts
  async getContacts(organizationId: string, type?: ContactType): Promise<Contact[]> {
    const supabase = createClient()
    
    // Return demo data if Supabase not configured OR if using demo org
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      const store = getDemoContactStore()
      const filtered = type 
        ? store.filter(c => c.type === type || c.type === 'both')
        : store
      return filtered
    }

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
      return demoContacts
    }

    return (data || []).map(mapContactFromDb)
  },

  // Get single contact
  async getContact(id: string, organizationId: string): Promise<Contact | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      return getDemoContactStore().find(c => c.id === id) || null
    }

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

  // Create contact
  async createContact(input: CreateContactInput, organizationId: string): Promise<Contact | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      const newContact: Contact = {
        id: `demo-${Date.now()}`,
        organizationId: 'demo',
        code: generateContactCode(input.type),
        type: input.type,
        name: input.name,
        email: input.email,
        phone: input.phone,
        mobile: input.mobile,
        company: input.company,
        jobTitle: input.jobTitle,
        website: input.website,
        street: input.street,
        city: input.city,
        province: input.province,
        postalCode: input.postalCode,
        country: input.country || 'CA',
        currency: input.currency || 'CAD',
        taxNumber: input.taxNumber,
        paymentTerms: input.paymentTerms || 'Net 30',
        creditLimit: input.creditLimit,
        currentBalance: 0,
        totalOrders: 0,
        totalSpent: 0,
        totalReceived: 0,
        tags: input.tags,
        notes: input.notes,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const store = getDemoContactStore()
      store.push(newContact)
      saveDemoContactStore(store)
      return newContact
    }

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

  // Update contact
  async updateContact(id: string, updates: Partial<CreateContactInput>, organizationId: string): Promise<Contact | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      const store = getDemoContactStore()
      const index = store.findIndex(c => c.id === id)
      if (index === -1) return null
      store[index] = { ...store[index], ...updates, updatedAt: new Date().toISOString() }
      saveDemoContactStore(store)
      return store[index]
    }

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

  // Delete (soft delete)
  async deleteContact(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      const store = getDemoContactStore()
      const index = store.findIndex(c => c.id === id)
      if (index === -1) return false
      store[index].isActive = false
      saveDemoContactStore(store)
      return true
    }

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

  // Search contacts
  async searchContacts(query: string, organizationId: string, type?: ContactType): Promise<Contact[]> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      const q = query.toLowerCase()
      return getDemoContactStore().filter(c => 
        (c.name.toLowerCase().includes(q) || 
         c.email?.toLowerCase().includes(q) ||
         c.company?.toLowerCase().includes(q)) &&
        (!type || c.type === type || c.type === 'both')
      )
    }

    let dbQuery = supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .or(`display_name.ilike.%${query}%,email.ilike.%${query}%,company_name.ilike.%${query}%`)
      .order('display_name')
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

  // Get customers only
  async getCustomers(organizationId: string): Promise<Contact[]> {
    return this.getContacts(organizationId, 'customer')
  },

  // Get vendors only  
  async getVendors(organizationId: string): Promise<Contact[]> {
    return this.getContacts(organizationId, 'vendor')
  },
}

// ============================================================================
// MAPPERS
// ============================================================================

function mapContactFromDb(row: any): Contact {
  // Determine type from is_customer/is_vendor flags
  let type: ContactType = 'customer'
  if (row.is_customer && row.is_vendor) {
    type = 'both'
  } else if (row.is_vendor) {
    type = 'vendor'
  } else {
    type = 'customer'
  }
  
  return {
    id: row.id,
    organizationId: row.organization_id,
    type,
    code: row.code || `CONT-${row.id?.slice(0, 8)?.toUpperCase()}`,
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
    paymentTerms: row.payment_terms ? `Net ${row.payment_terms}` : 'Net 30',
    creditLimit: row.credit_limit,
    currentBalance: (row.outstanding_receivable || 0) - (row.outstanding_payable || 0),
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

function mapContactToDb(input: Partial<CreateContactInput>): Record<string, any> {
  const result: Record<string, any> = {}
  
  // Map type to is_customer/is_vendor flags
  if (input.type !== undefined) {
    result.is_customer = input.type === 'customer' || input.type === 'both'
    result.is_vendor = input.type === 'vendor' || input.type === 'both'
  }
  
  if (input.name !== undefined) result.display_name = input.name
  if (input.email !== undefined) result.email = input.email
  if (input.phone !== undefined) result.phone = input.phone
  if (input.mobile !== undefined) result.mobile = input.mobile
  if (input.company !== undefined) result.company_name = input.company
  if (input.jobTitle !== undefined) result.job_title = input.jobTitle
  if (input.website !== undefined) result.website = input.website
  if (input.street !== undefined) result.billing_address_line1 = input.street
  if (input.city !== undefined) result.billing_city = input.city
  if (input.province !== undefined) result.billing_state = input.province
  if (input.postalCode !== undefined) result.billing_postal_code = input.postalCode
  if (input.country !== undefined) result.billing_country = input.country
  if (input.currency !== undefined) result.currency = input.currency
  if (input.taxNumber !== undefined) result.tax_id = input.taxNumber
  if (input.paymentTerms !== undefined) {
    // Convert "Net 30" to integer 30
    const match = input.paymentTerms.match(/\d+/)
    result.payment_terms = match ? parseInt(match[0]) : 30
  }
  if (input.creditLimit !== undefined) result.credit_limit = input.creditLimit
  if (input.tags !== undefined) result.tags = input.tags
  if (input.notes !== undefined) result.notes = input.notes
  
  return result
}

export default contactsService
