'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  employeesService, 
  type Employee, 
  type EmployeeStatus,
  type CreateEmployeeInput 
} from '@/services/employees'
import { useAuth } from './use-auth'

export function useEmployees(filters?: { status?: EmployeeStatus; departmentId?: string }) {
  const { organizationId, loading: authLoading } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEmployees = useCallback(async () => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await employeesService.getEmployees(organizationId, filters)
      setEmployees(data)
    } catch (err) {
      setError('Failed to fetch employees')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId, filters?.status, filters?.departmentId, authLoading])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const createEmployee = async (input: CreateEmployeeInput): Promise<Employee | null> => {
    if (!organizationId) return null
    
    try {
      const employee = await employeesService.createEmployee(input, organizationId)
      if (employee) {
        setEmployees(prev => [...prev, employee].sort((a, b) => 
          a.lastName.localeCompare(b.lastName)
        ))
      }
      return employee
    } catch (err) {
      console.error('Failed to create employee:', err)
      return null
    }
  }

  const updateEmployee = async (id: string, input: Partial<CreateEmployeeInput>): Promise<Employee | null> => {
    if (!organizationId) return null
    
    try {
      const updated = await employeesService.updateEmployee(id, input, organizationId)
      if (updated) {
        setEmployees(prev => prev.map(e => e.id === id ? updated : e))
      }
      return updated
    } catch (err) {
      console.error('Failed to update employee:', err)
      return null
    }
  }

  const updateStatus = async (id: string, status: EmployeeStatus, terminationDate?: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await employeesService.updateStatus(id, status, organizationId, terminationDate)
      if (success) {
        setEmployees(prev => prev.map(e => 
          e.id === id 
            ? { ...e, employmentStatus: status, terminationDate: terminationDate || e.terminationDate }
            : e
        ))
      }
      return success
    } catch (err) {
      console.error('Failed to update status:', err)
      return false
    }
  }

  const deleteEmployee = async (id: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await employeesService.deleteEmployee(id, organizationId)
      if (success) {
        setEmployees(prev => prev.filter(e => e.id !== id))
      }
      return success
    } catch (err) {
      console.error('Failed to delete employee:', err)
      return false
    }
  }

  return {
    employees,
    loading: loading || authLoading,
    error,
    refetch: fetchEmployees,
    createEmployee,
    updateEmployee,
    updateStatus,
    deleteEmployee,
  }
}

export function useEmployee(id: string | null) {
  const { organizationId, loading: authLoading } = useAuth()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !organizationId || authLoading) {
      setEmployee(null)
      setLoading(false)
      return
    }
    
    setLoading(true)
    
    employeesService.getEmployee(id, organizationId)
      .then(data => setEmployee(data))
      .catch(err => {
        setError('Failed to fetch employee')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [id, organizationId, authLoading])

  return { employee, loading: loading || authLoading, error }
}

export function useEmployeeStats() {
  const { organizationId, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<{
    totalEmployees: number
    activeEmployees: number
    onLeave: number
    terminated: number
    totalPayroll: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    
    employeesService.getStats(organizationId)
      .then(data => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [organizationId, authLoading])

  return { stats, loading: loading || authLoading }
}

export function useDepartments() {
  const { organizationId, loading: authLoading } = useAuth()
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    
    employeesService.getDepartments(organizationId)
      .then(data => setDepartments(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [organizationId, authLoading])

  return { departments, loading: loading || authLoading }
}
