/**
 * Invoice Template Service
 * 
 * Manages customizable invoice branding including:
 * - Logo position and size
 * - Brand colors (primary, accent)
 * - Font style
 * - Footer content
 * - Payment instructions
 */

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export interface InvoiceTemplate {
  id: string
  organizationId: string
  name: string
  isDefault: boolean
  
  // Branding
  primaryColor: string      // Hex color for headers, accents
  secondaryColor: string    // Hex color for secondary elements
  
  // Logo
  logoPosition: 'left' | 'center' | 'right'
  logoSize: 'small' | 'medium' | 'large'  // small=60px, medium=80px, large=100px
  
  // Typography
  fontStyle: 'modern' | 'classic' | 'minimal'
  
  // Content
  headerText?: string       // Optional text above invoice
  footerText?: string       // Footer on every page
  paymentInstructions?: string  // Payment terms section
  thankYouMessage?: string  // Message after totals
  
  // Display options
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
  primaryColor: '#DC2626',      // Maple red
  secondaryColor: '#1f2937',    // Dark gray
  logoPosition: 'left',
  logoSize: 'medium',
  fontStyle: 'modern',
  headerText: '',
  footerText: 'Thank you for your business!',
  paymentInstructions: 'Payment is due within the terms specified above. Please include the invoice number with your payment.',
  thankYouMessage: '',
  showLogo: true,
  showCompanyAddress: true,
  showCustomerAddress: true,
  showPaymentTerms: true,
  showDueDate: true,
  showInvoiceNumber: true,
}

// Pre-built template themes
export const TEMPLATE_THEMES = {
  maple: {
    name: 'Maple Professional',
    primaryColor: '#DC2626',
    secondaryColor: '#1f2937',
    fontStyle: 'modern' as const,
  },
  ocean: {
    name: 'Ocean Blue',
    primaryColor: '#0284c7',
    secondaryColor: '#0f172a',
    fontStyle: 'modern' as const,
  },
  forest: {
    name: 'Forest Green',
    primaryColor: '#059669',
    secondaryColor: '#1f2937',
    fontStyle: 'classic' as const,
  },
  minimal: {
    name: 'Minimal Dark',
    primaryColor: '#18181b',
    secondaryColor: '#71717a',
    fontStyle: 'minimal' as const,
  },
  sunset: {
    name: 'Sunset Orange',
    primaryColor: '#ea580c',
    secondaryColor: '#1c1917',
    fontStyle: 'modern' as const,
  },
}

// ============================================================================
// DEMO DATA
// ============================================================================

const demoTemplates: InvoiceTemplate[] = [
  {
    id: 'tpl-001',
    organizationId: 'demo',
    ...DEFAULT_TEMPLATE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

let demoTemplateStore = [...demoTemplates]

// ============================================================================
// SERVICE
// ============================================================================

export const invoiceTemplateService = {
  /**
   * Get all templates for an organization
   */
  async getTemplates(organizationId: string): Promise<InvoiceTemplate[]> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      return demoTemplateStore.filter(t => t.organizationId === 'demo')
    }

    const { data, error } = await supabase
      .from('invoice_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_default', { ascending: false })

    if (error) {
      console.error('Error fetching templates:', error)
      return []
    }

    return data.map(mapFromDb)
  },

  /**
   * Get the default template for an organization
   */
  async getDefaultTemplate(organizationId: string): Promise<InvoiceTemplate> {
    const templates = await this.getTemplates(organizationId)
    return templates.find(t => t.isDefault) || {
      id: 'default',
      organizationId,
      ...DEFAULT_TEMPLATE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  /**
   * Create a new template
   */
  async createTemplate(
    input: CreateTemplateInput,
    organizationId: string
  ): Promise<InvoiceTemplate | null> {
    const supabase = createClient()
    
    const newTemplate: InvoiceTemplate = {
      id: `tpl-${Date.now()}`,
      organizationId,
      isDefault: false,
      ...DEFAULT_TEMPLATE,
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      demoTemplateStore.push(newTemplate)
      return newTemplate
    }

    const { data, error } = await supabase
      .from('invoice_templates')
      .insert(mapToDb(newTemplate))
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return null
    }

    return mapFromDb(data)
  },

  /**
   * Update a template
   */
  async updateTemplate(
    id: string,
    updates: UpdateTemplateInput,
    organizationId: string
  ): Promise<InvoiceTemplate | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      const idx = demoTemplateStore.findIndex(t => t.id === id)
      if (idx === -1) return null
      
      // If setting as default, unset others
      if (updates.isDefault) {
        demoTemplateStore = demoTemplateStore.map(t => ({
          ...t,
          isDefault: t.id === id,
        }))
      }
      
      demoTemplateStore[idx] = {
        ...demoTemplateStore[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      return demoTemplateStore[idx]
    }

    // If setting as default, unset others first
    if (updates.isDefault) {
      await supabase
        .from('invoice_templates')
        .update({ is_default: false })
        .eq('organization_id', organizationId)
    }

    const { data, error } = await supabase
      .from('invoice_templates')
      .update({
        ...mapUpdatesToDb(updates),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return null
    }

    return mapFromDb(data)
  },

  /**
   * Delete a template
   */
  async deleteTemplate(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      const idx = demoTemplateStore.findIndex(t => t.id === id)
      if (idx === -1 || demoTemplateStore[idx].isDefault) return false
      demoTemplateStore.splice(idx, 1)
      return true
    }

    // Don't allow deleting default template
    const { data: template } = await supabase
      .from('invoice_templates')
      .select('is_default')
      .eq('id', id)
      .single()
    
    if (template?.is_default) return false

    const { error } = await supabase
      .from('invoice_templates')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting template:', error)
      return false
    }

    return true
  },

  /**
   * Apply a preset theme to a template
   */
  async applyTheme(
    templateId: string,
    themeName: keyof typeof TEMPLATE_THEMES,
    organizationId: string
  ): Promise<InvoiceTemplate | null> {
    const theme = TEMPLATE_THEMES[themeName]
    if (!theme) return null
    
    return this.updateTemplate(templateId, {
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      fontStyle: theme.fontStyle,
    }, organizationId)
  },
}

