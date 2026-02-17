import { createClient } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export interface InvoiceTemplate {
  id: string
  organizationId: string
  name: string
  isDefault: boolean
  primaryColor: string
  secondaryColor: string
  logoPosition: 'left' | 'center' | 'right'
  logoSize: 'small' | 'medium' | 'large'
  fontStyle: 'modern' | 'classic' | 'minimal'
  headerText?: string
  footerText?: string
  paymentInstructions?: string
  thankYouMessage?: string
  showLogo: boolean
  showCompanyAddress: boolean
  showCustomerAddress: boolean
  showPaymentTerms: boolean
  showDueDate: boolean
  showInvoiceNumber: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTemplateInput {
  name: string
  primaryColor?: string
  secondaryColor?: string
  logoPosition?: 'left' | 'center' | 'right'
  logoSize?: 'small' | 'medium' | 'large'
  fontStyle?: 'modern' | 'classic' | 'minimal'
  headerText?: string
  footerText?: string
  paymentInstructions?: string
  thankYouMessage?: string
  showLogo?: boolean
  showCompanyAddress?: boolean
  showCustomerAddress?: boolean
  showPaymentTerms?: boolean
  showDueDate?: boolean
  showInvoiceNumber?: boolean
}

export type UpdateTemplateInput = Partial<CreateTemplateInput> & { isDefault?: boolean }

// ============================================================================
// DEFAULTS
// ============================================================================

export const DEFAULT_TEMPLATE: Omit<InvoiceTemplate, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'> = {
  name: 'Default',
  isDefault: true,
  primaryColor: '#DC2626',
  secondaryColor: '#1f2937',
  logoPosition: 'left',
  logoSize: 'medium',
  fontStyle: 'modern',
  headerText: '',
  footerText: 'Thank you for your business!',
  paymentInstructions: 'Payment is due within the terms specified above.',
  thankYouMessage: '',
  showLogo: true,
  showCompanyAddress: true,
  showCustomerAddress: true,
  showPaymentTerms: true,
  showDueDate: true,
  showInvoiceNumber: true,
}

export const TEMPLATE_THEMES = {
  maple: { name: 'Maple Professional', primaryColor: '#DC2626', secondaryColor: '#1f2937', fontStyle: 'modern' as const },
  ocean: { name: 'Ocean Blue', primaryColor: '#0891b2', secondaryColor: '#164e63', fontStyle: 'modern' as const },
  forest: { name: 'Forest Green', primaryColor: '#059669', secondaryColor: '#064e3b', fontStyle: 'modern' as const },
  minimal: { name: 'Minimal Gray', primaryColor: '#6b7280', secondaryColor: '#374151', fontStyle: 'minimal' as const },
  sunset: { name: 'Sunset Orange', primaryColor: '#ea580c', secondaryColor: '#9a3412', fontStyle: 'classic' as const },
}

// ============================================================================
// SERVICE
// ============================================================================

