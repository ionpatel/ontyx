'use client'

import { useState, useEffect, useCallback } from 'react'
import { roeService, type ROEData, type CreateROEInput, type Employee } from '@/services/roe'
import { useAuth } from './use-auth'

export function useROEs() {
  const { organizationId, loading: authLoading } = useAuth()
  const [roes, setRoes] = useState<ROEData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchROEs = useCallback(async () => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await roeService.getROEs(organizationId)
      setRoes(data)
    } catch (err) {
      setError('Failed to fetch ROE records')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId, authLoading])

  useEffect(() => {
    fetchROEs()
  }, [fetchROEs])

  const generateROE = async (input: CreateROEInput): Promise<ROEData | null> => {
    if (!organizationId) return null
    
    try {
      const roe = await roeService.generateROE(input, organizationId)
      if (roe) {
        setRoes(prev => [roe, ...prev])
      }
      return roe
    } catch (err) {
      console.error('Failed to generate ROE:', err)
      return null
    }
  }

  const updateStatus = async (id: string, status: 'draft' | 'submitted' | 'amended'): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await roeService.updateStatus(id, status, organizationId)
      if (success) {
        setRoes(prev => prev.map(r => 
          r.id === id 
            ? { ...r, status, submittedAt: status === 'submitted' ? new Date().toISOString() : r.submittedAt }
            : r
        ))
      }
      return success
    } catch (err) {
      console.error('Failed to update ROE status:', err)
      return false
    }
  }

  const deleteROE = async (id: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await roeService.deleteROE(id, organizationId)
      if (success) {
        setRoes(prev => prev.filter(r => r.id !== id))
      }
      return success
    } catch (err) {
      console.error('Failed to delete ROE:', err)
      return false
    }
  }

  return {
    roes,
    loading: loading || authLoading,
    error,
    refetch: fetchROEs,
    generateROE,
    updateStatus,
    deleteROE,
  }
}

export function useEligibleEmployees() {
  const { organizationId, loading: authLoading } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    
    roeService.getEligibleEmployees(organizationId)
      .then(data => setEmployees(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [organizationId, authLoading])

  return { employees, loading: loading || authLoading }
}
