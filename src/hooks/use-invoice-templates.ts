'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import {
  invoiceTemplateService,
  type InvoiceTemplate,
  type CreateTemplateInput,
  type UpdateTemplateInput,
  TEMPLATE_THEMES,
} from '@/services/invoice-templates'

export function useInvoiceTemplates() {
  const { organizationId, loading: authLoading } = useAuth()
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    if (!organizationId) return
    
    setLoading(true)
    setError(null)
    
    try {
      // First try to get all templates
      let data = await invoiceTemplateService.getTemplates(organizationId)
      
      // If no templates exist, get/create the default one
      if (data.length === 0) {
        const defaultTemplate = await invoiceTemplateService.getDefaultTemplate(organizationId)
        if (defaultTemplate) {
          data = [defaultTemplate]
        }
      }
      
      setTemplates(data)
    } catch (err) {
      setError('Failed to fetch templates')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (authLoading) return
    if (!organizationId) {
      setLoading(false)
      return
    }
    fetchTemplates()
  }, [fetchTemplates, authLoading, organizationId])

  const defaultTemplate = templates.find(t => t.isDefault) || templates[0]

  const createTemplate = async (input: CreateTemplateInput): Promise<InvoiceTemplate | null> => {
    if (!organizationId) return null
    try {
      const created = await invoiceTemplateService.createTemplate(input, organizationId)
      if (created) {
        setTemplates(prev => [...prev, created])
      }
      return created
    } catch (err) {
      console.error('Failed to create template:', err)
      return null
    }
  }

  const updateTemplate = async (id: string, updates: UpdateTemplateInput): Promise<boolean> => {
    if (!organizationId) return false
    try {
      const updated = await invoiceTemplateService.updateTemplate(id, updates, organizationId)
      if (updated) {
        setTemplates(prev => {
          // If this template is now default, unset others
          if (updates.isDefault) {
            return prev.map(t => t.id === id ? updated : { ...t, isDefault: false })
          }
          return prev.map(t => t.id === id ? updated : t)
        })
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to update template:', err)
      return false
    }
  }

  const deleteTemplate = async (id: string): Promise<boolean> => {
    if (!organizationId) return false
    try {
      const success = await invoiceTemplateService.deleteTemplate(id, organizationId)
      if (success) {
        setTemplates(prev => prev.filter(t => t.id !== id))
      }
      return success
    } catch (err) {
      console.error('Failed to delete template:', err)
      return false
    }
  }

  const applyTheme = async (templateId: string, themeName: keyof typeof TEMPLATE_THEMES): Promise<boolean> => {
    if (!organizationId) return false
    try {
      const updated = await invoiceTemplateService.applyTheme(templateId, themeName, organizationId)
      if (updated) {
        setTemplates(prev => prev.map(t => t.id === templateId ? updated : t))
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to apply theme:', err)
      return false
    }
  }

  return {
    templates,
    defaultTemplate,
    loading,
    error,
    refetch: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTheme,
    themes: TEMPLATE_THEMES,
  }
}
