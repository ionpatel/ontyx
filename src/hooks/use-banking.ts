'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  bankingService, 
  type BankAccount, 
  type BankTransaction, 
  type BankingSummary,
  type CreateBankAccountInput,
  type CreateTransactionInput 
} from '@/services/banking'
import { useAuth } from './use-auth'

// ============================================================================
// BANK ACCOUNTS HOOK
// ============================================================================

export function useBankAccounts() {
  const { organizationId, loading: authLoading } = useAuth()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await bankingService.getAccounts(organizationId)
      setAccounts(data)
    } catch (err) {
      setError('Failed to fetch bank accounts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId, authLoading])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const createAccount = async (input: CreateBankAccountInput): Promise<BankAccount | null> => {
    if (!organizationId) return null
    
    try {
      const account = await bankingService.createAccount(input, organizationId)
      if (account) {
        setAccounts(prev => [account, ...prev])
      }
      return account
    } catch (err) {
      console.error('Failed to create account:', err)
      return null
    }
  }

  const updateAccount = async (id: string, input: Partial<CreateBankAccountInput>): Promise<BankAccount | null> => {
    if (!organizationId) return null
    
    try {
      const updated = await bankingService.updateAccount(id, input, organizationId)
      if (updated) {
        setAccounts(prev => prev.map(a => a.id === id ? updated : a))
      }
      return updated
    } catch (err) {
      console.error('Failed to update account:', err)
      return null
    }
  }

  const deleteAccount = async (id: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await bankingService.deleteAccount(id, organizationId)
      if (success) {
        setAccounts(prev => prev.filter(a => a.id !== id))
      }
      return success
    } catch (err) {
      console.error('Failed to delete account:', err)
      return false
    }
  }

  return {
    accounts,
    loading: loading || authLoading,
    error,
    refetch: fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  }
}

// ============================================================================
// TRANSACTIONS HOOK
// ============================================================================

export function useBankTransactions(accountId?: string) {
  const { organizationId, loading: authLoading } = useAuth()
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await bankingService.getTransactions(organizationId, { accountId })
      setTransactions(data)
    } catch (err) {
      setError('Failed to fetch transactions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId, accountId, authLoading])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const createTransaction = async (input: CreateTransactionInput): Promise<BankTransaction | null> => {
    if (!organizationId) return null
    
    try {
      const transaction = await bankingService.createTransaction(input, organizationId)
      if (transaction) {
        setTransactions(prev => [transaction, ...prev])
      }
      return transaction
    } catch (err) {
      console.error('Failed to create transaction:', err)
      return null
    }
  }

  const reconcileTransaction = async (id: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await bankingService.reconcileTransaction(id, organizationId)
      if (success) {
        setTransactions(prev => prev.map(t => 
          t.id === id ? { ...t, isReconciled: true, reconciledAt: new Date().toISOString() } : t
        ))
      }
      return success
    } catch (err) {
      console.error('Failed to reconcile transaction:', err)
      return false
    }
  }

  const categorizeTransaction = async (id: string, category: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await bankingService.categorizeTransaction(id, category, organizationId)
      if (success) {
        setTransactions(prev => prev.map(t => 
          t.id === id ? { ...t, category } : t
        ))
      }
      return success
    } catch (err) {
      console.error('Failed to categorize transaction:', err)
      return false
    }
  }

  const deleteTransaction = async (id: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await bankingService.deleteTransaction(id, organizationId)
      if (success) {
        setTransactions(prev => prev.filter(t => t.id !== id))
      }
      return success
    } catch (err) {
      console.error('Failed to delete transaction:', err)
      return false
    }
  }

  const unreconciledTransactions = transactions.filter(t => !t.isReconciled)
  const reconciledTransactions = transactions.filter(t => t.isReconciled)

  return {
    transactions,
    unreconciledTransactions,
    reconciledTransactions,
    loading: loading || authLoading,
    error,
    refetch: fetchTransactions,
    createTransaction,
    reconcileTransaction,
    categorizeTransaction,
    deleteTransaction,
  }
}

// ============================================================================
// SUMMARY HOOK
// ============================================================================

export function useBankingSummary() {
  const { organizationId, loading: authLoading } = useAuth()
  const [summary, setSummary] = useState<BankingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    
    bankingService.getSummary(organizationId)
      .then(data => setSummary(data))
      .catch(err => {
        setError('Failed to fetch summary')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [organizationId, authLoading])

  return { summary, loading: loading || authLoading, error }
}

// ============================================================================
// CATEGORIES HOOK
// ============================================================================

export function useTransactionCategories() {
  const { organizationId, loading: authLoading } = useAuth()
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    
    bankingService.getCategories(organizationId)
      .then(data => setCategories(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [organizationId, authLoading])

  return { categories, loading: loading || authLoading }
}
