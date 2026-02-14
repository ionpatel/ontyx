// Invoice Types
export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "partial" | "overdue" | "cancelled"

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  amount: number
  accountId?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  customerAddress?: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  taxTotal: number
  total: number
  amountPaid: number
  amountDue: number
  currency: string
  notes?: string
  terms?: string
  createdAt: string
  updatedAt: string
  sentAt?: string
  viewedAt?: string
  paidAt?: string
}

export interface InvoicePayment {
  id: string
  invoiceId: string
  amount: number
  date: string
  method: "cash" | "check" | "bank_transfer" | "credit_card" | "other"
  reference?: string
  notes?: string
}

// Bill Types (Accounts Payable)
export type BillStatus = "draft" | "pending" | "approved" | "paid" | "partial" | "overdue" | "cancelled"

export interface BillLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  amount: number
  accountId?: string
}

export interface Bill {
  id: string
  billNumber: string
  vendorId: string
  vendorName: string
  vendorEmail?: string
  reference?: string
  status: BillStatus
  issueDate: string
  dueDate: string
  lineItems: BillLineItem[]
  subtotal: number
  taxTotal: number
  total: number
  amountPaid: number
  amountDue: number
  currency: string
  notes?: string
  createdAt: string
  updatedAt: string
  approvedAt?: string
  approvedBy?: string
}

// Banking Types
export type TransactionType = "income" | "expense" | "transfer"
export type ReconciliationStatus = "unreconciled" | "matched" | "reconciled"

export interface BankAccount {
  id: string
  name: string
  accountNumber: string
  bankName: string
  currency: string
  balance: number
  lastReconciled?: string
  isActive: boolean
  createdAt: string
}

export interface BankTransaction {
  id: string
  accountId: string
  date: string
  description: string
  reference?: string
  type: TransactionType
  amount: number
  balance: number
  reconciliationStatus: ReconciliationStatus
  matchedTransactionId?: string
  category?: string
  notes?: string
  createdAt: string
}

export interface ReconciliationRule {
  id: string
  name: string
  conditions: {
    field: "description" | "amount" | "reference"
    operator: "contains" | "equals" | "starts_with" | "ends_with" | "greater_than" | "less_than"
    value: string
  }[]
  action: {
    category: string
    accountId?: string
    markReconciled: boolean
  }
  isActive: boolean
}

// Accounting Types
export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense"

export interface ChartOfAccount {
  id: string
  code: string
  name: string
  type: AccountType
  parentId?: string
  description?: string
  isActive: boolean
  balance: number
  currency: string
}

export interface JournalEntry {
  id: string
  entryNumber: string
  date: string
  description: string
  reference?: string
  lines: JournalLine[]
  totalDebit: number
  totalCredit: number
  isPosted: boolean
  createdAt: string
  createdBy: string
}

export interface JournalLine {
  id: string
  accountId: string
  accountCode: string
  accountName: string
  description?: string
  debit: number
  credit: number
}

// Report Types
export interface ProfitLossReport {
  period: { start: string; end: string }
  revenue: { name: string; amount: number }[]
  totalRevenue: number
  expenses: { name: string; amount: number }[]
  totalExpenses: number
  netProfit: number
  grossProfit?: number
  operatingProfit?: number
}

export interface BalanceSheetReport {
  asOfDate: string
  assets: {
    current: { name: string; amount: number }[]
    nonCurrent: { name: string; amount: number }[]
    totalAssets: number
  }
  liabilities: {
    current: { name: string; amount: number }[]
    nonCurrent: { name: string; amount: number }[]
    totalLiabilities: number
  }
  equity: { name: string; amount: number }[]
  totalEquity: number
  totalLiabilitiesAndEquity: number
}

export interface CashFlowReport {
  period: { start: string; end: string }
  operatingActivities: { name: string; amount: number }[]
  investingActivities: { name: string; amount: number }[]
  financingActivities: { name: string; amount: number }[]
  netCashFlow: number
  openingBalance: number
  closingBalance: number
}

export interface AgedReport {
  asOfDate: string
  items: {
    id: string
    name: string
    current: number
    days30: number
    days60: number
    days90: number
    over90: number
    total: number
  }[]
  totals: {
    current: number
    days30: number
    days60: number
    days90: number
    over90: number
    total: number
  }
}

// Contact Types
export interface Contact {
  id: string
  type: "customer" | "vendor" | "both"
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  taxId?: string
  notes?: string
  balance: number
  isActive: boolean
  createdAt: string
}
