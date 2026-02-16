/**
 * Pay Runs Service
 * 
 * Manages payroll runs including:
 * - Creating pay runs for a period
 * - Calculating employee pay with deductions
 * - Generating pay stubs
 * - Processing/approving pay runs
 */

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { 
  calculatePayroll, 
  getPeriodsPerYear,
  type PayrollCalculation,
  type Employee,
  CPP_RATES,
  EI_RATES,
} from './payroll'

// ============================================================================
// TYPES
// ============================================================================

export type PayRunStatus = 'draft' | 'pending' | 'approved' | 'processing' | 'completed' | 'cancelled'
export type PayFrequency = 'weekly' | 'biweekly' | 'semi-monthly' | 'monthly'

export interface PayRun {
  id: string
  organizationId: string
  
  // Period
  name: string
  periodStart: string
  periodEnd: string
  payDate: string
  payFrequency: PayFrequency
  
  // Totals
  totalEmployees: number
  totalGross: number
  totalCpp: number
  totalEi: number
  totalFederalTax: number
  totalProvincialTax: number
  totalDeductions: number
  totalNet: number
  
  // Status
  status: PayRunStatus
  approvedBy?: string
  approvedAt?: string
  processedAt?: string
  
  createdAt: string
  updatedAt: string
}

export interface PayRunEmployee {
  id: string
  payRunId: string
  employeeId: string
  employeeName: string
  employeeEmail?: string
  
  // Hours (for hourly employees)
  regularHours: number
  overtimeHours: number
  
  // Pay
  regularPay: number
  overtimePay: number
  otherEarnings: number
  grossPay: number
  
  // Deductions
  cpp: number
  cpp2: number
  ei: number
  federalTax: number
  provincialTax: number
  otherDeductions: number
  totalDeductions: number
  
  // Net
  netPay: number
  
  // YTD (Year-to-date)
  ytdGross: number
  ytdCpp: number
  ytdEi: number
  ytdFederalTax: number
  ytdProvincialTax: number
  ytdNet: number
}

export interface CreatePayRunInput {
  name: string
  periodStart: string
  periodEnd: string
  payDate: string
  payFrequency: PayFrequency
}

// ============================================================================
// DEMO DATA
// ============================================================================

const demoEmployees: Employee[] = [
  {
    id: 'emp-001',
    organizationId: 'demo',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@company.ca',
    hireDate: '2024-03-15',
    employmentType: 'full-time',
    payType: 'salary',
    payRate: 75000,
    hoursPerWeek: 40,
    province: 'ON',
    td1FederalClaim: 15705,
    td1ProvincialClaim: 12399,
    isActive: true,
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
  },
  {
    id: 'emp-002',
    organizationId: 'demo',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@company.ca',
    hireDate: '2023-06-01',
    employmentType: 'full-time',
    payType: 'salary',
    payRate: 95000,
    hoursPerWeek: 40,
    province: 'ON',
    td1FederalClaim: 15705,
    td1ProvincialClaim: 12399,
    isActive: true,
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2023-06-01T00:00:00Z',
  },
  {
    id: 'emp-003',
    organizationId: 'demo',
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike.chen@company.ca',
    hireDate: '2025-01-10',
    employmentType: 'full-time',
    payType: 'salary',
    payRate: 65000,
    hoursPerWeek: 40,
    province: 'ON',
    td1FederalClaim: 15705,
    td1ProvincialClaim: 12399,
    isActive: true,
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
]

// Demo pay runs
const demoPayRuns: PayRun[] = [
  {
    id: 'pr-001',
    organizationId: 'demo',
    name: 'February 2026 - Period 1',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-15',
    payDate: '2026-02-20',
    payFrequency: 'semi-monthly',
    totalEmployees: 3,
    totalGross: 9791.67,
    totalCpp: 538.73,
    totalEi: 159.60,
    totalFederalTax: 1450.00,
    totalProvincialTax: 780.00,
    totalDeductions: 2928.33,
    totalNet: 6863.34,
    status: 'completed',
    processedAt: '2026-02-20T09:00:00Z',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-20T09:00:00Z',
  },
]

let demoPayRunStore = [...demoPayRuns]
let demoPayRunEmployeeStore: PayRunEmployee[] = []

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(): string {
  return `pr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
}

function calculateEmployeePay(
  employee: Employee,
  payFrequency: PayFrequency,
  ytdGross: number = 0,
  ytdCpp: number = 0,
  ytdEi: number = 0
): PayRunEmployee {
  const periodsPerYear = getPeriodsPerYear(payFrequency)
  const regularPay = employee.payType === 'salary' 
    ? employee.payRate / periodsPerYear
    : employee.payRate * employee.hoursPerWeek * (payFrequency === 'weekly' ? 1 : payFrequency === 'biweekly' ? 2 : payFrequency === 'semi-monthly' ? 2.167 : 4.33)
  
  const calc = calculatePayroll(
    regularPay,
    employee.province,
    periodsPerYear,
    ytdCpp,
    ytdEi,
    employee.td1FederalClaim,
    employee.td1ProvincialClaim
  )

  return {
    id: `pre-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    payRunId: '',
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    employeeEmail: employee.email,
    regularHours: employee.hoursPerWeek * (payFrequency === 'weekly' ? 1 : payFrequency === 'biweekly' ? 2 : 2.167),
    overtimeHours: 0,
    regularPay,
    overtimePay: 0,
    otherEarnings: 0,
    grossPay: calc.grossPay,
    cpp: calc.cpp,
    cpp2: calc.cpp2,
    ei: calc.ei,
    federalTax: calc.federalTax,
    provincialTax: calc.provincialTax,
    otherDeductions: 0,
    totalDeductions: calc.totalDeductions,
    netPay: calc.netPay,
    ytdGross: ytdGross + calc.grossPay,
    ytdCpp: ytdCpp + calc.cpp + calc.cpp2,
    ytdEi: ytdEi + calc.ei,
    ytdFederalTax: 0,
    ytdProvincialTax: 0,
    ytdNet: 0,
  }
}

