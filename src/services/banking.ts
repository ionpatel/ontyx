import { createClient } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export type BankAccountType = 'checking' | 'savings' | 'credit_card' | 'line_of_credit' | 'investment'
export type TransactionType = 'debit' | 'credit'
export type ReconciliationStatus = 'unreconciled' | 'matched' | 'reconciled'

export interface BankAccount {
  id: string
  organizationId: string
  name: string
  accountType: BankAccountType
  accountNumber: string // Last 4 digits
  routingNumber?: string
  bankName: string
  currency: string
  currentBalance: number
  availableBalance: number
  isPrimary: boolean
  isActive: boolean
  lastSyncAt?: string
  plaidAccountId?: string
  plaidItemId?: string
  createdAt: string
  updatedAt: string
}

export interface BankTransaction {
  id: string
  organizationId: string
  bankAccountId: string
  transactionDate: string
  postedDate?: string
  description: string
  amount: number
  transactionType: TransactionType
  runningBalance?: number
  category?: string
  isReconciled: boolean
  reconciledAt?: string
  matchedEntityType?: string
  matchedEntityId?: string
  isManual: boolean
  externalId?: string
  checkNumber?: string
  createdAt: string
}

export interface CreateBankAccountInput {
  name: string
  accountType: BankAccountType
  accountNumber: string
  bankName: string
  currency?: string
  currentBalance?: number
  isPrimary?: boolean
}

export interface CreateTransactionInput {
  bankAccountId: string
  transactionDate: string
  description: string
  amount: number
  transactionType: TransactionType
  category?: string
  checkNumber?: string
}

export interface BankingSummary {
  totalBalance: number
  accountCount: number
  unreconciledCount: number
  monthlyInflow: number
  monthlyOutflow: number
}

// ============================================================================
// SERVICE
// ============================================================================

