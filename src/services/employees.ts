import { createClient } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export type EmployeeStatus = 'active' | 'on_leave' | 'terminated'
export type PayType = 'hourly' | 'salary'

export interface Employee {
  id: string
  organizationId: string
  
  // Personal
  firstName: string
  lastName: string
  email?: string
  phone?: string
  
  // Address
  address?: string
  city?: string
  province: string
  postalCode?: string
  
  // Tax Info
  sin?: string
  dateOfBirth?: string
  
  // Employment
  employeeNumber?: string
  department?: string
  jobTitle?: string
  hireDate?: string
  startDate?: string
  terminationDate?: string
  status: EmployeeStatus
  
  // Compensation
  payType: PayType
  payRate: number
  hoursPerWeek: number
  
  // Tax Forms
  td1FederalClaim: number
  td1ProvincialClaim: number
  
  // Banking
  bankAccountNumber?: string
  bankTransitNumber?: string
  bankInstitutionNumber?: string
  
  // Metadata
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateEmployeeInput {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  city?: string
  province?: string
  postalCode?: string
  sin?: string
  dateOfBirth?: string
  employeeNumber?: string
  department?: string
  jobTitle?: string
  hireDate?: string
  payType?: PayType
  payRate?: number
  hoursPerWeek?: number
  td1FederalClaim?: number
  td1ProvincialClaim?: number
  bankAccountNumber?: string
  bankTransitNumber?: string
  bankInstitutionNumber?: string
  notes?: string
}

// ============================================================================
// SERVICE
// ============================================================================

export const employeesService = {
  async getEmployees(organizationId: string, filters?: {
    status?: EmployeeStatus
    department?: string
  }): Promise<Employee[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('employees')
      .select('*')
      .eq('organization_id', organizationId)
      .order('last_name')
      .order('first_name')
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.department) {
      query = query.eq('department', filters.department)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching employees:', error)
      return []
    }
    
    return (data || []).map(mapEmployeeFromDb)
  },
  
  async getEmployee(id: string, organizationId: string): Promise<Employee | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()
    
    if (error) {
      console.error('Error fetching employee:', error)
      return null
    }
    
