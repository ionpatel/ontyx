'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'
import { 
  recurringInvoicesService, 
  type RecurringInvoice, 
  type CreateRecurringInput,
  type UpdateRecurringInput,
} from '@/services/recurring-invoices'

export function useRecurringInvoices() {
  const { organizationId } = useAuth()
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const effectiveOrgId = organizationId || 'demo'

  const fetchRecurring = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await recurringInvoicesService.listRecurring(effectiveOrgId)
      setRecurringInvoices(data)
    } catch (err) {
      setError('Failed to fetch recurring invoices')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [effectiveOrgId])

  useEffect(() => {
    fetchRecurring()
  }, [fetchRecurring])

  const createRecurring = async (input: CreateRecurringInput): Promise<RecurringInvoice | null> => {
    try {
      const created = await recurringInvoicesService.createRecurring(input, effectiveOrgId)
      if (created) {
        setRecurringInvoices(prev => [...prev, created])
      }
      return created
    } catch (err) {
      console.error('Failed to create recurring invoice:', err)
      return null
    }
  }

  const updateRecurring = async (id: string, updates: UpdateRecurringInput): Promise<boolean> => {
    try {
      const updated = await recurringInvoicesService.updateRecurring(id, updates, effectiveOrgId)
      if (updated) {
        setRecurringInvoices(prev => 
          prev.map(r => r.id === id ? updated : r)
        )
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to update recurring invoice:', err)
      return false
    }
  }

  const deleteRecurring = async (id: string): Promise<boolean> => {
    try {
      const success = await recurringInvoicesService.deleteRecurring(id, effectiveOrgId)
      if (success) {
        setRecurringInvoices(prev => prev.filter(r => r.id !== id))
      }
      return success
    } catch (err) {
      console.error('Failed to delete recurring invoice:', err)
      return false
    }
  }

  const toggleActive = async (id: string): Promise<boolean> => {
    try {
      const success = await recurringInvoicesService.toggleActive(id, effectiveOrgId)
      if (success) {
        setRecurringInvoices(prev => 
          prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r)
        )
      }
      return success
    } catch (err) {
      console.error('Failed to toggle recurring invoice:', err)
      return false
    }
  }

  // Stats
  const stats = {
    total: recurringInvoices.length,
    active: recurringInvoices.filter(r => r.isActive).length,
    paused: recurringInvoices.filter(r => !r.isActive).length,
    monthlyRevenue: recurringInvoices
      .filter(r => r.isActive && r.frequency === 'monthly')
      .reduce((sum, r) => sum + r.subtotal, 0),
  }

  return {
    recurringInvoices,
    loading,
    error,
    stats,
    refetch: fetchRecurring,
    createRecurring,
    updateRecurring,
    deleteRecurring,
    toggleActive,
  }
}