// ============================================================================
// SERVICE
// ============================================================================

export const payRunsService = {
  /**
   * Get all pay runs for an organization
   */
  async getPayRuns(organizationId: string): Promise<PayRun[]> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() ) {
      return demoPayRunStore.filter(pr => pr.organizationId === 'demo')
    }

    const { data, error } = await supabase
      .from('pay_runs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('pay_date', { ascending: false })

    if (error) {
      console.error('Error fetching pay runs:', error)
      return []
    }

    return data.map(mapPayRunFromDb)
  },

  /**
   * Get a single pay run with employees
   */
  async getPayRun(id: string, organizationId: string): Promise<{ payRun: PayRun; employees: PayRunEmployee[] } | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() ) {
      const payRun = demoPayRunStore.find(pr => pr.id === id)
      if (!payRun) return null
      
      const employees = demoPayRunEmployeeStore.filter(e => e.payRunId === id)
      return { payRun, employees }
    }

    const { data: payRunData, error: payRunError } = await supabase
      .from('pay_runs')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (payRunError || !payRunData) return null

    const { data: employeesData } = await supabase
      .from('pay_run_employees')
      .select('*')
      .eq('pay_run_id', id)

    return {
      payRun: mapPayRunFromDb(payRunData),
      employees: (employeesData || []).map(mapPayRunEmployeeFromDb),
    }
  },

  /**
   * Create a new pay run (draft) with calculated employee pay
   */
  async createPayRun(
    input: CreatePayRunInput,
    organizationId: string
  ): Promise<PayRun | null> {
    const supabase = createClient()
    
    // Get employees
    const employees = organizationId === 'demo' ? demoEmployees : []
    
    // Calculate pay for each employee
    const payRunEmployees = employees.map(emp => 
      calculateEmployeePay(emp, input.payFrequency)
    )
    
    // Calculate totals
    const totals = payRunEmployees.reduce((acc, emp) => ({
      totalGross: acc.totalGross + emp.grossPay,
      totalCpp: acc.totalCpp + emp.cpp + emp.cpp2,
      totalEi: acc.totalEi + emp.ei,
      totalFederalTax: acc.totalFederalTax + emp.federalTax,
      totalProvincialTax: acc.totalProvincialTax + emp.provincialTax,
      totalDeductions: acc.totalDeductions + emp.totalDeductions,
      totalNet: acc.totalNet + emp.netPay,
    }), {
      totalGross: 0,
      totalCpp: 0,
      totalEi: 0,
      totalFederalTax: 0,
      totalProvincialTax: 0,
      totalDeductions: 0,
      totalNet: 0,
    })
    
    const payRunId = generateId()
    
    const newPayRun: PayRun = {
      id: payRunId,
      organizationId,
      name: input.name,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      payDate: input.payDate,
      payFrequency: input.payFrequency,
      totalEmployees: payRunEmployees.length,
      ...totals,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    if (!supabase || !isSupabaseConfigured() ) {
      demoPayRunStore.push(newPayRun)
      
      // Store employees
      payRunEmployees.forEach(emp => {
        demoPayRunEmployeeStore.push({ ...emp, payRunId })
      })
      
      return newPayRun
    }

    // Insert pay run and employees in database
    // ... (database logic would go here)
    
    return newPayRun
  },

  /**
   * Update pay run status
   */
  async updateStatus(
    id: string,
    status: PayRunStatus,
    organizationId: string
  ): Promise<boolean> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() ) {
      const idx = demoPayRunStore.findIndex(pr => pr.id === id)
      if (idx === -1) return false
      
      demoPayRunStore[idx] = {
        ...demoPayRunStore[idx],
        status,
        updatedAt: new Date().toISOString(),
        ...(status === 'approved' ? { approvedAt: new Date().toISOString() } : {}),
        ...(status === 'completed' ? { processedAt: new Date().toISOString() } : {}),
      }
      return true
    }

    const { error } = await supabase
      .from('pay_runs')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'approved' ? { approved_at: new Date().toISOString() } : {}),
        ...(status === 'completed' ? { processed_at: new Date().toISOString() } : {}),
      })
      .eq('id', id)
      .eq('organization_id', organizationId)

    return !error
  },

  /**
   * Delete a draft pay run
   */
  async deletePayRun(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() ) {
      const idx = demoPayRunStore.findIndex(pr => pr.id === id && pr.status === 'draft')
      if (idx === -1) return false
      
      demoPayRunStore.splice(idx, 1)
      demoPayRunEmployeeStore = demoPayRunEmployeeStore.filter(e => e.payRunId !== id)
      return true
    }

    const { error } = await supabase
      .from('pay_runs')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('status', 'draft')

    return !error
  },

  /**
   * Get employees for pay run calculations
   */
  async getEmployees(organizationId: string): Promise<Employee[]> {
    if (organizationId === 'demo') {
      return demoEmployees
    }
    
    // Would fetch from database
    return []
  },
}

