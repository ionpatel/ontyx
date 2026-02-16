'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'
import {
  payRunsService,
  type PayRun,
  type PayRunEmployee,
  type CreatePayRunInput,
  type PayRunStatus,
} from '@/services/pay-runs'

export function usePayRuns() {
  const { organizationId } = useAuth()
  const [payRuns, setPayRuns] = useState<PayRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const effectiveOrgId = organizationId 

  const fetchPayRuns = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await payRunsService.getPayRuns(effectiveOrgId)
      setPayRuns(data)
    } catch (err) {
      setError('Failed to fetch pay runs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [effectiveOrgId])

  useEffect(() => {
    fetchPayRuns()
  }, [fetchPayRuns])

  const createPayRun = async (input: CreatePayRunInput): Promise<PayRun | null> => {
    try {
      const created = await payRunsService.createPayRun(input, effectiveOrgId)
      if (created) {
        setPayRuns(prev => [created, ...prev])
      }
      return created
    } catch (err) {
      console.error('Failed to create pay run:', err)
      return null
    }
  }

  const updateStatus = async (id: string, status: PayRunStatus): Promise<boolean> => {
    try {
      const success = await payRunsService.updateStatus(id, status, effectiveOrgId)
      if (success) {
        setPayRuns(prev => prev.map(pr => 
          pr.id === id ? { ...pr, status, updatedAt: new Date().toISOString() } : pr
        ))
      }
      return success
    } catch (err) {
      console.error('Failed to update pay run status:', err)
      return false
    }
  }

  const deletePayRun = async (id: string): Promise<boolean> => {
    try {
      const success = await payRunsService.deletePayRun(id, effectiveOrgId)
      if (success) {
        setPayRuns(prev => prev.filter(pr => pr.id !== id))
      }
      return success
    } catch (err) {
      console.error('Failed to delete pay run:', err)
      return false
    }
  }

  // Stats
  const stats = {
    total: payRuns.length,
    draft: payRuns.filter(pr => pr.status === 'draft').length,
    pending: payRuns.filter(pr => pr.status === 'pending').length,
    completed: payRuns.filter(pr => pr.status === 'completed').length,
    ytdTotal: payRuns
      .filter(pr => pr.status === 'completed')
      .reduce((sum, pr) => sum + pr.totalGross, 0),
  }

  return {
    payRuns,
    loading,
    error,
    stats,
    refetch: fetchPayRuns,
    createPayRun,
    updateStatus,
    deletePayRun,
  }
}

export function usePayRunDetail(payRunId: string) {
  const { organizationId } = useAuth()
  const [payRun, setPayRun] = useState<PayRun | null>(null)
  const [employees, setEmployees] = useState<PayRunEmployee[]>([])
  const [loading, setLoading] = useState(true)

  const effectiveOrgId = organizationId 

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const result = await payRunsService.getPayRun(payRunId, effectiveOrgId)
      if (result) {
        setPayRun(result.payRun)
        setEmployees(result.employees)
      }
      setLoading(false)
    }
    fetch()
  }, [payRunId, effectiveOrgId])

  return { payRun, employees, loading }
}
