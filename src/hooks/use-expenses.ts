'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  expensesService, 
  type Expense, 
  type ExpenseCategory,
  type ExpenseStatus,
  type CreateExpenseInput,
  type ExpenseStats
} from '@/services/expenses'
import { useAuth } from './use-auth'

export function useExpenses(filters?: {
  status?: ExpenseStatus
  categoryId?: string
  employeeId?: string
  startDate?: string
  endDate?: string
}) {
  const { organizationId, user, loading: authLoading } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExpenses = useCallback(async () => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await expensesService.getExpenses(organizationId, filters)
      setExpenses(data)
    } catch (err) {
      setError('Failed to fetch expenses')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId, filters?.status, filters?.categoryId, filters?.employeeId, filters?.startDate, filters?.endDate, authLoading])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const createExpense = async (input: CreateExpenseInput, employeeId?: string): Promise<Expense | null> => {
    if (!organizationId || !user) return null
    
    try {
      const expense = await expensesService.createExpense(input, organizationId, user.id, employeeId)
      if (expense) {
        setExpenses(prev => [expense, ...prev])
      }
      return expense
    } catch (err) {
      console.error('Failed to create expense:', err)
      return null
    }
  }

  const updateExpense = async (id: string, input: Partial<CreateExpenseInput>): Promise<Expense | null> => {
    if (!organizationId) return null
    
    try {
      const updated = await expensesService.updateExpense(id, input, organizationId)
      if (updated) {
        setExpenses(prev => prev.map(e => e.id === id ? updated : e))
      }
      return updated
    } catch (err) {
      console.error('Failed to update expense:', err)
      return null
    }
  }

  const submitExpense = async (id: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await expensesService.submitExpense(id, organizationId)
      if (success) {
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'submitted' as ExpenseStatus } : e))
      }
      return success
    } catch (err) {
      console.error('Failed to submit expense:', err)
      return false
    }
  }

  const approveExpense = async (id: string): Promise<boolean> => {
    if (!organizationId || !user) return false
    
    try {
      const success = await expensesService.approveExpense(id, organizationId, user.id)
      if (success) {
        setExpenses(prev => prev.map(e => e.id === id ? { 
          ...e, 
          status: 'approved' as ExpenseStatus,
          approvedBy: user.id,
          approvedAt: new Date().toISOString()
        } : e))
      }
      return success
    } catch (err) {
      console.error('Failed to approve expense:', err)
      return false
    }
  }

  const rejectExpense = async (id: string, reason: string): Promise<boolean> => {
    if (!organizationId || !user) return false
    
    try {
      const success = await expensesService.rejectExpense(id, organizationId, user.id, reason)
      if (success) {
        setExpenses(prev => prev.map(e => e.id === id ? { 
          ...e, 
          status: 'rejected' as ExpenseStatus,
          rejectionReason: reason
        } : e))
      }
      return success
    } catch (err) {
      console.error('Failed to reject expense:', err)
      return false
    }
  }

  const reimburseExpense = async (id: string, method: string, reference?: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await expensesService.reimburseExpense(id, organizationId, method, reference)
      if (success) {
        setExpenses(prev => prev.map(e => e.id === id ? { 
          ...e, 
          status: 'reimbursed' as ExpenseStatus,
          reimbursedAt: new Date().toISOString(),
          reimbursementMethod: method,
          reimbursementReference: reference
        } : e))
      }
      return success
    } catch (err) {
      console.error('Failed to reimburse expense:', err)
      return false
    }
  }

  const deleteExpense = async (id: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await expensesService.deleteExpense(id, organizationId)
      if (success) {
        setExpenses(prev => prev.filter(e => e.id !== id))
      }
      return success
    } catch (err) {
      console.error('Failed to delete expense:', err)
      return false
    }
  }

  return {
    expenses,
    loading: loading || authLoading,
    error,
    refetch: fetchExpenses,
    createExpense,
    updateExpense,
    submitExpense,
    approveExpense,
    rejectExpense,
    reimburseExpense,
    deleteExpense,
  }
}

export function useExpenseCategories() {
  const { organizationId, loading: authLoading } = useAuth()
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    
    expensesService.getCategories(organizationId)
      .then(data => {
        setCategories(data)
        // Seed defaults if none exist
        if (data.length === 0) {
          expensesService.seedDefaultCategories(organizationId)
            .then(() => expensesService.getCategories(organizationId))
            .then(seeded => setCategories(seeded))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [organizationId, authLoading])

  const createCategory = async (name: string, code?: string, description?: string): Promise<ExpenseCategory | null> => {
    if (!organizationId) return null
    
    const cat = await expensesService.createCategory({ name, code, description }, organizationId)
    if (cat) {
      setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)))
    }
    return cat
  }

  return { categories, loading: loading || authLoading, createCategory }
}

export function useExpenseStats() {
  const { organizationId, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<ExpenseStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    
    expensesService.getStats(organizationId)
      .then(data => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [organizationId, authLoading])

  return { stats, loading: loading || authLoading }
}
