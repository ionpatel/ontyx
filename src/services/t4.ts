/**
 * T4 Tax Slip Service
 * 
 * Generates T4 Statement of Remuneration Paid for Canadian employees
 * Aggregates payroll data for the tax year
 */

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { payRunsService, type PayRun, type PayRunEmployee } from './pay-runs'

// ============================================================================
// TYPES
// ============================================================================

export interface T4Data {
  id: string
  taxYear: number
  employeeId: string
  
  // Employee Info (Boxes 12-13)
  employeeName: string
  employeeSin: string  // Social Insurance Number (masked for display)
  employeeAddress: string
  employeeCity: string
  employeeProvince: string
  employeePostalCode: string
  
  // Employer Info
  employerName: string
  employerBn: string  // Business Number
  employerAddress: string
  
  // Income & Deductions
  employmentIncome: number      // Box 14 - Total employment income
  incomeTaxDeducted: number     // Box 22 - Total income tax deducted
  cppContributions: number      // Box 16 - Employee CPP contributions
  cpp2Contributions: number     // Box 16A - CPP2 contributions (if applicable)
  eiPremiums: number            // Box 18 - Employee EI premiums
  rppContributions: number      // Box 20 - RPP contributions (pension)
  pensionAdjustment: number     // Box 52 - Pension adjustment
  
  // Other boxes (optional)
  unionDues: number             // Box 44
  charitableDonations: number   // Box 46
  
  // Employment details
  employmentCode?: string       // Box 29 - Employment code
  exemptCpp: boolean            // Box 28 - Exempt from CPP
  exemptEi: boolean             // Box 28 - Exempt from EI
  exemptPpip: boolean           // Box 28 - Exempt from PPIP (Quebec)
  
  // Province of employment
  provinceOfEmployment: string  // Box 10
  
  // Status
  status: 'draft' | 'reviewed' | 'filed'
  generatedAt: string
  filedAt?: string
}

export interface T4Summary {
  taxYear: number
  totalSlips: number
  totalEmploymentIncome: number
  totalIncomeTax: number
  totalCpp: number
  totalEi: number
  status: 'pending' | 'generated' | 'filed'
}

// ============================================================================
// DEMO DATA
// ============================================================================

const DEMO_T4_STORAGE_KEY = 'ontyx_demo_t4s'

function getDemoT4Store(): T4Data[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(DEMO_T4_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Error reading demo T4s from localStorage:', e)
    }
  }
  return []
}

function saveDemoT4Store(t4s: T4Data[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DEMO_T4_STORAGE_KEY, JSON.stringify(t4s))
    } catch (e) {
      console.error('Error saving demo T4s to localStorage:', e)
    }
  }
}

// ============================================================================
// SERVICE
// ============================================================================

