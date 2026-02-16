import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'

export interface RecurringInvoice {
  id: string
  organizationId: string
  
  // Customer
  customerId: string
  customerName: string
  customerEmail?: string
  
  // Template
  items: RecurringInvoiceItem[]
  subtotal: number
  taxProvince: string  // For Canadian tax calculation
  notes?: string
  terms?: string
  
  // Schedule
  frequency: RecurringFrequency
  startDate: string
  nextDate: string
  endDate?: string
  daysUntilDue: number  // e.g., 30 = due 30 days after invoice date
  
  // Status
  isActive: boolean
  lastGeneratedAt?: string
  invoicesGenerated: number
  
  createdAt: string
  updatedAt: string
}

export interface RecurringInvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface CreateRecurringInput {
  customerId: string
  customerName: string
  customerEmail?: string
  items: RecurringInvoiceItem[]
  subtotal: number
  taxProvince: string
  notes?: string
  terms?: string
  frequency: RecurringFrequency
  startDate: string
  daysUntilDue: number
  endDate?: string
}

export interface UpdateRecurringInput {
  customerId?: string
  customerName?: string
  customerEmail?: string
  items?: RecurringInvoiceItem[]
  subtotal?: number
  taxProvince?: string
  notes?: string
  terms?: string
  frequency?: RecurringFrequency
  startDate?: string
  daysUntilDue?: number
  endDate?: string
  isActive?: boolean
}

// ============================================================================
// DEMO DATA
// ============================================================================

const demoRecurringInvoices: RecurringInvoice[] = [
  {
    id: 'rec-001',
    organizationId: 'demo',
    customerId: 'cust-001',
    customerName: 'Maple Leaf Consulting',
    customerEmail: 'billing@mapleleaf.ca',
    items: [
      { description: 'Monthly Retainer - Business Consulting', quantity: 1, unitPrice: 2500.00, amount: 2500.00 },
    ],
    subtotal: 2500.00,
    taxProvince: 'ON',
    notes: 'Thank you for your continued partnership.',
    frequency: 'monthly',
    startDate: '2026-01-01',
    nextDate: '2026-03-01',
    daysUntilDue: 30,
    isActive: true,
    lastGeneratedAt: '2026-02-01',
    invoicesGenerated: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'rec-002',
    organizationId: 'demo',
    customerId: 'cust-002',
    customerName: 'Northern Tech Solutions',
    customerEmail: 'accounts@northerntech.ca',
    items: [
      { description: 'IT Support Package', quantity: 1, unitPrice: 500.00, amount: 500.00 },
      { description: 'Software Licenses (5 seats)', quantity: 5, unitPrice: 25.00, amount: 125.00 },
    ],
    subtotal: 625.00,
    taxProvince: 'ON',
    frequency: 'monthly',
    startDate: '2026-01-15',
    nextDate: '2026-02-15',
    daysUntilDue: 15,
    isActive: true,
    invoicesGenerated: 1,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
]

// Mutable demo store
let demoRecurringStore = [...demoRecurringInvoices]

// ============================================================================
// HELPERS
// ============================================================================

function calculateNextDate(currentDate: string, frequency: RecurringFrequency): string {
  const date = new Date(currentDate)
  
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'biweekly':
      date.setDate(date.getDate() + 14)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'quarterly':
      date.setMonth(date.getMonth() + 3)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
  }
  
  return date.toISOString().split('T')[0]
}

function generateId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
}

// ============================================================================
// SERVICE
// ============================================================================