    return mapEmployeeFromDb(data)
  },
  
  async createEmployee(input: CreateEmployeeInput, organizationId: string): Promise<Employee | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('employees')
      .insert({
        organization_id: organizationId,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        address: input.address,
        city: input.city,
        province: input.province || 'ON',
        postal_code: input.postalCode,
        sin: input.sin,
        date_of_birth: input.dateOfBirth,
        employee_number: input.employeeNumber,
        department: input.department,
        job_title: input.jobTitle,
        hire_date: input.hireDate || new Date().toISOString().split('T')[0],
        start_date: input.hireDate || new Date().toISOString().split('T')[0],
        status: 'active',
        pay_type: input.payType || 'hourly',
        pay_rate: input.payRate || 0,
        hours_per_week: input.hoursPerWeek || 40,
        td1_federal_claim: input.td1FederalClaim || 15000,
        td1_provincial_claim: input.td1ProvincialClaim || 11865,
        bank_account_number: input.bankAccountNumber,
        bank_transit_number: input.bankTransitNumber,
        bank_institution_number: input.bankInstitutionNumber,
        notes: input.notes,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating employee:', error)
      return null
    }
    
    return mapEmployeeFromDb(data)
  },
  
  async updateEmployee(id: string, input: Partial<CreateEmployeeInput>, organizationId: string): Promise<Employee | null> {
    const supabase = createClient()
    
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    
    if (input.firstName) updates.first_name = input.firstName
    if (input.lastName) updates.last_name = input.lastName
    if (input.email !== undefined) updates.email = input.email
    if (input.phone !== undefined) updates.phone = input.phone
    if (input.address !== undefined) updates.address = input.address
    if (input.city !== undefined) updates.city = input.city
    if (input.province !== undefined) updates.province = input.province
    if (input.postalCode !== undefined) updates.postal_code = input.postalCode
    if (input.sin !== undefined) updates.sin = input.sin
    if (input.dateOfBirth !== undefined) updates.date_of_birth = input.dateOfBirth
    if (input.employeeNumber !== undefined) updates.employee_number = input.employeeNumber
    if (input.department !== undefined) updates.department = input.department
    if (input.jobTitle !== undefined) updates.job_title = input.jobTitle
    if (input.hireDate !== undefined) updates.hire_date = input.hireDate
    if (input.payType !== undefined) updates.pay_type = input.payType
    if (input.payRate !== undefined) updates.pay_rate = input.payRate
    if (input.hoursPerWeek !== undefined) updates.hours_per_week = input.hoursPerWeek
    if (input.td1FederalClaim !== undefined) updates.td1_federal_claim = input.td1FederalClaim
    if (input.td1ProvincialClaim !== undefined) updates.td1_provincial_claim = input.td1ProvincialClaim
    if (input.bankAccountNumber !== undefined) updates.bank_account_number = input.bankAccountNumber
    if (input.bankTransitNumber !== undefined) updates.bank_transit_number = input.bankTransitNumber
    if (input.bankInstitutionNumber !== undefined) updates.bank_institution_number = input.bankInstitutionNumber
    if (input.notes !== undefined) updates.notes = input.notes
    
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating employee:', error)
      return null
    }
    
    return mapEmployeeFromDb(data)
  },
  
  async updateStatus(id: string, status: EmployeeStatus, organizationId: string, terminationDate?: string): Promise<boolean> {
    const supabase = createClient()
    
    const updates: Record<string, any> = { 
      status,
      updated_at: new Date().toISOString()
    }
    
    if (status === 'terminated' && terminationDate) {
      updates.termination_date = terminationDate
    }
    
    const { error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error updating employee status:', error)
      return false
    }
    
    return true
  },
  
  async deleteEmployee(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error deleting employee:', error)
      return false
    }
    
    return true
  },
  
  async getStats(organizationId: string): Promise<{
    totalEmployees: number
    activeEmployees: number
    onLeave: number
    terminated: number
    totalPayroll: number
  }> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('employees')
      .select('status, pay_type, pay_rate, hours_per_week')
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error fetching employee stats:', error)
      return { totalEmployees: 0, activeEmployees: 0, onLeave: 0, terminated: 0, totalPayroll: 0 }
    }
    
    const employees = data || []
    const active = employees.filter(e => e.status === 'active')
    
    // Calculate monthly payroll estimate
    let totalPayroll = 0
    active.forEach(emp => {
      if (emp.pay_type === 'salary') {
        totalPayroll += (emp.pay_rate || 0) / 12
      } else {
        totalPayroll += (emp.pay_rate || 0) * (emp.hours_per_week || 40) * 4.33
      }
    })
    
    return {
      totalEmployees: employees.length,
      activeEmployees: active.length,
      onLeave: employees.filter(e => e.status === 'on_leave').length,
      terminated: employees.filter(e => e.status === 'terminated').length,
      totalPayroll,
    }
  },
  
  async getDepartments(organizationId: string): Promise<string[]> {
    const supabase = createClient()
    
    const { data } = await supabase
      .from('employees')
      .select('department')
      .eq('organization_id', organizationId)
      .not('department', 'is', null)
    
    const departments = new Set<string>()
    ;(data || []).forEach(e => {
      if (e.department) departments.add(e.department)
    })
    
    return Array.from(departments).sort()
  },
}

// ============================================================================
// MAPPER
// ============================================================================

function mapEmployeeFromDb(row: any): Employee {
  return {
    id: row.id,
    organizationId: row.organization_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    province: row.province || 'ON',
    postalCode: row.postal_code,
    sin: row.sin,
    dateOfBirth: row.date_of_birth,
    employeeNumber: row.employee_number,
    department: row.department,
    jobTitle: row.job_title,
    hireDate: row.hire_date,
    startDate: row.start_date,
    terminationDate: row.termination_date,
    status: row.status || 'active',
    payType: row.pay_type || 'hourly',
    payRate: row.pay_rate || 0,
    hoursPerWeek: row.hours_per_week || 40,
    td1FederalClaim: row.td1_federal_claim || 15000,
    td1ProvincialClaim: row.td1_provincial_claim || 11865,
    bankAccountNumber: row.bank_account_number,
    bankTransitNumber: row.bank_transit_number,
    bankInstitutionNumber: row.bank_institution_number,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default employeesService
