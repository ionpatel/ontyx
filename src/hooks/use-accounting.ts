'use client'

import { useState, useEffect, useCallback } from 'react'
import * as accountingService from '@/services/accounting'
import { useAuth } from '@/components/providers/auth-provider'
import type { 
  ChartOfAccount, 
  JournalEntry,
  CreateAccountInput, 
  CreateJournalEntryInput,
  AccountingSummary
} from '@/types/accounting'

// =============================================================================
// CHART OF ACCOUNTS
// =============================================================================

export function useChartOfAccounts() {
  const { organizationId, loading: authLoading } = useAuth()
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    if (!organizationId) {
      setAccounts([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await accountingService.getChartOfAccounts(organizationId)
      setAccounts(data)
    } catch (err) {
      setError('Failed to fetch accounts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (authLoading) return
    fetchAccounts()
  }, [fetchAccounts, authLoading])

  return {
    data: accounts,
    isLoading: loading || authLoading,
    error,
    refetch: fetchAccounts
  }
}

export function useAccount(id: string | undefined) {
  const [account, setAccount] = useState<ChartOfAccount | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAccount = useCallback(async () => {
    if (!id) {
      setAccount(null)
      setLoading(false)
      return
    }
    
    try {
      const data = await accountingService.getAccount(id)
      setAccount(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAccount()
  }, [fetchAccount])

  return { data: account, isLoading: loading, refetch: fetchAccount }
}

export function useCreateAccount() {
  const { organizationId } = useAuth()
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (input: CreateAccountInput): Promise<ChartOfAccount> => {
    if (!organizationId) throw new Error('No organization')
    setIsPending(true)
    try {
      return await accountingService.createAccount(organizationId, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useUpdateAccount() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ id, input }: { id: string; input: Partial<CreateAccountInput> }): Promise<ChartOfAccount> => {
    setIsPending(true)
    try {
      return await accountingService.updateAccount(id, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useDeleteAccount() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (id: string): Promise<void> => {
    setIsPending(true)
    try {
      await accountingService.deleteAccount(id)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

// =============================================================================
// JOURNAL ENTRIES
// =============================================================================

export function useJournalEntries() {
  const { organizationId, loading: authLoading } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    if (!organizationId) {
      setEntries([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const data = await accountingService.getJournalEntries(organizationId)
      setEntries(data)
    } catch (err) {
      setError('Failed to fetch journal entries')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (authLoading) return
    fetchEntries()
  }, [fetchEntries, authLoading])

  return { data: entries, isLoading: loading, error, refetch: fetchEntries }
}

export function useJournalEntry(id: string | undefined) {
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEntry = useCallback(async () => {
    if (!id) {
      setEntry(null)
      setLoading(false)
      return
    }
    
    try {
      const data = await accountingService.getJournalEntry(id)
      setEntry(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchEntry()
  }, [fetchEntry])

  return { data: entry, isLoading: loading, refetch: fetchEntry }
}

export function useCreateJournalEntry() {
  const { organizationId } = useAuth()
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (input: CreateJournalEntryInput): Promise<JournalEntry> => {
    if (!organizationId) throw new Error('No organization')
    setIsPending(true)
    try {
      return await accountingService.createJournalEntry(organizationId, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function usePostJournalEntry() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (id: string): Promise<void> => {
    setIsPending(true)
    try {
      await accountingService.postJournalEntry(id)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useVoidJournalEntry() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ id, reason }: { id: string; reason: string }): Promise<void> => {
    setIsPending(true)
    try {
      await accountingService.voidJournalEntry(id, reason)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

// =============================================================================
// SUMMARY
// =============================================================================

export function useAccountingSummary() {
  const { organizationId, loading: authLoading } = useAuth()
  const [summary, setSummary] = useState<AccountingSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    if (!organizationId) {
      setSummary(null)
      setLoading(false)
      return
    }
    
    try {
      const data = await accountingService.getAccountingSummary(organizationId)
      setSummary(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (authLoading) return
    fetchSummary()
  }, [fetchSummary, authLoading])

  return { data: summary, isLoading: loading }
}