export const invoiceTemplatesService = {
  async getTemplates(organizationId: string): Promise<InvoiceTemplate[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('invoice_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_default', { ascending: false })

    if (error) {
      console.error('Error fetching templates:', error)
      return []
    }

    return (data || []).map(mapTemplateFromDb)
  },

  async getDefaultTemplate(organizationId: string): Promise<InvoiceTemplate | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('invoice_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_default', true)
      .single()

    if (error || !data) {
      // Create a default template if none exists
      console.log('[Templates] No default template found, creating one...')
      const created = await this.createDefaultTemplate(organizationId)
      return created
    }

    return mapTemplateFromDb(data)
  },

  async createDefaultTemplate(organizationId: string): Promise<InvoiceTemplate | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('invoice_templates')
      .insert({
        organization_id: organizationId,
        name: 'Default',
        is_default: true,
        primary_color: DEFAULT_TEMPLATE.primaryColor,
        secondary_color: DEFAULT_TEMPLATE.secondaryColor,
        logo_position: DEFAULT_TEMPLATE.logoPosition,
        logo_size: DEFAULT_TEMPLATE.logoSize,
        font_style: DEFAULT_TEMPLATE.fontStyle,
        footer_text: DEFAULT_TEMPLATE.footerText,
        payment_instructions: DEFAULT_TEMPLATE.paymentInstructions,
        show_logo: DEFAULT_TEMPLATE.showLogo,
        show_company_address: DEFAULT_TEMPLATE.showCompanyAddress,
        show_customer_address: DEFAULT_TEMPLATE.showCustomerAddress,
        show_payment_terms: DEFAULT_TEMPLATE.showPaymentTerms,
        show_due_date: DEFAULT_TEMPLATE.showDueDate,
        show_invoice_number: DEFAULT_TEMPLATE.showInvoiceNumber,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating default template:', error)
      return null
    }

    return mapTemplateFromDb(data)
  },

  async createTemplate(input: CreateTemplateInput, organizationId: string): Promise<InvoiceTemplate | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('invoice_templates')
      .insert({
        organization_id: organizationId,
        name: input.name,
        is_default: false,
        primary_color: input.primaryColor || DEFAULT_TEMPLATE.primaryColor,
        secondary_color: input.secondaryColor || DEFAULT_TEMPLATE.secondaryColor,
        logo_position: input.logoPosition || DEFAULT_TEMPLATE.logoPosition,
        logo_size: input.logoSize || DEFAULT_TEMPLATE.logoSize,
        font_style: input.fontStyle || DEFAULT_TEMPLATE.fontStyle,
        header_text: input.headerText,
        footer_text: input.footerText || DEFAULT_TEMPLATE.footerText,
        payment_instructions: input.paymentInstructions || DEFAULT_TEMPLATE.paymentInstructions,
        thank_you_message: input.thankYouMessage,
        show_logo: input.showLogo ?? DEFAULT_TEMPLATE.showLogo,
        show_company_address: input.showCompanyAddress ?? DEFAULT_TEMPLATE.showCompanyAddress,
        show_customer_address: input.showCustomerAddress ?? DEFAULT_TEMPLATE.showCustomerAddress,
        show_payment_terms: input.showPaymentTerms ?? DEFAULT_TEMPLATE.showPaymentTerms,
        show_due_date: input.showDueDate ?? DEFAULT_TEMPLATE.showDueDate,
        show_invoice_number: input.showInvoiceNumber ?? DEFAULT_TEMPLATE.showInvoiceNumber,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return null
    }

    return mapTemplateFromDb(data)
  },

  async updateTemplate(id: string, updates: UpdateTemplateInput, organizationId: string): Promise<InvoiceTemplate | null> {
    const supabase = createClient()

    // If setting as default, unset other defaults first
    if (updates.isDefault) {
      await supabase
        .from('invoice_templates')
        .update({ is_default: false })
        .eq('organization_id', organizationId)
    }

    const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.isDefault !== undefined) dbUpdates.is_default = updates.isDefault
    if (updates.primaryColor !== undefined) dbUpdates.primary_color = updates.primaryColor
    if (updates.secondaryColor !== undefined) dbUpdates.secondary_color = updates.secondaryColor
    if (updates.logoPosition !== undefined) dbUpdates.logo_position = updates.logoPosition
    if (updates.logoSize !== undefined) dbUpdates.logo_size = updates.logoSize
    if (updates.fontStyle !== undefined) dbUpdates.font_style = updates.fontStyle
    if (updates.headerText !== undefined) dbUpdates.header_text = updates.headerText
    if (updates.footerText !== undefined) dbUpdates.footer_text = updates.footerText
    if (updates.paymentInstructions !== undefined) dbUpdates.payment_instructions = updates.paymentInstructions
    if (updates.thankYouMessage !== undefined) dbUpdates.thank_you_message = updates.thankYouMessage
    if (updates.showLogo !== undefined) dbUpdates.show_logo = updates.showLogo
    if (updates.showCompanyAddress !== undefined) dbUpdates.show_company_address = updates.showCompanyAddress
    if (updates.showCustomerAddress !== undefined) dbUpdates.show_customer_address = updates.showCustomerAddress
    if (updates.showPaymentTerms !== undefined) dbUpdates.show_payment_terms = updates.showPaymentTerms
    if (updates.showDueDate !== undefined) dbUpdates.show_due_date = updates.showDueDate
    if (updates.showInvoiceNumber !== undefined) dbUpdates.show_invoice_number = updates.showInvoiceNumber

    const { data, error } = await supabase
      .from('invoice_templates')
      .update(dbUpdates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return null
    }

    return mapTemplateFromDb(data)
  },

  async deleteTemplate(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('invoice_templates')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('is_default', false) // Can't delete default

    if (error) {
      console.error('Error deleting template:', error)
      return false
    }
    return true
  },

  async applyTheme(id: string, themeName: keyof typeof TEMPLATE_THEMES, organizationId: string): Promise<InvoiceTemplate | null> {
    const theme = TEMPLATE_THEMES[themeName]
    if (!theme) return null

    return this.updateTemplate(id, {
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      fontStyle: theme.fontStyle,
    }, organizationId)
  },
}

// Also export as singular for backwards compatibility
export const invoiceTemplateService = invoiceTemplatesService

// ============================================================================
// MAPPER
// ============================================================================

function mapTemplateFromDb(row: any): InvoiceTemplate {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    isDefault: row.is_default,
    primaryColor: row.primary_color || DEFAULT_TEMPLATE.primaryColor,
    secondaryColor: row.secondary_color || DEFAULT_TEMPLATE.secondaryColor,
    logoPosition: row.logo_position || DEFAULT_TEMPLATE.logoPosition,
    logoSize: row.logo_size || DEFAULT_TEMPLATE.logoSize,
    fontStyle: row.font_style || DEFAULT_TEMPLATE.fontStyle,
    headerText: row.header_text,
    footerText: row.footer_text,
    paymentInstructions: row.payment_instructions,
    thankYouMessage: row.thank_you_message,
    showLogo: row.show_logo ?? DEFAULT_TEMPLATE.showLogo,
    showCompanyAddress: row.show_company_address ?? DEFAULT_TEMPLATE.showCompanyAddress,
    showCustomerAddress: row.show_customer_address ?? DEFAULT_TEMPLATE.showCustomerAddress,
    showPaymentTerms: row.show_payment_terms ?? DEFAULT_TEMPLATE.showPaymentTerms,
    showDueDate: row.show_due_date ?? DEFAULT_TEMPLATE.showDueDate,
    showInvoiceNumber: row.show_invoice_number ?? DEFAULT_TEMPLATE.showInvoiceNumber,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default invoiceTemplatesService