// ============================================================================
// DB MAPPING
// ============================================================================

function mapFromDb(row: any): InvoiceTemplate {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    isDefault: row.is_default,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    logoPosition: row.logo_position,
    logoSize: row.logo_size,
    fontStyle: row.font_style,
    headerText: row.header_text,
    footerText: row.footer_text,
    paymentInstructions: row.payment_instructions,
    thankYouMessage: row.thank_you_message,
    showLogo: row.show_logo,
    showCompanyAddress: row.show_company_address,
    showCustomerAddress: row.show_customer_address,
    showPaymentTerms: row.show_payment_terms,
    showDueDate: row.show_due_date,
    showInvoiceNumber: row.show_invoice_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapToDb(template: InvoiceTemplate): any {
  return {
    id: template.id,
    organization_id: template.organizationId,
    name: template.name,
    is_default: template.isDefault,
    primary_color: template.primaryColor,
    secondary_color: template.secondaryColor,
    logo_position: template.logoPosition,
    logo_size: template.logoSize,
    font_style: template.fontStyle,
    header_text: template.headerText,
    footer_text: template.footerText,
    payment_instructions: template.paymentInstructions,
    thank_you_message: template.thankYouMessage,
    show_logo: template.showLogo,
    show_company_address: template.showCompanyAddress,
    show_customer_address: template.showCustomerAddress,
    show_payment_terms: template.showPaymentTerms,
    show_due_date: template.showDueDate,
    show_invoice_number: template.showInvoiceNumber,
    created_at: template.createdAt,
    updated_at: template.updatedAt,
  }
}

function mapUpdatesToDb(updates: UpdateTemplateInput): any {
  const result: any = {}
  if (updates.name !== undefined) result.name = updates.name
  if (updates.isDefault !== undefined) result.is_default = updates.isDefault
  if (updates.primaryColor !== undefined) result.primary_color = updates.primaryColor
  if (updates.secondaryColor !== undefined) result.secondary_color = updates.secondaryColor
  if (updates.logoPosition !== undefined) result.logo_position = updates.logoPosition
  if (updates.logoSize !== undefined) result.logo_size = updates.logoSize
  if (updates.fontStyle !== undefined) result.font_style = updates.fontStyle
  if (updates.headerText !== undefined) result.header_text = updates.headerText
  if (updates.footerText !== undefined) result.footer_text = updates.footerText
  if (updates.paymentInstructions !== undefined) result.payment_instructions = updates.paymentInstructions
  if (updates.thankYouMessage !== undefined) result.thank_you_message = updates.thankYouMessage
  if (updates.showLogo !== undefined) result.show_logo = updates.showLogo
  if (updates.showCompanyAddress !== undefined) result.show_company_address = updates.showCompanyAddress
  if (updates.showCustomerAddress !== undefined) result.show_customer_address = updates.showCustomerAddress
  if (updates.showPaymentTerms !== undefined) result.show_payment_terms = updates.showPaymentTerms
  if (updates.showDueDate !== undefined) result.show_due_date = updates.showDueDate
  if (updates.showInvoiceNumber !== undefined) result.show_invoice_number = updates.showInvoiceNumber
  return result
}

export default invoiceTemplateService
