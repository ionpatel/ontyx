/**
 * Canadian Payroll Service
 * 
 * Handles payroll calculations including:
 * - CPP (Canada Pension Plan) contributions
 * - EI (Employment Insurance) premiums
 * - Federal and Provincial income tax
 * - Net pay calculation
 * 
 * Based on CRA 2026 rates (placeholder - update with actual rates)
 */

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

// ============================================================================
// 2026 TAX RATES & THRESHOLDS (These need to be updated annually)
// ============================================================================

export const TAX_YEAR = 2026

// CPP Rates
export const CPP_RATES = {
  rate: 0.0595,           // 5.95% employee contribution
  maxPensionableEarnings: 73200,  // Maximum pensionable earnings
  basicExemption: 3500,   // Basic exemption
  maxContribution: 4152.45,  // Maximum annual contribution
}

// CPP2 (Enhanced CPP) - Second tier
export const CPP2_RATES = {
  rate: 0.04,             // 4% employee contribution
  maxEarnings: 86000,     // Year's Additional Maximum Pensionable Earnings (YAMPE)
  maxContribution: 188.00,  // Maximum annual CPP2 contribution
}

// EI Rates
export const EI_RATES = {
  rate: 0.0163,           // 1.63% employee rate
  maxInsurableEarnings: 64900,  // Maximum insurable earnings
  maxPremium: 1058.27,    // Maximum annual premium
}

// Federal Tax Brackets
export const FEDERAL_TAX_BRACKETS = [
  { min: 0, max: 55867, rate: 0.15 },
  { min: 55867, max: 111733, rate: 0.205 },
  { min: 111733, max: 173205, rate: 0.26 },
  { min: 173205, max: 246752, rate: 0.29 },
  { min: 246752, max: Infinity, rate: 0.33 },
]

// Federal Basic Personal Amount
export const FEDERAL_BPA = 15705

// Provincial Tax Rates (simplified - full rates are more complex)
export const PROVINCIAL_TAX_RATES: Record<string, { brackets: { min: number; max: number; rate: number }[]; bpa: number }> = {
  ON: {
    brackets: [
      { min: 0, max: 51446, rate: 0.0505 },
      { min: 51446, max: 102894, rate: 0.0915 },
      { min: 102894, max: 150000, rate: 0.1116 },
      { min: 150000, max: 220000, rate: 0.1216 },
      { min: 220000, max: Infinity, rate: 0.1316 },
    ],
    bpa: 12399,
  },
  BC: {
    brackets: [
      { min: 0, max: 47937, rate: 0.0506 },
      { min: 47937, max: 95875, rate: 0.077 },
      { min: 95875, max: 110076, rate: 0.105 },
      { min: 110076, max: 133664, rate: 0.1229 },
      { min: 133664, max: 181232, rate: 0.147 },
      { min: 181232, max: 252752, rate: 0.168 },
      { min: 252752, max: Infinity, rate: 0.205 },
    ],
    bpa: 12580,
  },
  AB: {
    brackets: [
      { min: 0, max: 148269, rate: 0.10 },
      { min: 148269, max: 177922, rate: 0.12 },
      { min: 177922, max: 237230, rate: 0.13 },
      { min: 237230, max: 355845, rate: 0.14 },
      { min: 355845, max: Infinity, rate: 0.15 },
    ],
    bpa: 21885,
  },
  QC: {
    brackets: [
      { min: 0, max: 51780, rate: 0.14 },
      { min: 51780, max: 103545, rate: 0.19 },
      { min: 103545, max: 126000, rate: 0.24 },
      { min: 126000, max: Infinity, rate: 0.2575 },
    ],
    bpa: 18056,
  },
  // Add other provinces as needed...
}

// Default fallback for provinces without specific rates
const DEFAULT_PROVINCIAL_RATES = {
  brackets: [
    { min: 0, max: 50000, rate: 0.10 },
    { min: 50000, max: 100000, rate: 0.12 },
    { min: 100000, max: Infinity, rate: 0.15 },
  ],
  bpa: 12000,
}

// ============================================================================
// TYPES
// ============================================================================

export interface Employee {
  id: string
  organizationId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  sin?: string  // Social Insurance Number (masked in display)
  dateOfBirth?: string
  hireDate: string
  terminationDate?: string
  
  // Employment details
  employmentType: 'full-time' | 'part-time' | 'contractor'
  payType: 'salary' | 'hourly'
  payRate: number  // Annual salary or hourly rate
  hoursPerWeek: number
  
  // Tax info
  province: string
  td1FederalClaim: number  // Federal TD1 claim amount
  td1ProvincialClaim: number  // Provincial TD1 claim amount
  
  // Banking
  bankAccount?: string
  bankTransit?: string
  bankInstitution?: string
  
  // Status
  isActive: boolean
  
