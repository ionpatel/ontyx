// Payroll Types for Ontyx HR

export type PayrollStatus = 'draft' | 'pending' | 'processing' | 'completed' | 'cancelled'
export type PayPeriod = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly'
export type PayslipStatus = 'draft' | 'approved' | 'paid' | 'cancelled'

export interface EarningItem {
  id: string
  name: string
  type: 'salary' | 'bonus' | 'overtime' | 'commission' | 'allowance' | 'other'
  amount: number
  hours?: number
  rate?: number
}

export interface DeductionItem {
  id: string
  name: string
  type: 'tax' | 'insurance' | 'retirement' | 'garnishment' | 'other'
  amount: number
  percentage?: number
}

export interface Payslip {
  id: string
  payrollRunId: string
  employeeId: string
  employeeName: string
  employeeEmail: string
  department: string
  status: PayslipStatus
  periodStart: string
  periodEnd: string
  payDate: string
  earnings: EarningItem[]
  deductions: DeductionItem[]
  grossPay: number
  totalDeductions: number
  netPay: number
  ytdGross: number
  ytdNet: number
  currency: string
  notes?: string
  approvedBy?: string
  approvedAt?: string
}

export interface PayrollRun {
  id: string
  name: string
  period: PayPeriod
  periodStart: string
  periodEnd: string
  payDate: string
  status: PayrollStatus
  totalEmployees: number
  totalGross: number
  totalDeductions: number
  totalNet: number
  currency: string
  payslips: Payslip[]
  createdAt: string
  createdBy: string
  processedAt?: string
  processedBy?: string
  notes?: string
}

export interface PayrollStats {
  totalPayrollYTD: number
  lastPayrollAmount: number
  avgSalary: number
  totalEmployees: number
  nextPayrollDate: string
  pendingApprovals: number
}
