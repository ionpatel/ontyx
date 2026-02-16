import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export interface Organization {
  id: string
  name: string
  slug: string
  legalName?: string
  logoUrl?: string
  website?: string
  email?: string
  phone?: string
  
  // Address
  addressLine1?: string
  addressLine2?: string
  city?: string
  province?: string
  postalCode?: string
  country: string
  
  // Tax & Financial
  taxNumber?: string  // GST/HST number
  currency: string
  fiscalYearStart: number  // Month 1-12
  
  // Settings
  timezone: string
  dateFormat: string
  
  // Billing
  plan: string
  status: 'active' | 'trial' | 'suspended' | 'cancelled'
  trialEndsAt?: string
  
  createdAt: string
  updatedAt: string
}

export interface UpdateOrganizationInput {
  name?: string
  legalName?: string
  logoUrl?: string
  website?: string
  email?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
  taxNumber?: string
  currency?: string
  fiscalYearStart?: number
  timezone?: string
  dateFormat?: string
}

// ============================================================================
// DEMO DATA
// ============================================================================

const demoOrganization: Organization = {
  id: 'demo',
  name: 'Demo Company',
  slug: 'demo-company',
  legalName: 'Demo Company Inc.',
  email: 'hello@democompany.ca',
  phone: '(416) 555-0100',
  website: 'https://democompany.ca',
  addressLine1: '123 Main Street',
  city: 'Toronto',
  province: 'ON',
  postalCode: 'M5V 1A1',
  country: 'CA',
  taxNumber: '123456789 RT0001',
  currency: 'CAD',
  fiscalYearStart: 1,
  timezone: 'America/Toronto',
  dateFormat: 'YYYY-MM-DD',
  plan: 'trial',
  status: 'trial',
  trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// Mutable demo store with localStorage persistence
const DEMO_ORG_STORAGE_KEY = 'ontyx_demo_organization'

function getDemoOrgStore(): Organization {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(DEMO_ORG_STORAGE_KEY)
      if (stored) {
        return { ...demoOrganization, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.error('Error reading demo org from localStorage:', e)
    }
  }
  return { ...demoOrganization }
}

function saveDemoOrgStore(org: Organization): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DEMO_ORG_STORAGE_KEY, JSON.stringify(org))
    } catch (e) {
      console.error('Error saving demo org to localStorage:', e)
    }
  }
}

// ============================================================================
// SERVICE
// ============================================================================

export const organizationService = {
  // Get organization by ID
  async getOrganization(organizationId: string): Promise<Organization | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() ) {
      return getDemoOrgStore()
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching organization:', error)
      return demoOrgStore
    }

    return mapOrgFromDb(data)
  },

  // Update organization
  async updateOrganization(
    organizationId: string, 
    updates: UpdateOrganizationInput
  ): Promise<Organization | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() ) {
      const currentOrg = getDemoOrgStore()
      const updatedOrg = { 
        ...currentOrg, 
        ...updates, 
        updatedAt: new Date().toISOString() 
      }
      saveDemoOrgStore(updatedOrg)
      return updatedOrg
    }

    const { data, error } = await supabase
      .from('organizations')
      .update({
        name: updates.name,
        // legal_name: updates.legalName,
        logo_url: updates.logoUrl,
        website: updates.website,
        email: updates.email,
        phone: updates.phone,
        address_line1: updates.addressLine1,
        address_line2: updates.addressLine2,
        city: updates.city,
        state: updates.province,
        postal_code: updates.postalCode,
        country: updates.country,
        // tax_number: updates.taxNumber,
        currency: updates.currency,
        fiscal_year_start: updates.fiscalYearStart,
        timezone: updates.timezone,
        date_format: updates.dateFormat,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating organization:', error)
      return null
    }

    return mapOrgFromDb(data)
  },

  // Upload logo
  async uploadLogo(organizationId: string, file: File): Promise<string | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() ) {
      // For demo mode, convert to base64 data URL (survives page refresh)
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64Url = reader.result as string
          const currentOrg = getDemoOrgStore()
          saveDemoOrgStore({ ...currentOrg, logoUrl: base64Url, updatedAt: new Date().toISOString() })
          resolve(base64Url)
        }
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(file)
      })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${organizationId}/logo.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      console.error('Error uploading logo:', uploadError)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName)

    // Update org with new logo URL
    await supabase
      .from('organizations')
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', organizationId)

    return publicUrl
  },
}

// ============================================================================
// HELPERS
// ============================================================================

function mapOrgFromDb(row: any): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    legalName: row.legal_name,
    logoUrl: row.logo_url,
    website: row.website,
    email: row.email,
    phone: row.phone,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    province: row.state,
    postalCode: row.postal_code,
    country: row.country || 'CA',
    taxNumber: row.tax_number,
    currency: row.currency || 'CAD',
    fiscalYearStart: row.fiscal_year_start || 1,
    timezone: row.timezone || 'America/Toronto',
    dateFormat: row.date_format || 'YYYY-MM-DD',
    plan: row.plan || 'trial',
    status: row.status || 'trial',
    trialEndsAt: row.trial_ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default organizationService