  createdAt: string
  updatedAt: string
}

export interface PayPeriod {
  startDate: string
  endDate: string
  payDate: string
  type: 'weekly' | 'biweekly' | 'semi-monthly' | 'monthly'
}

export interface PayStub {
  id: string
  employeeId: string
  employeeName: string
  payPeriod: PayPeriod
  
  // Earnings
  regularHours: number
  regularRate: number
  regularPay: number
  overtimeHours: number
  overtimeRate: number
  overtimePay: number
  otherEarnings: number
  grossPay: number
  
  // Deductions
  cpp: number
  cpp2: number  // Enhanced CPP
  ei: number
  federalTax: number
  provincialTax: number
  otherDeductions: number
  totalDeductions: number
  
  // Net
  netPay: number
  
  // YTD
  ytdGross: number
  ytdCpp: number
  ytdEi: number
  ytdFederalTax: number
  ytdProvincialTax: number
  ytdNetPay: number
  
  // Status
  status: 'draft' | 'approved' | 'paid'
  paidAt?: string
  
  createdAt: string
}

export interface PayrollCalculation {
  grossPay: number
  cpp: number
  cpp2: number
  ei: number
  federalTax: number
  provincialTax: number
  totalDeductions: number
  netPay: number
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate CPP contribution for a pay period
 */
export function calculateCPP(
  grossPay: number,
  periodsPerYear: number,
  ytdContribution: number
): { cpp: number; cpp2: number } {
  // Calculate CPP (first tier)
  const periodExemption = CPP_RATES.basicExemption / periodsPerYear
  const pensionableEarnings = Math.max(0, grossPay - periodExemption)
  const maxPeriodEarnings = CPP_RATES.maxPensionableEarnings / periodsPerYear
  const cappedEarnings = Math.min(pensionableEarnings, maxPeriodEarnings)
  
  let cpp = cappedEarnings * CPP_RATES.rate
  
  // Check YTD max
  const remainingCpp = Math.max(0, CPP_RATES.maxContribution - ytdContribution)
  cpp = Math.min(cpp, remainingCpp)
  
  // Calculate CPP2 (enhanced tier) - earnings above YMPE up to YAMPE
  let cpp2 = 0
  const annualizedGross = grossPay * periodsPerYear
  if (annualizedGross > CPP_RATES.maxPensionableEarnings) {
    const cpp2Earnings = Math.min(
      annualizedGross - CPP_RATES.maxPensionableEarnings,
      CPP2_RATES.maxEarnings - CPP_RATES.maxPensionableEarnings
    ) / periodsPerYear
    cpp2 = cpp2Earnings * CPP2_RATES.rate
    cpp2 = Math.min(cpp2, CPP2_RATES.maxContribution / periodsPerYear)
  }
  
  return { cpp: Math.round(cpp * 100) / 100, cpp2: Math.round(cpp2 * 100) / 100 }
}

/**
 * Calculate EI premium for a pay period
 */
export function calculateEI(
  grossPay: number,
  periodsPerYear: number,
  ytdPremium: number
): number {
  const maxPeriodEarnings = EI_RATES.maxInsurableEarnings / periodsPerYear
  const insuredEarnings = Math.min(grossPay, maxPeriodEarnings)
  
  let ei = insuredEarnings * EI_RATES.rate
  
  // Check YTD max
  const remainingEi = Math.max(0, EI_RATES.maxPremium - ytdPremium)
  ei = Math.min(ei, remainingEi)
  
  return Math.round(ei * 100) / 100
}

/**
 * Calculate federal income tax for a pay period
 */
export function calculateFederalTax(
  grossPay: number,
  periodsPerYear: number,
  td1Claim: number
): number {
  const annualizedIncome = grossPay * periodsPerYear
  
  // Calculate tax on annualized income
  let annualTax = 0
  let remainingIncome = annualizedIncome
  
  for (const bracket of FEDERAL_TAX_BRACKETS) {
    if (remainingIncome <= 0) break
    
    const taxableInBracket = Math.min(
      remainingIncome,
      bracket.max - bracket.min
    )
    annualTax += taxableInBracket * bracket.rate
    remainingIncome -= taxableInBracket
  }
  
  // Subtract non-refundable tax credit
  const bpaCredit = Math.min(td1Claim || FEDERAL_BPA, FEDERAL_BPA) * 0.15
  annualTax = Math.max(0, annualTax - bpaCredit)
  
  // Prorate to pay period
  const periodTax = annualTax / periodsPerYear
  
  return Math.round(periodTax * 100) / 100
}

/**
 * Calculate provincial income tax for a pay period
 */
export function calculateProvincialTax(
  grossPay: number,
  province: string,
  periodsPerYear: number,
  td1Claim: number
): number {
  const rates = PROVINCIAL_TAX_RATES[province] || DEFAULT_PROVINCIAL_RATES
  const annualizedIncome = grossPay * periodsPerYear
  
  // Calculate tax on annualized income
  let annualTax = 0
  let remainingIncome = annualizedIncome
  
  for (const bracket of rates.brackets) {
    if (remainingIncome <= 0) break
    
    const taxableInBracket = Math.min(
      remainingIncome,
      bracket.max - bracket.min
    )
    annualTax += taxableInBracket * bracket.rate
    remainingIncome -= taxableInBracket
  }
  
  // Subtract non-refundable tax credit
  const lowestRate = rates.brackets[0].rate
  const bpaCredit = Math.min(td1Claim || rates.bpa, rates.bpa) * lowestRate
  annualTax = Math.max(0, annualTax - bpaCredit)
  
  // Prorate to pay period
  const periodTax = annualTax / periodsPerYear
  
  return Math.round(periodTax * 100) / 100
}

/**
 * Calculate complete payroll for an employee
 */
export function calculatePayroll(
  grossPay: number,
  province: string,
  periodsPerYear: number,
  ytdCpp: number = 0,
  ytdEi: number = 0,
  td1FederalClaim: number = FEDERAL_BPA,
  td1ProvincialClaim?: number
): PayrollCalculation {
  const { cpp, cpp2 } = calculateCPP(grossPay, periodsPerYear, ytdCpp)
  const ei = calculateEI(grossPay, periodsPerYear, ytdEi)
  const federalTax = calculateFederalTax(grossPay, periodsPerYear, td1FederalClaim)
  const provincialTax = calculateProvincialTax(
    grossPay, 
    province, 
    periodsPerYear, 
    td1ProvincialClaim || (PROVINCIAL_TAX_RATES[province]?.bpa || DEFAULT_PROVINCIAL_RATES.bpa)
  )
  
  const totalDeductions = cpp + cpp2 + ei + federalTax + provincialTax
  const netPay = Math.round((grossPay - totalDeductions) * 100) / 100
  
  return {
    grossPay,
    cpp,
    cpp2,
    ei,
    federalTax,
    provincialTax,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netPay,
  }
}

/**
 * Get periods per year based on pay frequency
 */
export function getPeriodsPerYear(type: 'weekly' | 'biweekly' | 'semi-monthly' | 'monthly'): number {
  switch (type) {
    case 'weekly': return 52
    case 'biweekly': return 26
    case 'semi-monthly': return 24
    case 'monthly': return 12
  }
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
    phone: '(416) 555-0101',
    hireDate: '2024-03-15',
    employmentType: 'full-time',
    payType: 'salary',
    payRate: 75000,
    hoursPerWeek: 40,
    province: 'ON',
    td1FederalClaim: FEDERAL_BPA,
    td1ProvincialClaim: PROVINCIAL_TAX_RATES.ON.bpa,
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
    phone: '(416) 555-0102',
    hireDate: '2023-06-01',
    employmentType: 'full-time',
    payType: 'salary',
    payRate: 95000,
    hoursPerWeek: 40,
    province: 'ON',
    td1FederalClaim: FEDERAL_BPA,
    td1ProvincialClaim: PROVINCIAL_TAX_RATES.ON.bpa,
    isActive: true,
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2023-06-01T00:00:00Z',
  },
]