export const t4Service = {
  /**
   * Get all T4s for a tax year
   */
  async getT4s(organizationId: string, taxYear: number): Promise<T4Data[]> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      return getDemoT4Store().filter(t => t.taxYear === taxYear)
    }

    const { data, error } = await supabase
      .from('t4_slips')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('tax_year', taxYear)
      .order('employee_name', { ascending: true })

    if (error) {
      console.error('Error fetching T4s:', error)
      return []
    }

    return data.map(mapT4FromDb)
  },

  /**
   * Get T4 summary for a tax year
   */
  async getT4Summary(organizationId: string, taxYear: number): Promise<T4Summary> {
    const t4s = await this.getT4s(organizationId, taxYear)
    
    return {
      taxYear,
      totalSlips: t4s.length,
      totalEmploymentIncome: t4s.reduce((sum, t) => sum + t.employmentIncome, 0),
      totalIncomeTax: t4s.reduce((sum, t) => sum + t.incomeTaxDeducted, 0),
      totalCpp: t4s.reduce((sum, t) => sum + t.cppContributions + t.cpp2Contributions, 0),
      totalEi: t4s.reduce((sum, t) => sum + t.eiPremiums, 0),
      status: t4s.length === 0 ? 'pending' : t4s.every(t => t.status === 'filed') ? 'filed' : 'generated',
    }
  },

  /**
   * Generate T4s from pay run data for a tax year
   * Aggregates all completed pay runs and creates T4 for each employee
   */
  async generateT4s(
    organizationId: string, 
    taxYear: number,
    employerInfo: {
      name: string
      bn: string
      address: string
    }
  ): Promise<T4Data[]> {
    const supabase = createClient()
    
    // Get all completed pay runs for the year
    const payRuns = await payRunsService.getPayRuns(organizationId)
    const yearPayRuns = payRuns.filter(pr => {
      const payDate = new Date(pr.payDate)
      return payDate.getFullYear() === taxYear && pr.status === 'completed'
    })

    // Aggregate by employee
    const employeeAggregates: Record<string, {
      employeeId: string
      employeeName: string
      employeeEmail?: string
      totalGross: number
      totalCpp: number
      totalCpp2: number
      totalEi: number
      totalFederalTax: number
      totalProvincialTax: number
    }> = {}

    // For demo mode, we need to get employee data from pay runs
    for (const payRun of yearPayRuns) {
      const { employees } = await payRunsService.getPayRun(payRun.id, organizationId) || { employees: [] }
      
      for (const emp of employees) {
        if (!employeeAggregates[emp.employeeId]) {
          employeeAggregates[emp.employeeId] = {
            employeeId: emp.employeeId,
            employeeName: emp.employeeName,
            employeeEmail: emp.employeeEmail,
            totalGross: 0,
            totalCpp: 0,
            totalCpp2: 0,
            totalEi: 0,
            totalFederalTax: 0,
            totalProvincialTax: 0,
          }
        }
        
        const agg = employeeAggregates[emp.employeeId]
        agg.totalGross += emp.grossPay
        agg.totalCpp += emp.cpp
        agg.totalCpp2 += emp.cpp2
        agg.totalEi += emp.ei
        agg.totalFederalTax += emp.federalTax
        agg.totalProvincialTax += emp.provincialTax
      }
    }

    // Create T4 for each employee
    const t4s: T4Data[] = Object.values(employeeAggregates).map(agg => ({
      id: `t4-${taxYear}-${agg.employeeId}`,
      taxYear,
      employeeId: agg.employeeId,
      
      // Employee info (would come from employee record in real system)
      employeeName: agg.employeeName,
      employeeSin: '***-***-***',  // Masked for demo
      employeeAddress: '',
      employeeCity: 'Toronto',
      employeeProvince: 'ON',
      employeePostalCode: '',
      
      // Employer info
      employerName: employerInfo.name,
      employerBn: employerInfo.bn,
      employerAddress: employerInfo.address,
      
      // Income & deductions
      employmentIncome: Math.round(agg.totalGross * 100) / 100,
      incomeTaxDeducted: Math.round((agg.totalFederalTax + agg.totalProvincialTax) * 100) / 100,
      cppContributions: Math.round(agg.totalCpp * 100) / 100,
      cpp2Contributions: Math.round(agg.totalCpp2 * 100) / 100,
      eiPremiums: Math.round(agg.totalEi * 100) / 100,
      rppContributions: 0,
      pensionAdjustment: 0,
      unionDues: 0,
      charitableDonations: 0,
      
      exemptCpp: false,
      exemptEi: false,
      exemptPpip: false,
      provinceOfEmployment: 'ON',
      
      status: 'draft' as const,
      generatedAt: new Date().toISOString(),
    }))

    // Save T4s
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      // Remove existing T4s for this year and save new ones
      const store = getDemoT4Store().filter(t => t.taxYear !== taxYear)
      store.push(...t4s)
      saveDemoT4Store(store)
      return t4s
    }

    // Database insert would go here
    return t4s
  },

  /**
   * Update T4 status
   */
  async updateT4Status(
    id: string, 
    status: 'draft' | 'reviewed' | 'filed',
    organizationId: string
  ): Promise<boolean> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      const store = getDemoT4Store()
      const idx = store.findIndex(t => t.id === id)
      if (idx === -1) return false
      store[idx].status = status
      if (status === 'filed') {
        store[idx].filedAt = new Date().toISOString()
      }
      saveDemoT4Store(store)
      return true
    }

    const { error } = await supabase
      .from('t4_slips')
      .update({ 
        status, 
        filed_at: status === 'filed' ? new Date().toISOString() : null 
      })
      .eq('id', id)

    return !error
  },

  /**
   * Delete all T4s for a tax year (regenerate)
   */
  async deleteT4s(organizationId: string, taxYear: number): Promise<boolean> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || organizationId === 'demo') {
      const store = getDemoT4Store().filter(t => t.taxYear !== taxYear)
      saveDemoT4Store(store)
      return true
    }

    const { error } = await supabase
      .from('t4_slips')
      .delete()
      .eq('organization_id', organizationId)
      .eq('tax_year', taxYear)

    return !error
  },
}

// ============================================================================
// DB MAPPING
// ============================================================================

function mapT4FromDb(row: any): T4Data {
  return {
    id: row.id,
    taxYear: row.tax_year,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    employeeSin: row.employee_sin,
    employeeAddress: row.employee_address,
    employeeCity: row.employee_city,
    employeeProvince: row.employee_province,
    employeePostalCode: row.employee_postal_code,
    employerName: row.employer_name,
    employerBn: row.employer_bn,
    employerAddress: row.employer_address,
    employmentIncome: row.employment_income,
    incomeTaxDeducted: row.income_tax_deducted,
    cppContributions: row.cpp_contributions,
    cpp2Contributions: row.cpp2_contributions || 0,
    eiPremiums: row.ei_premiums,
    rppContributions: row.rpp_contributions || 0,
    pensionAdjustment: row.pension_adjustment || 0,
    unionDues: row.union_dues || 0,
    charitableDonations: row.charitable_donations || 0,
    employmentCode: row.employment_code,
    exemptCpp: row.exempt_cpp || false,
    exemptEi: row.exempt_ei || false,
    exemptPpip: row.exempt_ppip || false,
    provinceOfEmployment: row.province_of_employment,
    status: row.status,
    generatedAt: row.generated_at,
    filedAt: row.filed_at,
  }
}

export default t4Service
