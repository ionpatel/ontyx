import { createClient } from '@/lib/supabase/client'

// ============================================================================
// TYPES (aligned with 00004_relations_hr_schema.sql)
// ============================================================================

export type EmployeeStatus = 'active' | 'on_leave' | 'terminated' | 'resigned'
export type PayType = 'salary' | 'hourly'
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern' | 'freelance'

export interface Employee {
  id: string
  organizationId: string
  userId?: string
  
  // Personal
  employeeNumber?: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  mobile?: string
  dateOfBirth?: string
  gender?: string
  
  // Address
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  
  // Emergency Contact
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
  
  // Employment
  departmentId?: string
  jobTitle?: string
  employmentType: EmploymentType
  employmentStatus: EmployeeStatus
  managerId?: string
  
  // Dates
  hireDate: string
  probationEndDate?: string
  terminationDate?: string
  
  // Work Schedule
  workHoursPerWeek: number
  
  // Banking
  bankName?: string
  bankAccountNumber?: string
  bankRoutingNumber?: string
  
  // Tax
  taxId?: string
  taxFilingStatus?: string
  taxWithholdingAllowances: number
  
  // Profile
  avatarUrl?: string
  bio?: string
  
  // Metadata
  customFields?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CreateEmployeeInput {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  mobile?: string
  dateOfBirth?: string
  gender?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
  employeeNumber?: string
  departmentId?: string
  jobTitle?: string
  employmentType?: EmploymentType
  hireDate?: string
  probationEndDate?: string
  workHoursPerWeek?: number
  bankName?: string
  bankAccountNumber?: string
  bankRoutingNumber?: string
  taxId?: string
  taxFilingStatus?: string
  taxWithholdingAllowances?: number
  bio?: string
}

// ============================================================================
// SERVICE
// ============================================================================

export const employeesService = {
  async getEmployees(organizationId: string, filters?: {
    status?: EmployeeStatus
    departmentId?: string
  }): Promise<Employee[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('employees')
      .select('*')
      .eq('organization_id', organizationId)
      .order('last_name')
      .order('first_name')
    
    if (filters?.status) {
      query = query.eq('employment_status', filters.status)
    }
    if (filters?.departmentId) {
      query = query.eq('department_id', filters.departmentId)
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
        mobile: input.mobile,
        date_of_birth: input.dateOfBirth,
        gender: input.gender,
        address_line1: input.addressLine1,
        address_line2: input.addressLine2,
        city: input.city,
        state: input.state || 'ON',
        postal_code: input.postalCode,
        country: input.country || 'CA',
        emergency_contact_name: input.emergencyContactName,
        emergency_contact_phone: input.emergencyContactPhone,
        emergency_contact_relationship: input.emergencyContactRelationship,
        employee_number: input.employeeNumber,
        department_id: input.departmentId,
        job_title: input.jobTitle,
        employment_type: input.employmentType || 'full_time',
        employment_status: 'active',
        hire_date: input.hireDate || new Date().toISOString().split('T')[0],
        probation_end_date: input.probationEndDate,
        work_hours_per_week: input.workHoursPerWeek || 40,
        bank_name: input.bankName,
        bank_account_number: input.bankAccountNumber,
        bank_routing_number: input.bankRoutingNumber,
        tax_id: input.taxId,
        tax_filing_status: input.taxFilingStatus,
        tax_withholding_allowances: input.taxWithholdingAllowances || 0,
        bio: input.bio,
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
    
    if (input.firstName !== undefined) updates.first_name = input.firstName
    if (input.lastName !== undefined) updates.last_name = input.lastName
    if (input.email !== undefined) updates.email = input.email
    if (input.phone !== undefined) updates.phone = input.phone
    if (input.mobile !== undefined) updates.mobile = input.mobile
    if (input.dateOfBirth !== undefined) updates.date_of_birth = input.dateOfBirth
    if (input.gender !== undefined) updates.gender = input.gender
    if (input.addressLine1 !== undefined) updates.address_line1 = input.addressLine1
    if (input.addressLine2 !== undefined) updates.address_line2 = input.addressLine2
    if (input.city !== undefined) updates.city = input.city
    if (input.state !== undefined) updates.state = input.state
    if (input.postalCode !== undefined) updates.postal_code = input.postalCode
    if (input.country !== undefined) updates.country = input.country
    if (input.emergencyContactName !== undefined) updates.emergency_contact_name = input.emergencyContactName
    if (input.emergencyContactPhone !== undefined) updates.emergency_contact_phone = input.emergencyContactPhone
    if (input.emergencyContactRelationship !== undefined) updates.emergency_contact_relationship = input.emergencyContactRelationship
    if (input.employeeNumber !== undefined) updates.employee_number = input.employeeNumber
    if (input.departmentId !== undefined) updates.department_id = input.departmentId
    if (input.jobTitle !== undefined) updates.job_title = input.jobTitle
    if (input.employmentType !== undefined) updates.employment_type = input.employmentType
    if (input.hireDate !== undefined) updates.hire_date = input.hireDate
    if (input.probationEndDate !== undefined) updates.probation_end_date = input.probationEndDate
    if (input.workHoursPerWeek !== undefined) updates.work_hours_per_week = input.workHoursPerWeek
    if (input.bankName !== undefined) updates.bank_name = input.bankName
    if (input.bankAccountNumber !== undefined) updates.bank_account_number = input.bankAccountNumber
    if (input.bankRoutingNumber !== undefined) updates.bank_routing_number = input.bankRoutingNumber
    if (input.taxId !== undefined) updates.tax_id = input.taxId
    if (input.taxFilingStatus !== undefined) updates.tax_filing_status = input.taxFilingStatus
    if (input.taxWithholdingAllowances !== undefined) updates.tax_withholding_allowances = input.taxWithholdingAllowances
    if (input.bio !== undefined) updates.bio = input.bio
    
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
      employment_status: status,
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
    
    // Get employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, employment_status, work_hours_per_week')
      .eq('organization_id', organizationId)
    
    if (empError) {
      console.error('Error fetching employee stats:', empError)
      return { totalEmployees: 0, activeEmployees: 0, onLeave: 0, terminated: 0, totalPayroll: 0 }
    }
    
    const empList = employees || []
    const active = empList.filter(e => e.employment_status === 'active')
    
    // Get compensation for active employees
    let totalPayroll = 0
    if (active.length > 0) {
      const { data: comps } = await supabase
        .from('employee_compensation')
        .select('employee_id, pay_type, amount')
        .in('employee_id', active.map(e => e.id))
        .is('end_date', null)
      
      if (comps) {
        comps.forEach(comp => {
          const emp = active.find(e => e.id === comp.employee_id)
          if (comp.pay_type === 'salary') {
            totalPayroll += (comp.amount || 0) / 12
          } else {
            // hourly - estimate monthly
            totalPayroll += (comp.amount || 0) * (emp?.work_hours_per_week || 40) * 4.33
          }
        })
      }
    }
    
    return {
      totalEmployees: empList.length,
      activeEmployees: active.length,
      onLeave: empList.filter(e => e.employment_status === 'on_leave').length,
      terminated: empList.filter(e => e.employment_status === 'terminated' || e.employment_status === 'resigned').length,
      totalPayroll,
    }
  },
  
  async getDepartments(organizationId: string): Promise<{ id: string; name: string }[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.error('Error fetching departments:', error)
      return []
    }
    
    return data || []
  },
}

// ============================================================================
// MAPPER
// ============================================================================

function mapEmployeeFromDb(row: any): Employee {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    employeeNumber: row.employee_number,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    emergencyContactRelationship: row.emergency_contact_relationship,
    departmentId: row.department_id,
    jobTitle: row.job_title,
    employmentType: row.employment_type || 'full_time',
    employmentStatus: row.employment_status || 'active',
    managerId: row.manager_id,
    hireDate: row.hire_date,
    probationEndDate: row.probation_end_date,
    terminationDate: row.termination_date,
    workHoursPerWeek: row.work_hours_per_week || 40,
    bankName: row.bank_name,
    bankAccountNumber: row.bank_account_number,
    bankRoutingNumber: row.bank_routing_number,
    taxId: row.tax_id,
    taxFilingStatus: row.tax_filing_status,
    taxWithholdingAllowances: row.tax_withholding_allowances || 0,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    customFields: row.custom_fields,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default employeesService
