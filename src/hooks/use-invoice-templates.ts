'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'
import {
  invoiceTemplateService,
  type InvoiceTemplate,
  type CreateTemplateInput,
  type UpdateTemplateInput,
  TEMPLATE_THEMES,
} from '@/services/invoice-templates'

export function useInvoiceTemplates() {
  const { organizationId } = useAuth()
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const effectiveOrgId = organizationId 

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await invoiceTemplateService.getTemplates(effectiveOrgId)
      setTemplates(data)
    } catch (err) {
      setError('Failed to fetch templates')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [effectiveOrgId])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const defaultTemplate = templates.find(t => t.isDefault) || templates[0]

  const createTemplate = async (input: CreateTemplateInput): Promise<InvoiceTemplate | null> => {
    try {
      const created = await invoiceTemplateService.createTemplate(input, effectiveOrgId)
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
    try {
      const updated = await invoiceTemplateService.updateTemplate(id, updates, effectiveOrgId)
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
    try {
      const success = await invoiceTemplateService.deleteTemplate(id, effectiveOrgId)
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
    try {
      const updated = await invoiceTemplateService.applyTheme(templateId, themeName, effectiveOrgId)
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
