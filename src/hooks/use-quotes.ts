'use client'

import { useState, useEffect, useCallback } from 'react'
import { quotesService } from '@/services/quotes'
import { useAuth } from './use-auth'
import type { Quote, QuoteStatus, CreateQuoteInput, QuoteStats } from '@/types/quotes'

export function useQuotes(status?: QuoteStatus) {
  const { organizationId, user, loading: authLoading } = useAuth()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuotes = useCallback(async () => {
    if (!organizationId || authLoading) return

    setLoading(true)
    setError(null)

    try {
      const data = await quotesService.getQuotes(organizationId, status)
      setQuotes(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quotes')
    } finally {
      setLoading(false)
    }
  }, [organizationId, status, authLoading])

  useEffect(() => {
    fetchQuotes()
  }, [fetchQuotes])

  const createQuote = async (input: CreateQuoteInput): Promise<Quote | null> => {
    if (!organizationId || !user) return null

    const quote = await quotesService.createQuote(organizationId, user.id, input)
    if (quote) {
      setQuotes(prev => [quote, ...prev])
    }
    return quote
  }

  const updateQuote = async (quoteId: string, updates: Partial<Quote>): Promise<Quote | null> => {
    if (!organizationId) return null

    const updated = await quotesService.updateQuote(quoteId, organizationId, updates)
    if (updated) {
      setQuotes(prev => prev.map(q => q.id === quoteId ? updated : q))
    }
    return updated
  }

  const sendQuote = async (quoteId: string): Promise<boolean> => {
    if (!organizationId) return false

    const success = await quotesService.sendQuote(quoteId, organizationId)
    if (success) {
      setQuotes(prev => prev.map(q => 
        q.id === quoteId ? { ...q, status: 'sent' as QuoteStatus, sent_at: new Date().toISOString() } : q
      ))
    }
    return success
  }

  const acceptQuote = async (quoteId: string): Promise<boolean> => {
    if (!organizationId) return false

    const success = await quotesService.acceptQuote(quoteId, organizationId)
    if (success) {
      setQuotes(prev => prev.map(q => 
        q.id === quoteId ? { ...q, status: 'accepted' as QuoteStatus, accepted_at: new Date().toISOString() } : q
      ))
    }
    return success
  }

  const rejectQuote = async (quoteId: string, reason?: string): Promise<boolean> => {
    if (!organizationId) return false

    const success = await quotesService.rejectQuote(quoteId, organizationId, reason)
    if (success) {
      setQuotes(prev => prev.map(q => 
        q.id === quoteId ? { ...q, status: 'rejected' as QuoteStatus, rejected_at: new Date().toISOString() } : q
      ))
    }
    return success
  }

  const convertToInvoice = async (quoteId: string): Promise<string | null> => {
    if (!organizationId) return null

    const invoiceId = await quotesService.convertToInvoice(quoteId, organizationId)
    if (invoiceId) {
      setQuotes(prev => prev.map(q => 
        q.id === quoteId ? { 
          ...q, 
          status: 'converted' as QuoteStatus, 
          converted_to_invoice_id: invoiceId,
          converted_at: new Date().toISOString() 
        } : q
      ))
    }
    return invoiceId
  }

  const deleteQuote = async (quoteId: string): Promise<boolean> => {
    if (!organizationId) return false

    const success = await quotesService.deleteQuote(quoteId, organizationId)
    if (success) {
      setQuotes(prev => prev.filter(q => q.id !== quoteId))
    }
    return success
  }

  return {
    quotes,
    loading: loading || authLoading,
    error,
    refetch: fetchQuotes,
    createQuote,
    updateQuote,
    sendQuote,
    acceptQuote,
    rejectQuote,
    convertToInvoice,
    deleteQuote,
  }
}

export function useQuote(quoteId: string) {
  const { organizationId, loading: authLoading } = useAuth()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId || !quoteId || authLoading) return

    setLoading(true)
    quotesService.getQuote(quoteId, organizationId)
      .then(data => setQuote(data))
      .finally(() => setLoading(false))
  }, [organizationId, quoteId, authLoading])

  return { quote, loading: loading || authLoading }
}

export function useQuoteStats() {
  const { organizationId, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<QuoteStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId || authLoading) return

    setLoading(true)
    quotesService.getQuoteStats(organizationId)
      .then(data => setStats(data))
      .finally(() => setLoading(false))
  }, [organizationId, authLoading])

  return { stats, loading: loading || authLoading }
}