// ============================================================================
// DB MAPPING
// ============================================================================

function mapPayRunFromDb(row: any): PayRun {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    payDate: row.pay_date,
    payFrequency: row.pay_frequency,
    totalEmployees: row.total_employees,
    totalGross: row.total_gross,
    totalCpp: row.total_cpp,
    totalEi: row.total_ei,
    totalFederalTax: row.total_federal_tax,
    totalProvincialTax: row.total_provincial_tax,
    totalDeductions: row.total_deductions,
    totalNet: row.total_net,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    processedAt: row.processed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapPayRunEmployeeFromDb(row: any): PayRunEmployee {
  return {
    id: row.id,
    payRunId: row.pay_run_id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    employeeEmail: row.employee_email,
    regularHours: row.regular_hours,
    overtimeHours: row.overtime_hours,
    regularPay: row.regular_pay,
    overtimePay: row.overtime_pay,
    otherEarnings: row.other_earnings,
    grossPay: row.gross_pay,
    cpp: row.cpp,
    cpp2: row.cpp2,
    ei: row.ei,
    federalTax: row.federal_tax,
    provincialTax: row.provincial_tax,
    otherDeductions: row.other_deductions,
    totalDeductions: row.total_deductions,
    netPay: row.net_pay,
    ytdGross: row.ytd_gross,
    ytdCpp: row.ytd_cpp,
    ytdEi: row.ytd_ei,
    ytdFederalTax: row.ytd_federal_tax,
    ytdProvincialTax: row.ytd_provincial_tax,
    ytdNet: row.ytd_net,
  }
}

export default payRunsService
