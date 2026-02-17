import { createClient } from '@/lib/supabase/client'
import type { 
  ChartOfAccount, 
  JournalEntry,
  CreateAccountInput, 
  CreateJournalEntryInput,
  AccountingSummary,
  AccountType
} from '@/types/accounting'

// =============================================================================
// CHART OF ACCOUNTS
// =============================================================================

export async function getChartOfAccounts(organizationId: string): Promise<ChartOfAccount[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('code')
  
  if (error) throw error
  
  // If no accounts exist, create defaults
  if (!data || data.length === 0) {
    await createDefaultAccounts(organizationId)
    return getChartOfAccounts(organizationId)
  }
  
  return data || []
}

async function createDefaultAccounts(organizationId: string): Promise<void> {
  const supabase = createClient()
  
  const defaultAccounts = [
    // Assets
    { code: '1000', name: 'Cash', account_type: 'asset' as AccountType },
    { code: '1100', name: 'Accounts Receivable', account_type: 'asset' as AccountType },
    { code: '1200', name: 'Inventory', account_type: 'asset' as AccountType },
    { code: '1300', name: 'Prepaid Expenses', account_type: 'asset' as AccountType },
    { code: '1500', name: 'Fixed Assets', account_type: 'asset' as AccountType },
    // Liabilities
    { code: '2000', name: 'Accounts Payable', account_type: 'liability' as AccountType },
    { code: '2100', name: 'Accrued Expenses', account_type: 'liability' as AccountType },
    { code: '2200', name: 'GST/HST Payable', account_type: 'liability' as AccountType },
    { code: '2300', name: 'Payroll Liabilities', account_type: 'liability' as AccountType },
    { code: '2500', name: 'Long-term Debt', account_type: 'liability' as AccountType },
    // Equity
    { code: '3000', name: 'Owner\'s Equity', account_type: 'equity' as AccountType },
    { code: '3100', name: 'Retained Earnings', account_type: 'equity' as AccountType },
    // Revenue
    { code: '4000', name: 'Sales Revenue', account_type: 'revenue' as AccountType },
    { code: '4100', name: 'Service Revenue', account_type: 'revenue' as AccountType },
    { code: '4200', name: 'Interest Income', account_type: 'revenue' as AccountType },
    // Expenses
    { code: '5000', name: 'Cost of Goods Sold', account_type: 'expense' as AccountType },
    { code: '5100', name: 'Wages & Salaries', account_type: 'expense' as AccountType },
    { code: '5200', name: 'Rent Expense', account_type: 'expense' as AccountType },
    { code: '5300', name: 'Utilities Expense', account_type: 'expense' as AccountType },
    { code: '5400', name: 'Office Supplies', account_type: 'expense' as AccountType },
    { code: '5500', name: 'Insurance Expense', account_type: 'expense' as AccountType },
    { code: '5600', name: 'Depreciation Expense', account_type: 'expense' as AccountType },
    { code: '5900', name: 'Other Expenses', account_type: 'expense' as AccountType },
  ]
  
  await supabase
    .from('chart_of_accounts')
    .insert(defaultAccounts.map(a => ({
      organization_id: organizationId,
      ...a,
      is_system: true,
      balance: 0
    })))
}

export async function getAccount(id: string): Promise<ChartOfAccount | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function createAccount(
  organizationId: string,
  input: CreateAccountInput
): Promise<ChartOfAccount> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .insert({
      organization_id: organizationId,
      ...input,
      is_system: false,
      balance: 0
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateAccount(
  id: string,
  input: Partial<CreateAccountInput>
): Promise<ChartOfAccount> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteAccount(id: string): Promise<void> {
  const supabase = createClient()
  
  // Check if system account
  const { data: account } = await supabase
    .from('chart_of_accounts')
    .select('is_system')
    .eq('id', id)
    .single()
  
  if (account?.is_system) {
    throw new Error('Cannot delete system account')
  }
  
  // Soft delete
  const { error } = await supabase
    .from('chart_of_accounts')
    .update({ is_active: false })
    .eq('id', id)
  
  if (error) throw error
}

// =============================================================================
// JOURNAL ENTRIES
// =============================================================================

export async function getJournalEntries(organizationId: string): Promise<JournalEntry[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('organization_id', organizationId)
    .order('entry_date', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getJournalEntry(id: string): Promise<JournalEntry | null> {
  const supabase = createClient()
  
  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .single()
  
  if (entryError) throw entryError
  if (!entry) return null
  
  // Get lines
  const { data: lines, error: linesError } = await supabase
    .from('journal_entry_lines')
    .select(`
      *,
      account:chart_of_accounts!account_id (
        id,
        code,
        name,
        account_type
      )
    `)
    .eq('journal_entry_id', id)
    .order('line_number')
  
  if (linesError) throw linesError
  
  return { ...entry, lines: lines || [] }
}

async function generateEntryNumber(organizationId: string): Promise<string> {
  const supabase = createClient()
  const year = new Date().getFullYear()
  const prefix = `JE-${year}-`
  
  const { data } = await supabase
    .from('journal_entries')
    .select('entry_number')
    .eq('organization_id', organizationId)
    .ilike('entry_number', `${prefix}%`)
    .order('entry_number', { ascending: false })
    .limit(1)
    .single()
  
  if (data?.entry_number) {
    const lastNum = parseInt(data.entry_number.replace(prefix, ''), 10) || 0
    return `${prefix}${String(lastNum + 1).padStart(4, '0')}`
  }
  return `${prefix}0001`
}

export async function createJournalEntry(
  organizationId: string,
  input: CreateJournalEntryInput
): Promise<JournalEntry> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // Validate debits = credits
  const totalDebit = input.lines.reduce((sum, l) => sum + (l.debit_amount || 0), 0)
  const totalCredit = input.lines.reduce((sum, l) => sum + (l.credit_amount || 0), 0)
  
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error('Debits must equal credits')
  }
  
  // Generate entry number
  const entryNumber = await generateEntryNumber(organizationId)
  
  // Create entry
  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      organization_id: organizationId,
      entry_number: entryNumber,
      entry_date: input.entry_date,
      description: input.description,
      reference: input.reference,
      status: 'draft',
      total_debit: totalDebit,
      total_credit: totalCredit,
      created_by: user.id
    })
    .select()
    .single()
  
  if (entryError) throw entryError
  
  // Create lines
  const linesToInsert = input.lines.map((line, index) => ({
    journal_entry_id: entry.id,
    line_number: index + 1,
    account_id: line.account_id,
    description: line.description,
    debit_amount: line.debit_amount || 0,
    credit_amount: line.credit_amount || 0
  }))
  
  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert(linesToInsert)
  
  if (linesError) throw linesError
  
  return getJournalEntry(entry.id) as Promise<JournalEntry>
}

