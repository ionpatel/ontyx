// ============================================================
// Banking Service — Accounts, Transactions, Reconciliation
// ============================================================

import { supabase, getAll, getById, create, update, remove, type QueryOptions } from './base'
import type { BankAccount, BankTransaction } from '@/types/finance'

export const bankingService = {
  // Bank Accounts
  async listAccounts(options: QueryOptions = {}) {
    return getAll<BankAccount>('bank_accounts', {
      ...options,
      searchFields: ['name', 'bank_name'],
      orderBy: 'name',
      orderDir: 'asc',
    })
  },

  async getAccount(id: string) {
    return getById<BankAccount>('bank_accounts', id)
  },

  async createAccount(account: Partial<BankAccount>) {
    return create<BankAccount>('bank_accounts', account)
  },

  async updateAccount(id: string, updates: Partial<BankAccount>) {
    return update<BankAccount>('bank_accounts', id, updates)
  },

  async deleteAccount(id: string) {
    return remove('bank_accounts', id)
  },

  // Transactions
  async listTransactions(accountId: string, options: QueryOptions = {}) {
    return getAll<BankTransaction>('bank_transactions', {
      ...options,
      filters: { ...options.filters, bank_account_id: accountId },
      searchFields: ['description', 'reference'],
      orderBy: 'date',
      orderDir: 'desc',
    })
  },

  async getTransaction(id: string) {
    return getById<BankTransaction>('bank_transactions', id)
  },

  async createTransaction(txn: Partial<BankTransaction>) {
    return create<BankTransaction>('bank_transactions', txn)
  },

  async reconcileTransaction(id: string, matchedInvoiceId?: string, matchedBillId?: string) {
    return update('bank_transactions', id, {
      reconciliation_status: 'reconciled',
      matched_invoice_id: matchedInvoiceId,
      matched_bill_id: matchedBillId,
    } as any)
  },

  async unmatchTransaction(id: string) {
    return update('bank_transactions', id, {
      reconciliation_status: 'unreconciled',
      matched_invoice_id: null,
      matched_bill_id: null,
    } as any)
  },

  // Summary
  async getSummary() {
    const { data: accounts } = await supabase
      .from('bank_accounts')
      .select('balance')
      .eq('is_active', true)

    const { count: unreconciledCount } = await supabase
      .from('bank_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('reconciliation_status', 'unreconciled')

    const totalBalance = (accounts || []).reduce((s, a: any) => s + (a.balance || 0), 0)

    return {
      totalBalance,
      unreconciledCount: unreconciledCount || 0,
      accountCount: accounts?.length || 0,
    }
  },

  // Reconciliation Rules
  async listRules() {
    return getAll('reconciliation_rules', { orderBy: 'name', orderDir: 'asc' })
  },

  async createRule(rule: any) {
    return create('reconciliation_rules', rule)
  },

  async updateRule(id: string, updates: any) {
    return update('reconciliation_rules', id, updates)
  },

  async deleteRule(id: string) {
    return remove('reconciliation_rules', id)
  },
}