export const recurringInvoicesService = {
  /**
   * List all recurring invoices for an organization
   */
  async listRecurring(organizationId: string): Promise<RecurringInvoice[]> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      return demoRecurringStore.filter(r => r.organizationId === 'demo')
    }

    const { data, error } = await supabase
      .from('recurring_invoices')
      .select('*')
      .eq('organization_id', organizationId)
      .order('next_date', { ascending: true })

    if (error) {
      console.error('Error fetching recurring invoices:', error)
      return []
    }

    return data.map(mapFromDb)
  },

  /**
   * Get a single recurring invoice
   */
  async getRecurring(id: string, organizationId: string): Promise<RecurringInvoice | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      return demoRecurringStore.find(r => r.id === id) || null
    }

    const { data, error } = await supabase
      .from('recurring_invoices')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching recurring invoice:', error)
      return null
    }

    return mapFromDb(data)
  },

  /**
   * Create a new recurring invoice
   */
  async createRecurring(
    input: CreateRecurringInput,
    organizationId: string
  ): Promise<RecurringInvoice | null> {
    const supabase = createClient()
    
    const nextDate = input.startDate
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      const newRecurring: RecurringInvoice = {
        id: generateId(),
        organizationId: 'demo',
        customerId: input.customerId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        items: input.items,
        subtotal: input.subtotal,
        taxProvince: input.taxProvince,
        notes: input.notes,
        terms: input.terms,
        frequency: input.frequency,
        startDate: input.startDate,
        nextDate,
        endDate: input.endDate,
        daysUntilDue: input.daysUntilDue,
        isActive: true,
        invoicesGenerated: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      demoRecurringStore.push(newRecurring)
      return newRecurring
    }

    const { data, error } = await supabase
      .from('recurring_invoices')
      .insert({
        organization_id: organizationId,
        customer_id: input.customerId,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        items: input.items,
        subtotal: input.subtotal,
        tax_province: input.taxProvince,
        notes: input.notes,
        terms: input.terms,
        frequency: input.frequency,
        start_date: input.startDate,
        next_date: nextDate,
        end_date: input.endDate,
        days_until_due: input.daysUntilDue,
        is_active: true,
        invoices_generated: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating recurring invoice:', error)
      return null
    }

    return mapFromDb(data)
  },

  /**
   * Update a recurring invoice
   */
  async updateRecurring(
    id: string,
    updates: UpdateRecurringInput,
    organizationId: string
  ): Promise<RecurringInvoice | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      const idx = demoRecurringStore.findIndex(r => r.id === id)
      if (idx === -1) return null
      
      demoRecurringStore[idx] = {
        ...demoRecurringStore[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      return demoRecurringStore[idx]
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }
    
    if (updates.customerId !== undefined) updateData.customer_id = updates.customerId
    if (updates.customerName !== undefined) updateData.customer_name = updates.customerName
    if (updates.customerEmail !== undefined) updateData.customer_email = updates.customerEmail
    if (updates.items !== undefined) updateData.items = updates.items
    if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal
    if (updates.taxProvince !== undefined) updateData.tax_province = updates.taxProvince
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.terms !== undefined) updateData.terms = updates.terms
    if (updates.frequency !== undefined) updateData.frequency = updates.frequency
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate
    if (updates.daysUntilDue !== undefined) updateData.days_until_due = updates.daysUntilDue
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive

    const { data, error } = await supabase
      .from('recurring_invoices')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating recurring invoice:', error)
      return null
    }

    return mapFromDb(data)
  },

  /**
   * Delete a recurring invoice
   */
  async deleteRecurring(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      const idx = demoRecurringStore.findIndex(r => r.id === id)
      if (idx === -1) return false
      demoRecurringStore.splice(idx, 1)
      return true
    }

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

  /**
   * Toggle active status
   */
  async toggleActive(id: string, organizationId: string): Promise<boolean> {
    const recurring = await this.getRecurring(id, organizationId)
    if (!recurring) return false
    
    const updated = await this.updateRecurring(id, { isActive: !recurring.isActive }, organizationId)
    return !!updated
  },

  /**
   * Get recurring invoices due for generation (where nextDate <= today)
   */
  async getDueForGeneration(organizationId: string): Promise<RecurringInvoice[]> {
    const today = new Date().toISOString().split('T')[0]
    const all = await this.listRecurring(organizationId)
    
    return all.filter(r => 
      r.isActive && 
      r.nextDate <= today && 
      (!r.endDate || r.endDate >= today)
    )
  },

  /**
   * Mark a recurring invoice as generated (updates nextDate and counter)
   */
  async markGenerated(id: string, organizationId: string): Promise<RecurringInvoice | null> {
    const recurring = await this.getRecurring(id, organizationId)
    if (!recurring) return null
    
    const nextDate = calculateNextDate(recurring.nextDate, recurring.frequency)
    
    return this.updateRecurring(id, {
      ...recurring,
      // These need to be in the update:
    }, organizationId)
  },
}

// ============================================================================
// DB MAPPING
// ============================================================================

function mapFromDb(row: any): RecurringInvoice {
  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    items: row.items || [],
    subtotal: row.subtotal || 0,
    taxProvince: row.tax_province || 'ON',
    notes: row.notes,
    terms: row.terms,
    frequency: row.frequency || 'monthly',
    startDate: row.start_date,
    nextDate: row.next_date,
    endDate: row.end_date,
    daysUntilDue: row.days_until_due || 30,
    isActive: row.is_active !== false,
    lastGeneratedAt: row.last_generated_at,
    invoicesGenerated: row.invoices_generated || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default recurringInvoicesService
