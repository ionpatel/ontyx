'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  departmentsService, 
  type Department,
  type CreateDepartmentInput 
} from '@/services/departments'
import { useAuth } from './use-auth'

export function useDepartments(includeInactive = false) {
  const { organizationId, loading: authLoading } = useAuth()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDepartments = useCallback(async () => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await departmentsService.getDepartments(organizationId, includeInactive)
      setDepartments(data)
    } catch (err) {
      setError('Failed to fetch departments')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId, includeInactive, authLoading])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  const createDepartment = async (input: CreateDepartmentInput): Promise<Department | null> => {
    if (!organizationId) return null
    
    try {
      const dept = await departmentsService.createDepartment(input, organizationId)
      if (dept) {
        setDepartments(prev => [...prev, dept].sort((a, b) => a.name.localeCompare(b.name)))
      }
      return dept
    } catch (err) {
      console.error('Failed to create department:', err)
      return null
    }
  }

  const updateDepartment = async (id: string, input: Partial<CreateDepartmentInput>): Promise<Department | null> => {
    if (!organizationId) return null
    
    try {
      const updated = await departmentsService.updateDepartment(id, input, organizationId)
      if (updated) {
        setDepartments(prev => prev.map(d => d.id === id ? updated : d))
      }
      return updated
    } catch (err) {
      console.error('Failed to update department:', err)
      return null
    }
  }

  const toggleActive = async (id: string, isActive: boolean): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await departmentsService.toggleActive(id, isActive, organizationId)
      if (success) {
        setDepartments(prev => prev.map(d => d.id === id ? { ...d, isActive } : d))
      }
      return success
    } catch (err) {
      console.error('Failed to toggle department:', err)
      return false
    }
  }

  const deleteDepartment = async (id: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await departmentsService.deleteDepartment(id, organizationId)
      if (success) {
        setDepartments(prev => prev.filter(d => d.id !== id))
      }
      return success
    } catch (err) {
      console.error('Failed to delete department:', err)
      return false
    }
  }

  return {
    departments,
    loading: loading || authLoading,
    error,
    refetch: fetchDepartments,
    createDepartment,
    updateDepartment,
    toggleActive,
    deleteDepartment,
  }
}
