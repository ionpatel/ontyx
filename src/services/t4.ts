import { createClient } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export interface T4Slip {
  id: string
  organizationId: string
  taxYear: number
  employeeId: string
  employeeName: string
  employeeSin: string
  employeeAddress: string
  
  // Box amounts
  box14Employment: number      // Employment income
  box16Cpp: number            // CPP contributions
  box17Cpp2: number           // CPP2 contributions  
  box18Ei: number             // EI premiums
  box22IncomeTax: number      // Income tax deducted
  box24EiInsurable: number    // EI insurable earnings
  box26CppPensionable: number // CPP pensionable earnings
  
  // Additional boxes
  box40RppContributions?: number  // RPP contributions
  box42RppPastService?: number
  box44UnionDues?: number
  box46CharitableDonations?: number
  box52PensionAdjustment?: number
  
  // Province of employment
  provinceCode: string
  
  // Status
  status: 'draft' | 'reviewed' | 'filed'
  
  // Flags
  exemptCpp: boolean
  exemptEi: boolean
  exemptPpip: boolean
  
  createdAt: string
  updatedAt: string
}

// ============================================================================
// SERVICE
// ============================================================================

export const t4Service = {
  async getT4s(organizationId: string, taxYear?: number): Promise<T4Slip[]> {
    const supabase = createClient()

    let query = supabase
      .from('t4_slips')
      .select('*')
      .eq('organization_id', organizationId)
      .order('employee_name', { ascending: true })

    if (taxYear) {
      query = query.eq('tax_year', taxYear)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching T4s:', error)
      return []
    }

    return (data || []).map(mapT4FromDb)
  },

  async generateT4sFromPayRuns(organizationId: string, taxYear: number): Promise<T4Slip[]> {
    const supabase = createClient()

    // Get all completed pay runs for the year
    const { data: payRuns, error: payRunError } = await supabase
      .from('pay_runs')
      .select(`
        *,
        employees:pay_run_employees(*)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .gte('pay_date', `${taxYear}-01-01`)
      .lte('pay_date', `${taxYear}-12-31`)

    if (payRunError) {
      console.error('Error fetching pay runs for T4:', payRunError)
      return []
    }

    // Aggregate by employee
    const employeeMap = new Map<string, {
      employeeId: string
      employeeName: string
      totalGross: number
      totalCpp: number
      totalEi: number
      totalTax: number
    }>()

    for (const payRun of payRuns || []) {
      for (const emp of payRun.employees || []) {
        const existing = employeeMap.get(emp.employee_id) || {
          employeeId: emp.employee_id,
          employeeName: emp.employee_name,
          totalGross: 0,
          totalCpp: 0,
          totalEi: 0,
          totalTax: 0,
        }
        
        existing.totalGross += emp.gross_pay || 0
        existing.totalCpp += emp.cpp || 0
        existing.totalEi += emp.ei || 0
        existing.totalTax += (emp.federal_tax || 0) + (emp.provincial_tax || 0)
        
        employeeMap.set(emp.employee_id, existing)
      }
    }

    // Create T4 slips
    const t4Slips: T4Slip[] = []

    for (const [employeeId, data] of employeeMap) {
      const t4: T4Slip = {
        id: `t4-${taxYear}-${employeeId}`,
        organizationId,
        taxYear,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        employeeSin: '***-***-***',
        employeeAddress: '',
        box14Employment: data.totalGross,
        box16Cpp: data.totalCpp,
        box17Cpp2: 0,
        box18Ei: data.totalEi,
        box22IncomeTax: data.totalTax,
        box24EiInsurable: data.totalGross,
        box26CppPensionable: data.totalGross,
        provinceCode: 'ON',
        status: 'draft',
        exemptCpp: false,
        exemptEi: false,
        exemptPpip: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      t4Slips.push(t4)
    }

    return t4Slips
  },

  async updateT4Status(id: string, status: T4Slip['status'], organizationId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('t4_slips')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error updating T4 status:', error)
      return false
    }
    return true
  },

  async deleteT4(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
      .from('t4_slips')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('status', 'draft')

    if (error) {
      console.error('Error deleting T4:', error)
      return false
    }
    return true
  },

  async getT4Stats(organizationId: string, taxYear: number): Promise<{
    total: number
    draft: number
    reviewed: number
    filed: number
    totalEmploymentIncome: number
    totalTaxDeducted: number
  }> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('t4_slips')
      .select('status, box14_employment, box22_income_tax')
      .eq('organization_id', organizationId)
      .eq('tax_year', taxYear)

    if (error) {
      console.error('Error fetching T4 stats:', error)
      return { total: 0, draft: 0, reviewed: 0, filed: 0, totalEmploymentIncome: 0, totalTaxDeducted: 0 }
    }

    const slips = data || []
    return {
      total: slips.length,
      draft: slips.filter(s => s.status === 'draft').length,
      reviewed: slips.filter(s => s.status === 'reviewed').length,
      filed: slips.filter(s => s.status === 'filed').length,
      totalEmploymentIncome: slips.reduce((sum, s) => sum + (s.box14_employment || 0), 0),
      totalTaxDeducted: slips.reduce((sum, s) => sum + (s.box22_income_tax || 0), 0),
    }
  },
}

// ============================================================================
// MAPPER
// ============================================================================

function mapT4FromDb(row: any): T4Slip {
  return {
    id: row.id,
    organizationId: row.organization_id,
    taxYear: row.tax_year,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    employeeSin: row.employee_sin,
    employeeAddress: row.employee_address,
    box14Employment: row.box14_employment,
    box16Cpp: row.box16_cpp,
    box17Cpp2: row.box17_cpp2 || 0,
    box18Ei: row.box18_ei,
    box22IncomeTax: row.box22_income_tax,
    box24EiInsurable: row.box24_ei_insurable,
    box26CppPensionable: row.box26_cpp_pensionable,
    box40RppContributions: row.box40_rpp,
    box42RppPastService: row.box42_rpp_past,
    box44UnionDues: row.box44_union,
    box46CharitableDonations: row.box46_charity,
    box52PensionAdjustment: row.box52_pa,
    provinceCode: row.province_code,
    status: row.status,
    exemptCpp: row.exempt_cpp || false,
    exemptEi: row.exempt_ei || false,
    exemptPpip: row.exempt_ppip || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default t4Service
