import { createClient } from '@/lib/supabase/client'

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
// SERVICE
// ============================================================================

export const organizationService = {
  // Get organization by ID
  async getOrganization(organizationId: string): Promise<Organization | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching organization:', error)
      return null
    }

    return mapOrgFromDb(data)
  },

  // Update organization
  async updateOrganization(
    organizationId: string, 
    updates: UpdateOrganizationInput
  ): Promise<Organization | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('organizations')
      .update({
        name: updates.name,
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

  // Upload logo to Supabase Storage
  async uploadLogo(organizationId: string, file: File): Promise<string | null> {
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${organizationId}/logo.${fileExt}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      console.error('Error uploading logo:', uploadError)
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName)

    // Update organization with logo URL
    await supabase
      .from('organizations')
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', organizationId)

    return publicUrl
  },
}

// ============================================================================
// MAPPERS
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
