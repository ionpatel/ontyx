import { createClient } from '@/lib/supabase/client'
import { calculatePayroll, type PayrollInput, type PayrollResult } from './payroll'

// ============================================================================
// TYPES
// ============================================================================

export interface Employee {
  id: string
  organizationId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  employeeNumber: string
  department?: string
  position?: string
  hireDate: string
  salary: number
  payFrequency: 'weekly' | 'biweekly' | 'semi-monthly' | 'monthly'
  province: string
  sin?: string
  bankInfo?: {
    institution: string
    transit: string
    account: string
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PayRunEmployee {
  id: string
  payRunId: string
  employeeId: string
  employeeName: string
  regularHours: number
  overtimeHours: number
  grossPay: number
  cpp: number
  ei: number
  federalTax: number
  provincialTax: number
  totalDeductions: number
  netPay: number
  ytdGross: number
  ytdCpp: number
  ytdEi: number
  ytdTax: number
}

export interface PayRun {
  id: string
  organizationId: string
  payPeriodStart: string
  payPeriodEnd: string
  payDate: string
  status: 'draft' | 'processing' | 'approved' | 'completed' | 'cancelled'
  totalGross: number
  totalDeductions: number
  totalNet: number
  employeeCount: number
  employees?: PayRunEmployee[]
  notes?: string
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// SERVICE
// ============================================================================

export const payRunsService = {
  async getPayRuns(organizationId: string): Promise<PayRun[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('payroll_runs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('pay_date', { ascending: false })

    if (error) {
      console.error('Error fetching pay runs:', error)
      return []
    }

    return (data || []).map(mapPayRunFromDb)
  },

  async getPayRun(id: string, organizationId: string): Promise<PayRun | null> {
    const supabase = createClient()

    const { data: payRun, error: payRunError } = await supabase
      .from('payroll_runs')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (payRunError) {
      console.error('Error fetching pay run:', payRunError)
      return null
    }

    const { data: employees, error: empError } = await supabase
      .from('payslips')
      .select('*, employee:employees(first_name, last_name, email)')
      .eq('payroll_run_id', id)

    if (empError) {
      console.error('Error fetching pay run employees:', empError)
    }

    return {
      ...mapPayRunFromDb(payRun),
      employees: (employees || []).map(mapPayRunEmployeeFromDb),
    }
  },

  async getEmployees(organizationId: string): Promise<Employee[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('last_name', { ascending: true })

    if (error) {
      console.error('Error fetching employees:', error)
      return []
    }

    return (data || []).map(mapEmployeeFromDb)
  },

  async createPayRun(input: {
    payPeriodStart: string
    payPeriodEnd: string
    payDate: string
    employeeIds: string[]
    notes?: string
  }, organizationId: string): Promise<PayRun | null> {
    const supabase = createClient()

    // Get employees
    const employees = await this.getEmployees(organizationId)
    const selectedEmployees = employees.filter(e => input.employeeIds.includes(e.id))

    // Calculate payroll for each
    const payrollResults: { employee: Employee; result: PayrollResult }[] = []
    
    for (const emp of selectedEmployees) {
      const payrollInput: PayrollInput = {
        grossPay: emp.salary / (emp.payFrequency === 'weekly' ? 52 : emp.payFrequency === 'biweekly' ? 26 : emp.payFrequency === 'semi-monthly' ? 24 : 12),
        province: emp.province as any,
        payFrequency: emp.payFrequency,
        ytdGross: 0,
        ytdCpp: 0,
        ytdEi: 0,
      }
      const result = calculatePayroll(payrollInput)
      payrollResults.push({ employee: emp, result })
    }

    const totalGross = payrollResults.reduce((sum, pr) => sum + pr.result.grossPay, 0)
    const totalDeductions = payrollResults.reduce((sum, pr) => sum + pr.result.totalDeductions, 0)
    const totalNet = payrollResults.reduce((sum, pr) => sum + pr.result.netPay, 0)

    // Insert pay run
    const { data: payRun, error: payRunError } = await supabase
      .from('payroll_runs')
      .insert({
        organization_id: organizationId,
        pay_period_start: input.payPeriodStart,
        pay_period_end: input.payPeriodEnd,
        pay_date: input.payDate,
        status: 'draft',
        total_gross: totalGross,
        total_deductions: totalDeductions,
        total_net: totalNet,
        employee_count: selectedEmployees.length,
        notes: input.notes,
      })
      .select()
      .single()

    if (payRunError) {
      console.error('Error creating pay run:', payRunError)
      return null
    }

    // Insert employees
    const employeeRecords = payrollResults.map(({ employee, result }) => ({
      payroll_run_id: payRun.id,
      employee_id: employee.id,
      regular_hours: 80,
      overtime_hours: 0,
      regular_pay: result.grossPay,
      overtime_pay: 0,
      gross_pay: result.grossPay,
      taxes: {
        cpp: result.cpp,
        ei: result.ei,
        federal: result.federalTax,
        provincial: result.provincialTax,
      },
      total_taxes: result.cpp + result.ei + result.federalTax + result.provincialTax,
      total_deductions: result.totalDeductions,
      net_pay: result.netPay,
      ytd_gross: result.grossPay,
      ytd_taxes: result.federalTax + result.provincialTax + result.cpp + result.ei,
      ytd_net: result.netPay,
    }))

    const { error: empError } = await supabase.from('payslips').insert(employeeRecords)
    if (empError) console.error('Error inserting pay run employees:', empError)

    return this.getPayRun(payRun.id, organizationId)
  },

  async updatePayRunStatus(id: string, status: PayRun['status'], organizationId: string): Promise<boolean> {
    const supabase = createClient()

    const updates: Record<string, any> = { status, updated_at: new Date().toISOString() }
    if (status === 'approved') {
      updates.approved_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('payroll_runs')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating pay run status:', error)
      return false
    }
    return true
  },

  async deletePayRun(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    // Delete employees first
    await supabase.from('payslips').delete().eq('payroll_run_id', id)

    const { error } = await supabase
      .from('payroll_runs')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('status', 'draft')

    if (error) {
      console.error('Error deleting pay run:', error)
      return false
    }
    return true
  },
}

// ============================================================================
// MAPPERS
// ============================================================================

function mapPayRunFromDb(row: any): PayRun {
  return {
    id: row.id,
    organizationId: row.organization_id,
    payPeriodStart: row.pay_period_start,
    payPeriodEnd: row.pay_period_end,
    payDate: row.pay_date,
    status: row.status,
    totalGross: row.total_gross,
    totalDeductions: row.total_deductions,
    totalNet: row.total_net,
    employeeCount: row.employee_count,
    notes: row.notes,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapPayRunEmployeeFromDb(row: any): PayRunEmployee {
  const taxes = row.taxes || {}
  return {
    id: row.id,
    payRunId: row.payroll_run_id,
    employeeId: row.employee_id,
    employeeName: row.employee?.first_name ? `${row.employee.first_name} ${row.employee.last_name}` : 'Unknown',
    regularHours: row.regular_hours || 0,
    overtimeHours: row.overtime_hours || 0,
    grossPay: row.gross_pay || 0,
    cpp: taxes.cpp || 0,
    ei: taxes.ei || 0,
    federalTax: taxes.federal || 0,
    provincialTax: taxes.provincial || 0,
    totalDeductions: row.total_deductions || 0,
    netPay: row.net_pay || 0,
    ytdGross: row.ytd_gross || 0,
    ytdCpp: taxes.cpp || 0,
    ytdEi: taxes.ei || 0,
    ytdTax: row.ytd_taxes || 0,
  }
}

function mapEmployeeFromDb(row: any): Employee {
  return {
    id: row.id,
    organizationId: row.organization_id,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    email: row.email || '',
    phone: row.phone || row.mobile,
    employeeNumber: row.employee_number || '',
    department: row.department_id, // TODO: join with departments table
    position: row.job_title,
    hireDate: row.hire_date,
    salary: 50000, // TODO: get from employee_compensation table
    payFrequency: 'biweekly', // TODO: get from employee_compensation table
    province: row.state || 'ON', // using state field as province
    sin: row.tax_id,
    bankInfo: row.bank_account_number ? {
      institution: row.bank_name || '',
      transit: row.bank_routing_number || '',
      account: row.bank_account_number || '',
    } : undefined,
    isActive: row.employment_status !== 'terminated',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default payRunsService
