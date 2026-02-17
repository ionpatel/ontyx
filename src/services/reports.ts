import { createClient } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export interface DateRange {
  startDate: string
  endDate: string
}

export interface ProfitAndLossReport {
  period: DateRange
  revenue: {
    sales: number
    services: number
    otherIncome: number
    total: number
    items: Array<{ category: string; amount: number }>
  }
  expenses: {
    costOfGoodsSold: number
    operatingExpenses: number
    payroll: number
    rent: number
    utilities: number
    marketing: number
    professional: number
    other: number
    total: number
    items: Array<{ category: string; amount: number }>
  }
  grossProfit: number
  netIncome: number
  profitMargin: number
}

export interface BalanceSheetReport {
  asOfDate: string
  assets: {
    currentAssets: {
      cash: number
      accountsReceivable: number
      inventory: number
      prepaidExpenses: number
      total: number
    }
    fixedAssets: {
      equipment: number
      vehicles: number
      furniture: number
      accumulatedDepreciation: number
      total: number
    }
    totalAssets: number
  }
  liabilities: {
    currentLiabilities: {
      accountsPayable: number
      accruedExpenses: number
      taxesPayable: number
      shortTermDebt: number
      total: number
    }
    longTermLiabilities: {
      longTermDebt: number
      total: number
    }
    totalLiabilities: number
  }
  equity: {
    ownerEquity: number
    retainedEarnings: number
    totalEquity: number
  }
}

export interface CashFlowReport {
  period: DateRange
  operating: {
    netIncome: number
    depreciation: number
    accountsReceivableChange: number
    inventoryChange: number
    accountsPayableChange: number
    total: number
  }
  investing: {
    equipmentPurchases: number
    assetSales: number
    total: number
  }
  financing: {
    loanProceeds: number
    loanPayments: number
    ownerDrawings: number
    ownerContributions: number
    total: number
  }
  netCashChange: number
  beginningCash: number
  endingCash: number
}

export interface TaxSummaryReport {
  period: DateRange
  gstHstCollected: number
  gstHstPaid: number
  gstHstOwing: number
  pstCollected: number
  pstPaid: number
  pstOwing: number
  totalTaxCollected: number
  totalTaxPaid: number
  totalTaxOwing: number
  salesByProvince: Array<{
    province: string
    sales: number
    taxCollected: number
  }>
}

export interface AccountsAgingReport {
  asOfDate: string
  receivables: {
    current: number
    days1to30: number
    days31to60: number
    days61to90: number
    over90: number
    total: number
    items: Array<{
      customerId: string
      customerName: string
      invoiceNumber: string
      invoiceDate: string
      dueDate: string
      amount: number
      daysOverdue: number
      bucket: string
    }>
  }
  payables: {
    current: number
    days1to30: number
    days31to60: number
    days61to90: number
    over90: number
    total: number
  }
}

// ============================================================================
// SERVICE
// ============================================================================

