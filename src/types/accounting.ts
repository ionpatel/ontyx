// Accounting Types

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
export type JournalStatus = 'draft' | 'posted' | 'void'

export interface ChartOfAccount {
  id: string
  organization_id: string
  code: string
  name: string
  description?: string
  account_type: AccountType
  parent_id?: string
  is_system: boolean
  is_active: boolean
  balance: number
  created_at: string
  updated_at: string
  // Computed
  children?: ChartOfAccount[]
}

export interface JournalEntry {
  id: string
  organization_id: string
  entry_number: string
  entry_date: string
  description?: string
  reference?: string
  status: JournalStatus
  total_debit: number
  total_credit: number
  posted_at?: string
  posted_by?: string
  voided_at?: string
  voided_by?: string
  void_reason?: string
  created_by?: string
  created_at: string
  updated_at: string
  // Joined
  lines?: JournalEntryLine[]
}

export interface JournalEntryLine {
  id: string
  journal_entry_id: string
  line_number: number
  account_id: string
  description?: string
  debit_amount: number
  credit_amount: number
  created_at: string
  // Joined
  account?: {
    id: string
    code: string
    name: string
    account_type: AccountType
  }
}

export interface CreateAccountInput {
  code: string
  name: string
  description?: string
  account_type: AccountType
  parent_id?: string
}

export interface CreateJournalEntryInput {
  entry_date: string
  description?: string
  reference?: string
  lines: {
    account_id: string
    description?: string
    debit_amount?: number
    credit_amount?: number
  }[]
}

export interface AccountingSummary {
  total_assets: number
  total_liabilities: number
  total_equity: number
  total_revenue: number
  total_expenses: number
  net_income: number
}