export async function postJournalEntry(id: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // Get entry with lines
  const entry = await getJournalEntry(id)
  if (!entry) throw new Error('Entry not found')
  if (entry.status !== 'draft') throw new Error('Can only post draft entries')
  
  // Update account balances
  for (const line of entry.lines || []) {
    const { data: account } = await supabase
      .from('chart_of_accounts')
      .select('balance, account_type')
      .eq('id', line.account_id)
      .single()
    
    if (account) {
      // Assets & Expenses: Debits increase, Credits decrease
      // Liabilities, Equity, Revenue: Credits increase, Debits decrease
      let balanceChange = 0
      if (['asset', 'expense'].includes(account.account_type)) {
        balanceChange = line.debit_amount - line.credit_amount
      } else {
        balanceChange = line.credit_amount - line.debit_amount
      }
      
      await supabase
        .from('chart_of_accounts')
        .update({ balance: account.balance + balanceChange })
        .eq('id', line.account_id)
    }
  }
  
  // Mark entry as posted
  await supabase
    .from('journal_entries')
    .update({
      status: 'posted',
      posted_at: new Date().toISOString(),
      posted_by: user.id
    })
    .eq('id', id)
}

export async function voidJournalEntry(id: string, reason: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // Get entry
  const entry = await getJournalEntry(id)
  if (!entry) throw new Error('Entry not found')
  if (entry.status === 'void') throw new Error('Entry already voided')
  
  // If posted, reverse account balances
  if (entry.status === 'posted') {
    for (const line of entry.lines || []) {
      const { data: account } = await supabase
        .from('chart_of_accounts')
        .select('balance, account_type')
        .eq('id', line.account_id)
        .single()
      
      if (account) {
        let balanceChange = 0
        if (['asset', 'expense'].includes(account.account_type)) {
          balanceChange = -(line.debit_amount - line.credit_amount)
        } else {
          balanceChange = -(line.credit_amount - line.debit_amount)
        }
        
        await supabase
          .from('chart_of_accounts')
          .update({ balance: account.balance + balanceChange })
          .eq('id', line.account_id)
      }
    }
  }
  
  // Mark as void
  await supabase
    .from('journal_entries')
    .update({
      status: 'void',
      voided_at: new Date().toISOString(),
      voided_by: user.id,
      void_reason: reason
    })
    .eq('id', id)
}

// =============================================================================
// SUMMARY
// =============================================================================

export async function getAccountingSummary(organizationId: string): Promise<AccountingSummary> {
  const supabase = createClient()
  
  const { data: accounts } = await supabase
    .from('chart_of_accounts')
    .select('account_type, balance')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
  
  const list = accounts || []
  
  const totalAssets = list.filter(a => a.account_type === 'asset').reduce((sum, a) => sum + (a.balance || 0), 0)
  const totalLiabilities = list.filter(a => a.account_type === 'liability').reduce((sum, a) => sum + (a.balance || 0), 0)
  const totalEquity = list.filter(a => a.account_type === 'equity').reduce((sum, a) => sum + (a.balance || 0), 0)
  const totalRevenue = list.filter(a => a.account_type === 'revenue').reduce((sum, a) => sum + (a.balance || 0), 0)
  const totalExpenses = list.filter(a => a.account_type === 'expense').reduce((sum, a) => sum + (a.balance || 0), 0)
  
  return {
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    total_equity: totalEquity,
    total_revenue: totalRevenue,
    total_expenses: totalExpenses,
    net_income: totalRevenue - totalExpenses
  }
}