export const bankingService = {
  // -------------------------------------------------------------------------
  // BANK ACCOUNTS
  // -------------------------------------------------------------------------
  
  async getAccounts(organizationId: string): Promise<BankAccount[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('name')
    
    if (error) {
      console.error('Error fetching bank accounts:', error)
      return []
    }
    
    return (data || []).map(mapAccountFromDb)
  },
  
  async getAccount(id: string, organizationId: string): Promise<BankAccount | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()
    
    if (error) {
      console.error('Error fetching bank account:', error)
      return null
    }
    
    return mapAccountFromDb(data)
  },
  
  async createAccount(input: CreateBankAccountInput, organizationId: string): Promise<BankAccount | null> {
    const supabase = createClient()
    
    // If setting as primary, unset other primary accounts
    if (input.isPrimary) {
      await supabase
        .from('bank_accounts')
        .update({ is_primary: false })
        .eq('organization_id', organizationId)
    }
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        organization_id: organizationId,
        name: input.name,
        account_type: input.accountType,
        account_number: input.accountNumber,
        bank_name: input.bankName,
        currency: input.currency || 'CAD',
        current_balance: input.currentBalance || 0,
        available_balance: input.currentBalance || 0,
        is_primary: input.isPrimary || false,
        is_active: true,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating bank account:', error)
      return null
    }
    
    return mapAccountFromDb(data)
  },
  
  async updateAccount(id: string, input: Partial<CreateBankAccountInput>, organizationId: string): Promise<BankAccount | null> {
    const supabase = createClient()
    
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    
    if (input.name) updates.name = input.name
    if (input.accountType) updates.account_type = input.accountType
    if (input.accountNumber) updates.account_number = input.accountNumber
    if (input.bankName) updates.bank_name = input.bankName
    if (input.currency) updates.currency = input.currency
    if (input.currentBalance !== undefined) {
      updates.current_balance = input.currentBalance
      updates.available_balance = input.currentBalance
    }
    if (input.isPrimary !== undefined) {
      // Unset other primary accounts if setting this as primary
      if (input.isPrimary) {
        await supabase
          .from('bank_accounts')
          .update({ is_primary: false })
          .eq('organization_id', organizationId)
      }
      updates.is_primary = input.isPrimary
    }
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating bank account:', error)
      return null
    }
    
    return mapAccountFromDb(data)
  },
  
  async deleteAccount(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    // Soft delete - set is_active to false
    const { error } = await supabase
      .from('bank_accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error deleting bank account:', error)
      return false
    }
    
    return true
  },
  
  async updateBalance(id: string, balance: number, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('bank_accounts')
      .update({ 
        current_balance: balance,
        available_balance: balance,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error updating balance:', error)
      return false
    }
    
    return true
  },
  
  // -------------------------------------------------------------------------
  // TRANSACTIONS
  // -------------------------------------------------------------------------
  
  async getTransactions(
    organizationId: string, 
    filters?: {
      accountId?: string
      startDate?: string
      endDate?: string
      isReconciled?: boolean
      category?: string
    }
  ): Promise<BankTransaction[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('bank_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (filters?.accountId) {
      query = query.eq('bank_account_id', filters.accountId)
    }
    if (filters?.startDate) {
      query = query.gte('transaction_date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('transaction_date', filters.endDate)
    }
    if (filters?.isReconciled !== undefined) {
      query = query.eq('is_reconciled', filters.isReconciled)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    
    const { data, error } = await query.limit(500)
    
    if (error) {
      console.error('Error fetching transactions:', error)
      return []
    }
    
    return (data || []).map(mapTransactionFromDb)
  },
  
  async createTransaction(input: CreateTransactionInput, organizationId: string): Promise<BankTransaction | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('bank_transactions')
      .insert({
        organization_id: organizationId,
        bank_account_id: input.bankAccountId,
        transaction_date: input.transactionDate,
        description: input.description,
        amount: input.amount,
        transaction_type: input.transactionType,
        category: input.category,
        check_number: input.checkNumber,
        is_manual: true,
        is_reconciled: false,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating transaction:', error)
      return null
    }
    
    // Update account balance
    const balanceChange = input.transactionType === 'credit' ? input.amount : -input.amount
    await this.adjustAccountBalance(input.bankAccountId, balanceChange, organizationId)
    
    return mapTransactionFromDb(data)
  },
  
  async adjustAccountBalance(accountId: string, change: number, organizationId: string): Promise<void> {
    const supabase = createClient()
    
    // Get current balance
    const { data: account } = await supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('id', accountId)
      .eq('organization_id', organizationId)
      .single()
    
    if (account) {
      const newBalance = (account.current_balance || 0) + change
      await supabase
        .from('bank_accounts')
        .update({ 
          current_balance: newBalance,
          available_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId)
    }
  },
  
  async reconcileTransaction(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('bank_transactions')
      .update({ 
        is_reconciled: true,
        reconciled_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error reconciling transaction:', error)
      return false
    }
    
    return true
  },
  
  async matchTransaction(
    transactionId: string, 
    entityType: string, 
    entityId: string, 
    organizationId: string
  ): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('bank_transactions')
      .update({ 
        matched_entity_type: entityType,
        matched_entity_id: entityId,
        is_reconciled: true,
        reconciled_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error matching transaction:', error)
      return false
    }
    
    return true
  },
  
  async categorizeTransaction(id: string, category: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('bank_transactions')
      .update({ category })
      .eq('id', id)
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error categorizing transaction:', error)
      return false
    }
    
    return true
  },
  
  async deleteTransaction(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    // Get transaction to adjust balance
    const { data: transaction } = await supabase
      .from('bank_transactions')
      .select('bank_account_id, amount, transaction_type')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()
    
    if (!transaction) return false
    
    const { error } = await supabase
      .from('bank_transactions')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error deleting transaction:', error)
      return false
    }
    
    // Reverse the balance change
    const balanceChange = transaction.transaction_type === 'credit' 
      ? -transaction.amount 
      : transaction.amount
    await this.adjustAccountBalance(transaction.bank_account_id, balanceChange, organizationId)
    
    return true
  },
  
  // -------------------------------------------------------------------------
  // SUMMARY & ANALYTICS
  // -------------------------------------------------------------------------
  
  async getSummary(organizationId: string): Promise<BankingSummary> {
    const supabase = createClient()
    
    // Get all active accounts
    const { data: accounts } = await supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
    
    const totalBalance = (accounts || []).reduce((sum, a) => sum + (a.current_balance || 0), 0)
    const accountCount = accounts?.length || 0
    
    // Get unreconciled count
    const { count: unreconciledCount } = await supabase
      .from('bank_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_reconciled', false)
    
    // Get this month's transactions
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const { data: monthTransactions } = await supabase
      .from('bank_transactions')
      .select('amount, transaction_type')
      .eq('organization_id', organizationId)
      .gte('transaction_date', startOfMonth.toISOString().split('T')[0])
    
    let monthlyInflow = 0
    let monthlyOutflow = 0
    
    ;(monthTransactions || []).forEach(t => {
      if (t.transaction_type === 'credit') {
        monthlyInflow += t.amount
      } else {
        monthlyOutflow += Math.abs(t.amount)
      }
    })
    
    return {
      totalBalance,
      accountCount,
      unreconciledCount: unreconciledCount || 0,
      monthlyInflow,
      monthlyOutflow,
    }
  },
  
  async getCategories(organizationId: string): Promise<string[]> {
    const supabase = createClient()
    
    const { data } = await supabase
      .from('bank_transactions')
      .select('category')
      .eq('organization_id', organizationId)
      .not('category', 'is', null)
    
    const categories = new Set<string>()
    ;(data || []).forEach(t => {
      if (t.category) categories.add(t.category)
    })
    
    // Add default categories
    const defaults = [
      'Sales', 'Services', 'Refunds',
      'Rent', 'Utilities', 'Payroll', 'Supplies', 'Insurance',
      'Advertising', 'Travel', 'Meals', 'Professional Services',
      'Bank Fees', 'Interest', 'Taxes', 'Other'
    ]
    defaults.forEach(c => categories.add(c))
    
    return Array.from(categories).sort()
  },
}

// ============================================================================
// MAPPERS
// ============================================================================

function mapAccountFromDb(row: any): BankAccount {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    accountType: row.account_type,
    accountNumber: row.account_number || '****',
    routingNumber: row.routing_number,
    bankName: row.bank_name || 'Unknown Bank',
    currency: row.currency || 'CAD',
    currentBalance: row.current_balance || 0,
    availableBalance: row.available_balance || 0,
    isPrimary: row.is_primary || false,
    isActive: row.is_active,
    lastSyncAt: row.last_sync_at,
    plaidAccountId: row.plaid_account_id,
    plaidItemId: row.plaid_item_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapTransactionFromDb(row: any): BankTransaction {
  return {
    id: row.id,
    organizationId: row.organization_id,
    bankAccountId: row.bank_account_id,
    transactionDate: row.transaction_date,
    postedDate: row.posted_date,
    description: row.description,
    amount: row.amount,
    transactionType: row.transaction_type,
    runningBalance: row.running_balance,
    category: row.category,
    isReconciled: row.is_reconciled || false,
    reconciledAt: row.reconciled_at,
    matchedEntityType: row.matched_entity_type,
    matchedEntityId: row.matched_entity_id,
    isManual: row.is_manual || false,
    externalId: row.external_id,
    checkNumber: row.check_number,
    createdAt: row.created_at,
  }
}

export default bankingService
