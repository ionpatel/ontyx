import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

export type ROEReasonCode = 
  | 'A' // Shortage of work / End of contract or season
  | 'B' // Strike or lockout
  | 'C' // Return to school
  | 'D' // Illness or injury
  | 'E' // Quit
  | 'F' // Maternity
  | 'G' // Retirement
  | 'H' // Work-sharing
  | 'J' // Apprentice training
  | 'K' // Other
  | 'M' // Dismissal
  | 'N' // Leave of absence
  | 'P' // Parental
  | 'Z' // Compassionate care / Family caregiver

export const ROE_REASON_LABELS: Record<ROEReasonCode, string> = {
  'A': 'Shortage of work / End of contract',
  'B': 'Strike or lockout',
  'C': 'Return to school',
  'D': 'Illness or injury',
  'E': 'Quit',
  'F': 'Maternity',
  'G': 'Retirement',
  'H': 'Work-sharing',
  'J': 'Apprentice training',
  'K': 'Other',
  'M': 'Dismissal',
  'N': 'Leave of absence',
  'P': 'Parental',
  'Z': 'Compassionate care / Family caregiver',
}

export interface ROEData {
  id: string
  organizationId: string
  employeeId: string
  
  // Employee info
  employeeSIN: string
  employeeFirstName: string
  employeeLastName: string
  employeeAddress: string
  employeeCity: string
  employeeProvince: string
  employeePostalCode: string
  
  // Employer info
  employerBusinessNumber: string
  employerName: string
  employerAddress: string
  employerCity: string
  employerProvince: string
  employerPostalCode: string
  employerPhone: string
  employerContactName: string
  
  // Employment dates
  firstDayWorked: string
  lastDayForWhichPaid: string
  finalPayPeriodEndDate: string
  
  // Reason
  reasonCode: ROEReasonCode
  expectedRecallDate?: string
  
  // Pay period type
  payPeriodType: 'weekly' | 'biweekly' | 'semi-monthly' | 'monthly'
  
  // Insurable earnings (last 27 weeks/pay periods)
  insurableEarningsByPeriod: Array<{
    periodNumber: number
    periodEndDate: string
    earnings: number
  }>
  
  // Totals
  totalInsurableEarnings: number
  totalInsurableHours: number
  
  // Vacation pay
  vacationPay: number
  vacationPayIncluded: boolean
  
  // Other monies
  otherMonies: Array<{
    type: string
    amount: number
    startDate?: string
    endDate?: string
  }>
  
  // Special payments
  statutoryHolidayPay: number
  otherPayments: number
  
  // Metadata
  serialNumber?: string
  status: 'draft' | 'submitted' | 'amended'
  createdAt: string
  submittedAt?: string
}

export interface CreateROEInput {
  employeeId: string
  lastDayForWhichPaid: string
  reasonCode: ROEReasonCode
  expectedRecallDate?: string
  comments?: string
}

export interface Employee {
  id: string
  firstName: string
  lastName: string
  sin: string
  address?: string
  city?: string
  province?: string
  postalCode?: string
  hireDate: string
  terminationDate?: string
  payRate: number
  payType: 'hourly' | 'salary'
}

// ============================================================================
// SERVICE
// ============================================================================