// ============================================================================
// SERVICE
// ============================================================================

export const payrollService = {
  /**
   * Calculate payroll preview for an employee
   */
  calculatePreview(
    grossPay: number,
    province: string,
    payFrequency: 'weekly' | 'biweekly' | 'semi-monthly' | 'monthly',
    ytdCpp: number = 0,
    ytdEi: number = 0
  ): PayrollCalculation {
    const periodsPerYear = getPeriodsPerYear(payFrequency)
    return calculatePayroll(grossPay, province, periodsPerYear, ytdCpp, ytdEi)
  },

  /**
   * Get employees for an organization
   */
  async getEmployees(organizationId: string): Promise<Employee[]> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      return demoEmployees
    }

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

    return data.map(mapEmployeeFromDb)
  },

  // More methods would go here: createPayRun, getPayStubs, generateT4, etc.
}

function mapEmployeeFromDb(row: any): Employee {
  return {
    id: row.id,
    organizationId: row.organization_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    sin: row.sin,
    dateOfBirth: row.date_of_birth,
    hireDate: row.hire_date,
    terminationDate: row.termination_date,
    employmentType: row.employment_type,
    payType: row.pay_type,
    payRate: row.pay_rate,
    hoursPerWeek: row.hours_per_week,
    province: row.province,
    td1FederalClaim: row.td1_federal_claim,
    td1ProvincialClaim: row.td1_provincial_claim,
    bankAccount: row.bank_account,
    bankTransit: row.bank_transit,
    bankInstitution: row.bank_institution,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default payrollService