export const reportsService = {
  /**
   * Generate Profit & Loss Report
   */
  async getProfitAndLoss(organizationId: string, dateRange: DateRange): Promise<ProfitAndLossReport> {
    const supabase = createClient()
    
    // Get invoices (revenue)
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total, tax_amount, status')
      .eq('organization_id', organizationId)
      .gte('issue_date', dateRange.startDate)
      .lte('issue_date', dateRange.endDate)
      .in('status', ['sent', 'paid', 'partial'])
    
    const totalRevenue = (invoices || []).reduce((sum, inv) => sum + (inv.total || 0), 0)
    
    // Get bank transactions (expenses by category)
    const { data: transactions } = await supabase
      .from('bank_transactions')
      .select('amount, category, transaction_type')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'debit')
      .gte('transaction_date', dateRange.startDate)
      .lte('transaction_date', dateRange.endDate)
    
    // Categorize expenses
    const expenseCategories: Record<string, number> = {}
    let totalExpenses = 0
    
    ;(transactions || []).forEach(tx => {
      const cat = tx.category || 'Other'
      const amount = Math.abs(tx.amount || 0)
      expenseCategories[cat] = (expenseCategories[cat] || 0) + amount
      totalExpenses += amount
    })
    
    // Get payroll expenses
    const { data: payslips } = await supabase
      .from('payslips')
      .select('gross_pay, payroll_run:payroll_runs(pay_date)')
      .eq('organization_id', organizationId)
      .gte('payroll_run.pay_date', dateRange.startDate)
      .lte('payroll_run.pay_date', dateRange.endDate)
    
    const payrollExpense = (payslips || []).reduce((sum, slip) => sum + (slip.gross_pay || 0), 0)
    
    // Build expense items
    const expenseItems = Object.entries(expenseCategories).map(([category, amount]) => ({
      category,
      amount,
    })).sort((a, b) => b.amount - a.amount)
    
    // Add payroll to expenses
    if (payrollExpense > 0) {
      expenseItems.push({ category: 'Payroll', amount: payrollExpense })
      totalExpenses += payrollExpense
    }
    
    const grossProfit = totalRevenue - (expenseCategories['Cost of Goods Sold'] || 0)
    const netIncome = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
    
    return {
      period: dateRange,
      revenue: {
        sales: totalRevenue,
        services: 0,
        otherIncome: 0,
        total: totalRevenue,
        items: [{ category: 'Sales', amount: totalRevenue }],
      },
      expenses: {
        costOfGoodsSold: expenseCategories['Cost of Goods Sold'] || 0,
        operatingExpenses: totalExpenses - payrollExpense - (expenseCategories['Cost of Goods Sold'] || 0),
        payroll: payrollExpense,
        rent: expenseCategories['Rent'] || 0,
        utilities: expenseCategories['Utilities'] || 0,
        marketing: expenseCategories['Advertising'] || expenseCategories['Marketing'] || 0,
        professional: expenseCategories['Professional Services'] || 0,
        other: expenseCategories['Other'] || 0,
        total: totalExpenses,
        items: expenseItems,
      },
      grossProfit,
      netIncome,
      profitMargin,
    }
  },
  
  /**
   * Generate Balance Sheet
   */
  async getBalanceSheet(organizationId: string, asOfDate: string): Promise<BalanceSheetReport> {
    const supabase = createClient()
    
    // Cash = sum of all bank account balances
    const { data: bankAccounts } = await supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
    
    const cash = (bankAccounts || []).reduce((sum, acc) => sum + (acc.current_balance || 0), 0)
    
    // Accounts Receivable = unpaid invoices
    const { data: unpaidInvoices } = await supabase
      .from('invoices')
      .select('amount_due')
      .eq('organization_id', organizationId)
      .in('status', ['sent', 'partial', 'overdue'])
      .lte('issue_date', asOfDate)
    
    const accountsReceivable = (unpaidInvoices || []).reduce((sum, inv) => sum + (inv.amount_due || 0), 0)
    
    // Inventory value
    const { data: inventory } = await supabase
      .from('products')
      .select('cost_price, inventory_levels(quantity_on_hand)')
      .eq('organization_id', organizationId)
    
    const inventoryValue = (inventory || []).reduce((sum, prod) => {
      const qty = prod.inventory_levels?.[0]?.quantity_on_hand || 0
      return sum + (qty * (prod.cost_price || 0))
    }, 0)
    
    // TODO: Get actual fixed assets, liabilities, equity from GL
    // For now, return structure with available data
    
    const totalCurrentAssets = cash + accountsReceivable + inventoryValue
    const totalAssets = totalCurrentAssets
    
    return {
      asOfDate,
      assets: {
        currentAssets: {
          cash,
          accountsReceivable,
          inventory: inventoryValue,
          prepaidExpenses: 0,
          total: totalCurrentAssets,
        },
        fixedAssets: {
          equipment: 0,
          vehicles: 0,
          furniture: 0,
          accumulatedDepreciation: 0,
          total: 0,
        },
        totalAssets,
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable: 0,
          accruedExpenses: 0,
          taxesPayable: 0,
          shortTermDebt: 0,
          total: 0,
        },
        longTermLiabilities: {
          longTermDebt: 0,
          total: 0,
        },
        totalLiabilities: 0,
      },
      equity: {
        ownerEquity: totalAssets, // Simplified: Assets = Equity when no liabilities
        retainedEarnings: 0,
        totalEquity: totalAssets,
      },
    }
  },
  
  /**
   * Generate Tax Summary (GST/HST/PST)
   */
  async getTaxSummary(organizationId: string, dateRange: DateRange): Promise<TaxSummaryReport> {
    const supabase = createClient()
    
    // Get tax collected from invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('tax_amount, total, status')
      .eq('organization_id', organizationId)
      .gte('issue_date', dateRange.startDate)
      .lte('issue_date', dateRange.endDate)
      .in('status', ['sent', 'paid', 'partial'])
    
    const taxCollected = (invoices || []).reduce((sum, inv) => sum + (inv.tax_amount || 0), 0)
    
    // Get tax paid from bank transactions (categorized as "Taxes")
    const { data: taxTransactions } = await supabase
      .from('bank_transactions')
      .select('amount')
      .eq('organization_id', organizationId)
      .eq('category', 'Taxes')
      .eq('transaction_type', 'debit')
      .gte('transaction_date', dateRange.startDate)
      .lte('transaction_date', dateRange.endDate)
    
    const taxPaid = (taxTransactions || []).reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0)
    
    // Simplified: Assume all tax is GST/HST
    return {
      period: dateRange,
      gstHstCollected: taxCollected,
      gstHstPaid: taxPaid,
      gstHstOwing: taxCollected - taxPaid,
      pstCollected: 0,
      pstPaid: 0,
      pstOwing: 0,
      totalTaxCollected: taxCollected,
      totalTaxPaid: taxPaid,
      totalTaxOwing: taxCollected - taxPaid,
      salesByProvince: [],
    }
  },
  
  /**
   * Generate Accounts Aging Report
   */
  async getAccountsAging(organizationId: string, asOfDate: string): Promise<AccountsAgingReport> {
    const supabase = createClient()
    const today = new Date(asOfDate)
    
    // Get unpaid invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select(`
        id, invoice_number, issue_date, due_date, amount_due,
        customer:contacts(id, display_name)
      `)
      .eq('organization_id', organizationId)
      .in('status', ['sent', 'partial', 'overdue'])
      .gt('amount_due', 0)
      .order('due_date')
    
    // Categorize by aging bucket
    const buckets = {
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      over90: 0,
    }
    
    const items: AccountsAgingReport['receivables']['items'] = []
    
    ;(invoices || []).forEach(inv => {
      const dueDate = new Date(inv.due_date)
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      const amount = inv.amount_due || 0
      
      let bucket: string
      if (daysOverdue <= 0) {
        bucket = 'Current'
        buckets.current += amount
      } else if (daysOverdue <= 30) {
        bucket = '1-30 Days'
        buckets.days1to30 += amount
      } else if (daysOverdue <= 60) {
        bucket = '31-60 Days'
        buckets.days31to60 += amount
      } else if (daysOverdue <= 90) {
        bucket = '61-90 Days'
        buckets.days61to90 += amount
      } else {
        bucket = '90+ Days'
        buckets.over90 += amount
      }
      
      items.push({
        customerId: inv.customer?.id || '',
        customerName: inv.customer?.display_name || 'Unknown',
        invoiceNumber: inv.invoice_number,
        invoiceDate: inv.issue_date,
        dueDate: inv.due_date,
        amount,
        daysOverdue: Math.max(0, daysOverdue),
        bucket,
      })
    })
    
    const total = buckets.current + buckets.days1to30 + buckets.days31to60 + buckets.days61to90 + buckets.over90
    
    return {
      asOfDate,
      receivables: {
        ...buckets,
        total,
        items,
      },
      payables: {
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        over90: 0,
        total: 0,
      },
    }
  },
  
  /**
   * Get quick financial summary for dashboard
   */
  async getFinancialSummary(organizationId: string): Promise<{
    totalRevenue: number
    totalExpenses: number
    netIncome: number
    accountsReceivable: number
    cashOnHand: number
  }> {
    const supabase = createClient()
    
    // Current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    
    // Revenue from invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total')
      .eq('organization_id', organizationId)
      .gte('issue_date', startOfMonth)
      .lte('issue_date', endOfMonth)
      .in('status', ['sent', 'paid', 'partial'])
    
    const totalRevenue = (invoices || []).reduce((sum, inv) => sum + (inv.total || 0), 0)
    
    // Expenses from transactions
    const { data: expenses } = await supabase
      .from('bank_transactions')
      .select('amount')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'debit')
      .gte('transaction_date', startOfMonth)
      .lte('transaction_date', endOfMonth)
    
    const totalExpenses = (expenses || []).reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0)
    
    // AR
    const { data: unpaid } = await supabase
      .from('invoices')
      .select('amount_due')
      .eq('organization_id', organizationId)
      .in('status', ['sent', 'partial', 'overdue'])
    
    const accountsReceivable = (unpaid || []).reduce((sum, inv) => sum + (inv.amount_due || 0), 0)
    
    // Cash
    const { data: banks } = await supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
    
    const cashOnHand = (banks || []).reduce((sum, acc) => sum + (acc.current_balance || 0), 0)
    
    return {
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      accountsReceivable,
      cashOnHand,
    }
  },
}

export default reportsService