export const roeService = {
  /**
   * Get all ROEs for an organization
   */
  async getROEs(organizationId: string): Promise<ROEData[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('roe_records')
      .select(`
        *,
        employee:employees(id, first_name, last_name, sin)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching ROEs:', error)
      return []
    }
    
    return (data || []).map(mapROEFromDb)
  },
  
  /**
   * Get a single ROE
   */
  async getROE(id: string, organizationId: string): Promise<ROEData | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('roe_records')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()
    
    if (error) {
      console.error('Error fetching ROE:', error)
      return null
    }
    
    return mapROEFromDb(data)
  },
  
  /**
   * Generate ROE data from payroll records
   */
  async generateROE(input: CreateROEInput, organizationId: string): Promise<ROEData | null> {
    const supabase = createClient()
    
    // Get employee info
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', input.employeeId)
      .eq('organization_id', organizationId)
      .single()
    
    if (empError || !employee) {
      console.error('Employee not found:', empError)
      return null
    }
    
    // Get organization info
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()
    
    if (orgError || !org) {
      console.error('Organization not found:', orgError)
      return null
    }
    
    // Get payslips for the last 27 pay periods before last day paid
    const { data: payslips, error: payError } = await supabase
      .from('payslips')
      .select(`
        *,
        payroll_run:payroll_runs(pay_period_start, pay_period_end, pay_date)
      `)
      .eq('employee_id', input.employeeId)
      .lte('payroll_run.pay_date', input.lastDayForWhichPaid)
      .order('payroll_run(pay_date)', { ascending: false })
      .limit(27)
    
    // Calculate insurable earnings by period
    const insurableEarningsByPeriod = (payslips || []).map((slip, idx) => ({
      periodNumber: idx + 1,
      periodEndDate: slip.payroll_run?.pay_period_end || '',
      earnings: slip.gross_pay || 0,
    }))
    
    // Calculate totals
    const totalInsurableEarnings = insurableEarningsByPeriod.reduce((sum, p) => sum + p.earnings, 0)
    const totalInsurableHours = (payslips || []).reduce((sum, slip) => sum + (slip.hours_worked || 0), 0)
    const vacationPay = (payslips || []).reduce((sum, slip) => sum + (slip.vacation_pay || 0), 0)
    
    // Determine pay period type from org settings
    const payPeriodType = org.pay_frequency || 'biweekly'
    
    // Generate serial number
    const serialNumber = generateSerialNumber()
    
    // Build ROE data
    const roeData = {
      organization_id: organizationId,
      employee_id: input.employeeId,
      
      // Employee info
      employee_sin: employee.sin || '',
      employee_first_name: employee.first_name,
      employee_last_name: employee.last_name,
      employee_address: employee.address || '',
      employee_city: employee.city || '',
      employee_province: employee.province || 'ON',
      employee_postal_code: employee.postal_code || '',
      
      // Employer info
      employer_business_number: org.tax_number || org.business_number || '',
      employer_name: org.name,
      employer_address: org.address_line1 || '',
      employer_city: org.city || '',
      employer_province: org.province || 'ON',
      employer_postal_code: org.postal_code || '',
      employer_phone: org.phone || '',
      employer_contact_name: '', // Could be set from user
      
      // Employment dates
      first_day_worked: employee.hire_date || employee.start_date,
      last_day_for_which_paid: input.lastDayForWhichPaid,
      final_pay_period_end_date: payslips?.[0]?.payroll_run?.pay_period_end || input.lastDayForWhichPaid,
      
      // Reason
      reason_code: input.reasonCode,
      expected_recall_date: input.expectedRecallDate,
      
      // Pay period
      pay_period_type: payPeriodType,
      
      // Insurable earnings
      insurable_earnings_by_period: insurableEarningsByPeriod,
      total_insurable_earnings: totalInsurableEarnings,
      total_insurable_hours: totalInsurableHours,
      
      // Vacation
      vacation_pay: vacationPay,
      vacation_pay_included: vacationPay > 0,
      
      // Other
      other_monies: [],
      statutory_holiday_pay: 0,
      other_payments: 0,
      
      // Metadata
      serial_number: serialNumber,
      status: 'draft',
      comments: input.comments,
    }
    
    // Save to database
    const { data: inserted, error: insertError } = await supabase
      .from('roe_records')
      .insert(roeData)
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating ROE:', insertError)
      return null
    }
    
    return mapROEFromDb(inserted)
  },
  
  /**
   * Update ROE status
   */
  async updateStatus(id: string, status: 'draft' | 'submitted' | 'amended', organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    const updates: Record<string, any> = { status }
    if (status === 'submitted') {
      updates.submitted_at = new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('roe_records')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error updating ROE status:', error)
      return false
    }
    
    return true
  },
  
  /**
   * Delete ROE (only drafts)
   */
  async deleteROE(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('roe_records')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('status', 'draft')
    
    if (error) {
      console.error('Error deleting ROE:', error)
      return false
    }
    
    return true
  },
  
  /**
   * Get employees eligible for ROE (terminated or on leave)
   */
  async getEligibleEmployees(organizationId: string): Promise<Employee[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('organization_id', organizationId)
      .or('status.eq.terminated,status.eq.on_leave,status.eq.active')
      .order('last_name')
    
    if (error) {
      console.error('Error fetching employees:', error)
      return []
    }
    
    return (data || []).map(emp => ({
      id: emp.id,
      firstName: emp.first_name,
      lastName: emp.last_name,
      sin: emp.sin || '',
      address: emp.address,
      city: emp.city,
      province: emp.province,
      postalCode: emp.postal_code,
      hireDate: emp.hire_date || emp.start_date,
      terminationDate: emp.termination_date,
      payRate: emp.pay_rate || emp.hourly_rate || emp.salary || 0,
      payType: emp.pay_type || 'hourly',
    }))
  },
}

// ============================================================================
// HELPERS
// ============================================================================

function generateSerialNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 9; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function mapROEFromDb(row: any): ROEData {
  return {
    id: row.id,
    organizationId: row.organization_id,
    employeeId: row.employee_id,
    
    employeeSIN: row.employee_sin || '',
    employeeFirstName: row.employee_first_name,
    employeeLastName: row.employee_last_name,
    employeeAddress: row.employee_address || '',
    employeeCity: row.employee_city || '',
    employeeProvince: row.employee_province || 'ON',
    employeePostalCode: row.employee_postal_code || '',
    
    employerBusinessNumber: row.employer_business_number || '',
    employerName: row.employer_name,
    employerAddress: row.employer_address || '',
    employerCity: row.employer_city || '',
    employerProvince: row.employer_province || 'ON',
    employerPostalCode: row.employer_postal_code || '',
    employerPhone: row.employer_phone || '',
    employerContactName: row.employer_contact_name || '',
    
    firstDayWorked: row.first_day_worked,
    lastDayForWhichPaid: row.last_day_for_which_paid,
    finalPayPeriodEndDate: row.final_pay_period_end_date,
    
    reasonCode: row.reason_code,
    expectedRecallDate: row.expected_recall_date,
    
    payPeriodType: row.pay_period_type || 'biweekly',
    
    insurableEarningsByPeriod: row.insurable_earnings_by_period || [],
    totalInsurableEarnings: row.total_insurable_earnings || 0,
    totalInsurableHours: row.total_insurable_hours || 0,
    
    vacationPay: row.vacation_pay || 0,
    vacationPayIncluded: row.vacation_pay_included || false,
    
    otherMonies: row.other_monies || [],
    statutoryHolidayPay: row.statutory_holiday_pay || 0,
    otherPayments: row.other_payments || 0,
    
    serialNumber: row.serial_number,
    status: row.status || 'draft',
    createdAt: row.created_at,
    submittedAt: row.submitted_at,
  }
}

// ============================================================================
// PDF GENERATION
// ============================================================================

export function generateROEPDFData(roe: ROEData): string {
  // This would generate a PDF matching the official ROE form
  // For now, return a summary that can be used with jsPDF
  return JSON.stringify(roe, null, 2)
}

export default roeService
