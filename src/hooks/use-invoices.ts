'use client'

import { useState, useEffect, useCallback } from 'react'
import { invoicesService, type Invoice, type InvoiceStatus, type CreateInvoiceInput, type InvoiceStats } from '@/services/invoices'
import { useAuth } from './use-auth'

export function useInvoices(filters?: {
  status?: InvoiceStatus
  customerId?: string
  fromDate?: string
  toDate?: string
}) {
  const { organizationId } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvoices = useCallback(async () => {
    if (!organizationId) {
      setInvoices([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const data = await invoicesService.getInvoices(organizationId, filters)
      setInvoices(data)
    } catch (err) {
      setError('Failed to fetch invoices')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId, filters?.status, filters?.customerId, filters?.fromDate, filters?.toDate])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const createInvoice = async (input: CreateInvoiceInput): Promise<Invoice | null> => {
    if (!organizationId) return null
    
    try {
      const invoice = await invoicesService.createInvoice(input, organizationId)
      if (invoice) {
        setInvoices(prev => [invoice, ...prev])
      }
      return invoice
    } catch (err) {
      console.error('Failed to create invoice:', err)
      return null
    }
  }

  const updateInvoiceStatus = async (id: string, status: InvoiceStatus, paidDate?: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await invoicesService.updateInvoiceStatus(id, status, organizationId, paidDate)
      if (success) {
        setInvoices(prev => prev.map(i => 
          i.id === id ? { 
            ...i, 
            status, 
            updatedAt: new Date().toISOString(),
            paidDate: status === 'paid' ? (paidDate || new Date().toISOString().split('T')[0]) : i.paidDate,
            sentAt: status === 'sent' ? new Date().toISOString() : i.sentAt,
          } : i
        ))
      }
      return success
    } catch (err) {
      console.error('Failed to update invoice status:', err)
      return false
    }
  }

  const recordPayment = async (id: string, amount: number, paymentDate?: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await invoicesService.recordPayment(id, amount, organizationId, paymentDate)
      if (success) {
        // Refetch to get updated values
        await fetchInvoices()
      }
      return success
    } catch (err) {
      console.error('Failed to record payment:', err)
      return false
    }
  }

  return {
    invoices,
    loading,
    error,
    refetch: fetchInvoices,
    createInvoice,
    updateInvoiceStatus,
    recordPayment,
  }
}

export function useInvoice(id: string | null) {
  const { organizationId } = useAuth()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !organizationId) {
      setInvoice(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    invoicesService.getInvoice(id, organizationId)
      .then(data => setInvoice(data))
      .catch(err => {
        setError('Failed to fetch invoice')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [id, organizationId])

  return { invoice, loading, error }
}

export function useInvoiceStats() {
  const { organizationId } = useAuth()
  const [stats, setStats] = useState<InvoiceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setStats(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    invoicesService.getStats(organizationId)
      .then(data => setStats(data))
      .catch(err => {
        setError('Failed to fetch stats')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [organizationId])

  return { stats, loading, error }
}
