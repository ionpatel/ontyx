import { 
  Invoice, Bill, BankAccount, BankTransaction, 
  ChartOfAccount, JournalEntry, Contact 
} from "@/types/finance"

// Activity Feed Types (for dashboard)
export interface ActivityItem {
  id: string
  type: "invoice" | "payment" | "order" | "customer" | "product" | "expense"
  action?: string
  title: string
  description?: string
  amount?: number
  timestamp: string
  status?: "success" | "pending" | "failed"
  user?: string
}

export const recentActivity: ActivityItem[] = [
  {
    id: "a1",
    type: "payment",
    action: "received",
    title: "Payment Received",
    description: "Payment from Acme Corporation",
    amount: 7920,
    timestamp: "2024-02-14T10:00:00Z",
    status: "success",
  },
  {
    id: "a2",
    type: "invoice",
    action: "created",
    title: "Invoice Created",
    description: "Invoice INV-2024-005 for TechStart Inc",
    amount: 2750,
    timestamp: "2024-02-14T09:00:00Z",
    status: "pending",
  },
  {
    id: "a3",
    type: "expense",
    action: "paid",
    title: "Bill Paid",
    description: "Paid Office Supplies Co",
    amount: 3850,
    timestamp: "2024-02-13T14:00:00Z",
    status: "success",
  },
  {
    id: "a4",
    type: "customer",
    action: "added",
    title: "New Customer",
    description: "Global Services Ltd signed up",
    timestamp: "2024-02-12T11:00:00Z",
    status: "success",
  },
  {
    id: "a5",
    type: "order",
    action: "created",
    title: "New Order",
    description: "Order #1234 from TechStart Inc",
    amount: 5500,
    timestamp: "2024-02-12T09:30:00Z",
    status: "pending",
  },
  {
    id: "a6",
    type: "product",
    action: "updated",
    title: "Product Updated",
    description: "Enterprise Suite price changed",
    timestamp: "2024-02-11T15:00:00Z",
  },
]

// Mock Contacts
export const mockContacts: Contact[] = [
  {
    id: "c1",
    type: "customer",
    name: "Acme Corporation",
    email: "billing@acme.com",
    phone: "+1 555-0100",
    address: "123 Business Ave",
    city: "New York",
    country: "USA",
    balance: 12500,
    isActive: true,
    createdAt: "2024-01-15",
  },
  {
    id: "c2",
    type: "customer",
    name: "TechStart Inc",
    email: "accounts@techstart.io",
    phone: "+1 555-0200",
    address: "456 Innovation Blvd",
    city: "San Francisco",
    country: "USA",
    balance: 8750,
    isActive: true,
    createdAt: "2024-02-01",
  },
  {
    id: "c3",
    type: "vendor",
    name: "Office Supplies Co",
    email: "orders@officesupplies.com",
    phone: "+1 555-0300",
    balance: -2500,
    isActive: true,
    createdAt: "2024-01-20",
  },
  {
    id: "c4",
    type: "both",
    name: "Global Services Ltd",
    email: "finance@globalservices.com",
    phone: "+1 555-0400",
    balance: 5000,
    isActive: true,
    createdAt: "2024-02-10",
  },
]

// Mock Invoices
export const mockInvoices: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2024-001",
    customerId: "c1",
    customerName: "Acme Corporation",
    customerEmail: "billing@acme.com",
    customerAddress: "123 Business Ave, New York, USA",
    status: "paid",
    issueDate: "2024-01-15",
    dueDate: "2024-02-14",
    lineItems: [
      { id: "l1", description: "Web Development Services", quantity: 40, unitPrice: 150, taxRate: 10, amount: 6600 },
      { id: "l2", description: "Server Hosting (Annual)", quantity: 1, unitPrice: 1200, taxRate: 10, amount: 1320 },
    ],
    subtotal: 7200,
    taxTotal: 720,
    total: 7920,
    amountPaid: 7920,
    amountDue: 0,
    currency: "USD",
    notes: "Thank you for your business!",
    terms: "Net 30",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-02-10T14:30:00Z",
    sentAt: "2024-01-15T10:05:00Z",
    viewedAt: "2024-01-15T14:20:00Z",
    paidAt: "2024-02-10T14:30:00Z",
  },
  {
    id: "inv-002",
    invoiceNumber: "INV-2024-002",
    customerId: "c2",
    customerName: "TechStart Inc",
    customerEmail: "accounts@techstart.io",
    customerAddress: "456 Innovation Blvd, San Francisco, USA",
    status: "sent",
    issueDate: "2024-02-01",
    dueDate: "2024-03-02",
    lineItems: [
      { id: "l3", description: "Mobile App Development", quantity: 80, unitPrice: 175, taxRate: 10, amount: 15400 },
      { id: "l4", description: "UI/UX Design", quantity: 20, unitPrice: 125, taxRate: 10, amount: 2750 },
    ],
    subtotal: 16500,
    taxTotal: 1650,
    total: 18150,
    amountPaid: 0,
    amountDue: 18150,
    currency: "USD",
    terms: "Net 30",
    createdAt: "2024-02-01T09:00:00Z",
    updatedAt: "2024-02-01T09:15:00Z",
    sentAt: "2024-02-01T09:15:00Z",
  },
  {
    id: "inv-003",
    invoiceNumber: "INV-2024-003",
    customerId: "c1",
    customerName: "Acme Corporation",
    customerEmail: "billing@acme.com",
    status: "overdue",
    issueDate: "2024-01-01",
    dueDate: "2024-01-31",
    lineItems: [
      { id: "l5", description: "Consulting Services", quantity: 16, unitPrice: 200, taxRate: 10, amount: 3520 },
    ],
    subtotal: 3200,
    taxTotal: 320,
    total: 3520,
    amountPaid: 0,
    amountDue: 3520,
    currency: "USD",
    createdAt: "2024-01-01T08:00:00Z",
    updatedAt: "2024-01-01T08:00:00Z",
    sentAt: "2024-01-01T08:05:00Z",
  },
  {
    id: "inv-004",
    invoiceNumber: "INV-2024-004",
    customerId: "c4",
    customerName: "Global Services Ltd",
    customerEmail: "finance@globalservices.com",
    status: "partial",
    issueDate: "2024-02-05",
    dueDate: "2024-03-06",
    lineItems: [
      { id: "l6", description: "API Integration", quantity: 30, unitPrice: 150, taxRate: 10, amount: 4950 },
      { id: "l7", description: "Documentation", quantity: 8, unitPrice: 100, taxRate: 10, amount: 880 },
    ],
    subtotal: 5300,
    taxTotal: 530,
    total: 5830,
    amountPaid: 3000,
    amountDue: 2830,
    currency: "USD",
    createdAt: "2024-02-05T11:00:00Z",
    updatedAt: "2024-02-12T16:00:00Z",
  },
  {
    id: "inv-005",
    invoiceNumber: "INV-2024-005",
    customerId: "c2",
    customerName: "TechStart Inc",
    customerEmail: "accounts@techstart.io",
    status: "draft",
    issueDate: "2024-02-14",
    dueDate: "2024-03-15",
    lineItems: [
      { id: "l8", description: "Monthly Maintenance", quantity: 1, unitPrice: 2500, taxRate: 10, amount: 2750 },
    ],
    subtotal: 2500,
    taxTotal: 250,
    total: 2750,
    amountPaid: 0,
    amountDue: 2750,
    currency: "USD",
    createdAt: "2024-02-14T09:00:00Z",
    updatedAt: "2024-02-14T09:00:00Z",
  },
]

// Mock Bills
export const mockBills: Bill[] = [
  {
    id: "bill-001",
    billNumber: "BILL-001",
    vendorId: "c3",
    vendorName: "Office Supplies Co",
    vendorEmail: "orders@officesupplies.com",
    reference: "PO-2024-001",
    status: "paid",
    issueDate: "2024-01-20",
    dueDate: "2024-02-19",
    lineItems: [
      { id: "bl1", description: "Office Chairs (x10)", quantity: 10, unitPrice: 150, taxRate: 10, amount: 1650 },
      { id: "bl2", description: "Standing Desks (x5)", quantity: 5, unitPrice: 400, taxRate: 10, amount: 2200 },
    ],
    subtotal: 3500,
    taxTotal: 350,
    total: 3850,
    amountPaid: 3850,
    amountDue: 0,
    currency: "USD",
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-02-15T11:00:00Z",
  },
  {
    id: "bill-002",
    billNumber: "BILL-002",
    vendorId: "c3",
    vendorName: "Office Supplies Co",
    reference: "PO-2024-005",
    status: "pending",
    issueDate: "2024-02-10",
    dueDate: "2024-03-11",
    lineItems: [
      { id: "bl3", description: "Printer Paper (cases)", quantity: 20, unitPrice: 45, taxRate: 10, amount: 990 },
      { id: "bl4", description: "Ink Cartridges", quantity: 10, unitPrice: 85, taxRate: 10, amount: 935 },
    ],
    subtotal: 1750,
    taxTotal: 175,
    total: 1925,
    amountPaid: 0,
    amountDue: 1925,
    currency: "USD",
    createdAt: "2024-02-10T14:00:00Z",
    updatedAt: "2024-02-10T14:00:00Z",
  },
  {
    id: "bill-003",
    billNumber: "BILL-003",
    vendorId: "c4",
    vendorName: "Global Services Ltd",
    status: "approved",
    issueDate: "2024-02-12",
    dueDate: "2024-03-13",
    lineItems: [
      { id: "bl5", description: "Cloud Services (Monthly)", quantity: 1, unitPrice: 5000, taxRate: 10, amount: 5500 },
    ],
    subtotal: 5000,
    taxTotal: 500,
    total: 5500,
    amountPaid: 0,
    amountDue: 5500,
    currency: "USD",
    createdAt: "2024-02-12T09:00:00Z",
    updatedAt: "2024-02-13T10:00:00Z",
    approvedAt: "2024-02-13T10:00:00Z",
    approvedBy: "John Smith",
  },
]

// Mock Bank Accounts
export const mockBankAccounts: BankAccount[] = [
  {
    id: "ba-001",
    name: "Operating Account",
    accountNumber: "****4521",
    bankName: "First National Bank",
    currency: "USD",
    balance: 125750.50,
    lastReconciled: "2024-02-01",
    isActive: true,
    createdAt: "2023-01-01",
  },
  {
    id: "ba-002",
    name: "Savings Account",
    accountNumber: "****8934",
    bankName: "First National Bank",
    currency: "USD",
    balance: 50000.00,
    lastReconciled: "2024-01-15",
    isActive: true,
    createdAt: "2023-01-01",
  },
  {
    id: "ba-003",
    name: "Payroll Account",
    accountNumber: "****2156",
    bankName: "Business Bank",
    currency: "USD",
    balance: 35420.00,
    lastReconciled: "2024-02-10",
    isActive: true,
    createdAt: "2023-06-01",
  },
]

// Mock Bank Transactions
export const mockBankTransactions: BankTransaction[] = [
  {
    id: "bt-001",
    accountId: "ba-001",
    date: "2024-02-14",
    description: "Payment from Acme Corporation",
    reference: "INV-2024-001",
    type: "income",
    amount: 7920,
    balance: 125750.50,
    reconciliationStatus: "reconciled",
    matchedTransactionId: "inv-001",
    category: "Sales",
    createdAt: "2024-02-14T10:00:00Z",
  },
  {
    id: "bt-002",
    accountId: "ba-001",
    date: "2024-02-13",
    description: "Office Supplies Co - Payment",
    reference: "BILL-001",
    type: "expense",
    amount: -3850,
    balance: 117830.50,
    reconciliationStatus: "reconciled",
    matchedTransactionId: "bill-001",
    category: "Office Expenses",
    createdAt: "2024-02-13T14:00:00Z",
  },
  {
    id: "bt-003",
    accountId: "ba-001",
    date: "2024-02-12",
    description: "Stripe Deposit",
    type: "income",
    amount: 3500,
    balance: 121680.50,
    reconciliationStatus: "matched",
    category: "Online Sales",
    createdAt: "2024-02-12T09:00:00Z",
  },
  {
    id: "bt-004",
    accountId: "ba-001",
    date: "2024-02-11",
    description: "AWS Monthly Bill",
    type: "expense",
    amount: -1250,
    balance: 118180.50,
    reconciliationStatus: "unreconciled",
    category: "Software & Services",
    createdAt: "2024-02-11T03:00:00Z",
  },
  {
    id: "bt-005",
    accountId: "ba-001",
    date: "2024-02-10",
    description: "Unknown Deposit",
    type: "income",
    amount: 500,
    balance: 119430.50,
    reconciliationStatus: "unreconciled",
    createdAt: "2024-02-10T15:00:00Z",
  },
]

// Mock Chart of Accounts
export const mockChartOfAccounts: ChartOfAccount[] = [
  // Assets
  { id: "acc-100", code: "1000", name: "Cash and Cash Equivalents", type: "asset", balance: 211170.50, currency: "USD", isActive: true },
  { id: "acc-101", code: "1100", name: "Accounts Receivable", type: "asset", balance: 24650, currency: "USD", isActive: true },
  { id: "acc-102", code: "1200", name: "Inventory", type: "asset", balance: 15000, currency: "USD", isActive: true },
  { id: "acc-103", code: "1300", name: "Prepaid Expenses", type: "asset", balance: 5000, currency: "USD", isActive: true },
  { id: "acc-104", code: "1500", name: "Fixed Assets", type: "asset", balance: 75000, currency: "USD", isActive: true },
  { id: "acc-105", code: "1510", name: "Accumulated Depreciation", type: "asset", balance: -15000, currency: "USD", isActive: true },
  // Liabilities
  { id: "acc-200", code: "2000", name: "Accounts Payable", type: "liability", balance: 9275, currency: "USD", isActive: true },
  { id: "acc-201", code: "2100", name: "Accrued Expenses", type: "liability", balance: 3500, currency: "USD", isActive: true },
  { id: "acc-202", code: "2200", name: "Sales Tax Payable", type: "liability", balance: 2650, currency: "USD", isActive: true },
  { id: "acc-203", code: "2500", name: "Long-term Debt", type: "liability", balance: 50000, currency: "USD", isActive: true },
  // Equity
  { id: "acc-300", code: "3000", name: "Owner's Equity", type: "equity", balance: 150000, currency: "USD", isActive: true },
  { id: "acc-301", code: "3100", name: "Retained Earnings", type: "equity", balance: 75000, currency: "USD", isActive: true },
  // Revenue
  { id: "acc-400", code: "4000", name: "Sales Revenue", type: "revenue", balance: 125000, currency: "USD", isActive: true },
  { id: "acc-401", code: "4100", name: "Service Revenue", type: "revenue", balance: 85000, currency: "USD", isActive: true },
  { id: "acc-402", code: "4200", name: "Other Income", type: "revenue", balance: 5000, currency: "USD", isActive: true },
  // Expenses
  { id: "acc-500", code: "5000", name: "Cost of Goods Sold", type: "expense", balance: 45000, currency: "USD", isActive: true },
  { id: "acc-501", code: "6000", name: "Salaries & Wages", type: "expense", balance: 65000, currency: "USD", isActive: true },
  { id: "acc-502", code: "6100", name: "Rent Expense", type: "expense", balance: 24000, currency: "USD", isActive: true },
  { id: "acc-503", code: "6200", name: "Utilities", type: "expense", balance: 4500, currency: "USD", isActive: true },
  { id: "acc-504", code: "6300", name: "Office Supplies", type: "expense", balance: 3850, currency: "USD", isActive: true },
  { id: "acc-505", code: "6400", name: "Software & Services", type: "expense", balance: 12000, currency: "USD", isActive: true },
  { id: "acc-506", code: "6500", name: "Marketing & Advertising", type: "expense", balance: 8000, currency: "USD", isActive: true },
  { id: "acc-507", code: "6600", name: "Professional Fees", type: "expense", balance: 5000, currency: "USD", isActive: true },
  { id: "acc-508", code: "6700", name: "Depreciation Expense", type: "expense", balance: 5000, currency: "USD", isActive: true },
]

// Mock Journal Entries
export const mockJournalEntries: JournalEntry[] = [
  {
    id: "je-001",
    entryNumber: "JE-2024-001",
    date: "2024-02-14",
    description: "Record payment from Acme Corporation for INV-2024-001",
    reference: "INV-2024-001",
    lines: [
      { id: "jl-001", accountId: "acc-100", accountCode: "1000", accountName: "Cash and Cash Equivalents", debit: 7920, credit: 0 },
      { id: "jl-002", accountId: "acc-101", accountCode: "1100", accountName: "Accounts Receivable", debit: 0, credit: 7920 },
    ],
    totalDebit: 7920,
    totalCredit: 7920,
    isPosted: true,
    createdAt: "2024-02-14T10:00:00Z",
    createdBy: "System",
  },
  {
    id: "je-002",
    entryNumber: "JE-2024-002",
    date: "2024-02-13",
    description: "Pay Office Supplies Co for BILL-001",
    reference: "BILL-001",
    lines: [
      { id: "jl-003", accountId: "acc-200", accountCode: "2000", accountName: "Accounts Payable", debit: 3850, credit: 0 },
      { id: "jl-004", accountId: "acc-100", accountCode: "1000", accountName: "Cash and Cash Equivalents", debit: 0, credit: 3850 },
    ],
    totalDebit: 3850,
    totalCredit: 3850,
    isPosted: true,
    createdAt: "2024-02-13T14:00:00Z",
    createdBy: "System",
  },
  {
    id: "je-003",
    entryNumber: "JE-2024-003",
    date: "2024-02-01",
    description: "Record February rent expense",
    reference: "RENT-FEB",
    lines: [
      { id: "jl-005", accountId: "acc-502", accountCode: "6100", accountName: "Rent Expense", debit: 2000, credit: 0 },
      { id: "jl-006", accountId: "acc-100", accountCode: "1000", accountName: "Cash and Cash Equivalents", debit: 0, credit: 2000 },
    ],
    totalDebit: 2000,
    totalCredit: 2000,
    isPosted: true,
    createdAt: "2024-02-01T09:00:00Z",
    createdBy: "John Smith",
  },
]

// Summary Stats
export function getInvoiceSummary() {
  const total = mockInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const paid = mockInvoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + inv.total, 0)
  const overdue = mockInvoices.filter(inv => inv.status === "overdue").reduce((sum, inv) => sum + inv.amountDue, 0)
  const outstanding = mockInvoices.reduce((sum, inv) => sum + inv.amountDue, 0)
  
  return { total, paid, overdue, outstanding, count: mockInvoices.length }
}

export function getBillSummary() {
  const total = mockBills.reduce((sum, bill) => sum + bill.total, 0)
  const paid = mockBills.filter(bill => bill.status === "paid").reduce((sum, bill) => sum + bill.total, 0)
  const pending = mockBills.filter(bill => ["pending", "approved"].includes(bill.status)).reduce((sum, bill) => sum + bill.amountDue, 0)
  
  return { total, paid, pending, count: mockBills.length }
}

export function getBankingSummary() {
  const totalBalance = mockBankAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  const unreconciledCount = mockBankTransactions.filter(t => t.reconciliationStatus === "unreconciled").length
  
  return { totalBalance, unreconciledCount, accountCount: mockBankAccounts.length }
}


// Cash flow data
export type CashFlowData = {
  date: string
  inflow: number
  outflow: number
  balance: number
}

export function generateCashFlowData(months: number = 6): CashFlowData[] {
  const data: CashFlowData[] = []
  let balance = 50000
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const inflow = Math.floor(Math.random() * 30000) + 40000
    const outflow = Math.floor(Math.random() * 20000) + 30000
    balance = balance + inflow - outflow
    data.push({
      date: date.toISOString().split('T')[0],
      inflow,
      outflow,
      balance,
    })
  }
  return data
}

// Expense categories
export interface ExpenseCategory {
  name: string
  amount: number
  percentage: number
  color?: string
}

export const expenseCategories: ExpenseCategory[] = [
  { name: "Payroll", amount: 125000, percentage: 42, color: "hsl(var(--chart-1))" },
  { name: "Operations", amount: 45000, percentage: 15, color: "hsl(var(--chart-2))" },
  { name: "Marketing", amount: 38000, percentage: 13, color: "hsl(var(--chart-3))" },
  { name: "Technology", amount: 32000, percentage: 11, color: "hsl(var(--chart-4))" },
  { name: "Rent & Utilities", amount: 28000, percentage: 9, color: "hsl(var(--chart-5))" },
  { name: "Other", amount: 30000, percentage: 10 },
]

// KPI Summary
export const kpiSummary = {
  totalRevenue: 487500,
  revenueChange: 12.5,
  totalExpenses: 298000,
  expensesChange: 8.2,
  netProfit: 189500,
  profitChange: 18.3,
  outstandingInvoices: 65250,
  invoicesChange: -5.4,
  cashBalance: 156800,
  cashChange: 4.2,
  customersCount: 248,
  customersChange: 15,
  ordersCount: 156,
  ordersChange: 22,
  averageOrderValue: 3125,
  aovChange: 8.5,
}

// Revenue by category
export const revenueByCategory = [
  { name: "Software", value: 245000 },
  { name: "Services", value: 128000 },
  { name: "Support", value: 68000 },
  { name: "Training", value: 46500 },
]

// Revenue data
export interface RevenueDataPoint extends Record<string, unknown> {
  month: string
  year: number
  revenue: number
  expenses: number
  profit?: number
}

export function generateRevenueData(months: number = 12): RevenueDataPoint[] {
  const data: RevenueDataPoint[] = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const revenue = Math.floor(Math.random() * 50000) + 80000
    const expenses = Math.floor(Math.random() * 30000) + 40000
    data.push({
      month: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      revenue,
      expenses,
      profit: revenue - expenses,
    })
  }
  return data
}

export const mockRevenueByMonth = generateRevenueData(12)

// Outstanding invoices
export const outstandingInvoices = mockInvoices?.filter(inv => 
  ["sent", "overdue"].includes(inv.status)
) || []

// Top customers
export interface CustomerData extends Record<string, unknown> {
  id: string
  name: string
  revenue: number
  totalRevenue: number
  invoices: number
  invoiceCount: number
  lastOrder: string
  change: number
}

export const topCustomers: CustomerData[] = [
  { id: "c1", name: "Enterprise Solutions", revenue: 45000, totalRevenue: 45000, invoices: 12, invoiceCount: 12, lastOrder: "2024-02-10", change: 25 },
  { id: "c2", name: "Acme Corporation", revenue: 38000, totalRevenue: 38000, invoices: 24, invoiceCount: 24, lastOrder: "2024-02-14", change: 15 },
  { id: "c3", name: "TechStart Inc", revenue: 28000, totalRevenue: 28000, invoices: 18, invoiceCount: 18, lastOrder: "2024-02-12", change: 8 },
  { id: "c4", name: "Global Trade Co", revenue: 22000, totalRevenue: 22000, invoices: 15, invoiceCount: 15, lastOrder: "2024-02-08", change: -5 },
  { id: "c5", name: "Local Shop", revenue: 15000, totalRevenue: 15000, invoices: 32, invoiceCount: 32, lastOrder: "2024-02-13", change: 12 },
]

// Top products
export interface ProductData extends Record<string, unknown> {
  id: string
  name: string
  sku: string
  revenue: number
  units: number
  unitsSold: number
  stock: number
  change: number
  category: string
}

export const topProducts: ProductData[] = [
  { id: "p1", name: "Enterprise Suite", sku: "ENT-001", revenue: 245000, units: 67, unitsSold: 67, stock: 45, change: 25, category: "Software" },
  { id: "p2", name: "Pro Tools", sku: "PRO-001", revenue: 128000, units: 234, unitsSold: 234, stock: 89, change: 12, category: "Software" },
  { id: "p3", name: "Basic Package", sku: "PKG-001", revenue: 68000, units: 189, unitsSold: 189, stock: 156, change: 8, category: "Services" },
  { id: "p4", name: "Starter Kit", sku: "STR-001", revenue: 46500, units: 145, unitsSold: 145, stock: 234, change: -5, category: "Hardware" },
]

// ============================================
// MANUFACTURING MODULE DATA
// ============================================

import {
  BillOfMaterials, WorkOrder, WorkCenter, QualityCheck,
  Project, Task, Milestone, TimeEntry,
  CompanyProfile, UserPreferences, SystemSettings
} from "@/types/manufacturing"

// Work Centers
export const mockWorkCenters: WorkCenter[] = [
  { id: "wc-001", code: "ASM-01", name: "Assembly Line 1", description: "Primary assembly line for enterprise products", capacityPerHour: 50, costPerHour: 125, isActive: true, currentUtilization: 78 },
  { id: "wc-002", code: "ASM-02", name: "Assembly Line 2", description: "Secondary assembly line", capacityPerHour: 40, costPerHour: 100, isActive: true, currentUtilization: 65 },
  { id: "wc-003", code: "QC-01", name: "Quality Control Station", description: "Quality inspection and testing", capacityPerHour: 100, costPerHour: 85, isActive: true, currentUtilization: 82 },
  { id: "wc-004", code: "PKG-01", name: "Packaging Station", description: "Final packaging and labeling", capacityPerHour: 75, costPerHour: 60, isActive: true, currentUtilization: 55 },
  { id: "wc-005", code: "CNC-01", name: "CNC Machining", description: "Precision CNC machining center", capacityPerHour: 20, costPerHour: 200, isActive: true, currentUtilization: 90 },
]

// Bills of Materials
export const mockBOMs: BillOfMaterials[] = [
  {
    id: "bom-001",
    bomNumber: "BOM-2024-001",
    productId: "p1",
    productName: "Enterprise Suite Hardware",
    productSku: "ENT-HW-001",
    version: "1.0",
    status: "active",
    items: [
      { id: "bi-001", itemCode: "PCB-001", name: "Main Circuit Board", quantity: 1, unit: "pcs", unitCost: 150, totalCost: 150, leadTimeDays: 14, supplierId: "c3", supplierName: "Tech Components Ltd" },
      { id: "bi-002", itemCode: "CPU-001", name: "Processor Unit", quantity: 1, unit: "pcs", unitCost: 280, totalCost: 280, leadTimeDays: 7, supplierId: "c3", supplierName: "Tech Components Ltd" },
      { id: "bi-003", itemCode: "MEM-001", name: "Memory Module 16GB", quantity: 2, unit: "pcs", unitCost: 45, totalCost: 90, leadTimeDays: 5, supplierId: "c3", supplierName: "Tech Components Ltd" },
      { id: "bi-004", itemCode: "PSU-001", name: "Power Supply Unit", quantity: 1, unit: "pcs", unitCost: 85, totalCost: 85, leadTimeDays: 10, supplierId: "c4", supplierName: "PowerTech Inc" },
      { id: "bi-005", itemCode: "CHS-001", name: "Metal Chassis", quantity: 1, unit: "pcs", unitCost: 65, totalCost: 65, leadTimeDays: 21, supplierId: "c4", supplierName: "PowerTech Inc" },
      { id: "bi-006", itemCode: "CBL-001", name: "Internal Cables Set", quantity: 1, unit: "set", unitCost: 25, totalCost: 25, leadTimeDays: 3, supplierId: "c3", supplierName: "Tech Components Ltd" },
    ],
    totalCost: 695,
    laborCost: 120,
    overheadCost: 85,
    totalProductionCost: 900,
    notes: "Standard BOM for enterprise hardware unit",
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-02-01T14:30:00Z",
    createdBy: "John Smith",
  },
  {
    id: "bom-002",
    bomNumber: "BOM-2024-002",
    productId: "p2",
    productName: "Pro Tools Device",
    productSku: "PRO-DEV-001",
    version: "2.1",
    status: "active",
    items: [
      { id: "bi-007", itemCode: "PCB-002", name: "Compact Circuit Board", quantity: 1, unit: "pcs", unitCost: 95, totalCost: 95, leadTimeDays: 10, supplierId: "c3", supplierName: "Tech Components Ltd" },
      { id: "bi-008", itemCode: "SEN-001", name: "Sensor Array", quantity: 4, unit: "pcs", unitCost: 35, totalCost: 140, leadTimeDays: 7, supplierId: "c3", supplierName: "Tech Components Ltd" },
      { id: "bi-009", itemCode: "DSP-001", name: "Display Module", quantity: 1, unit: "pcs", unitCost: 75, totalCost: 75, leadTimeDays: 14, supplierId: "c4", supplierName: "PowerTech Inc" },
      { id: "bi-010", itemCode: "BAT-001", name: "Battery Pack", quantity: 1, unit: "pcs", unitCost: 55, totalCost: 55, leadTimeDays: 5, supplierId: "c4", supplierName: "PowerTech Inc" },
    ],
    totalCost: 365,
    laborCost: 80,
    overheadCost: 55,
    totalProductionCost: 500,
    notes: "Updated BOM with new sensor array",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-02-10T11:00:00Z",
    createdBy: "Jane Doe",
  },
  {
    id: "bom-003",
    bomNumber: "BOM-2024-003",
    productId: "p4",
    productName: "Starter Kit",
    productSku: "STR-KIT-001",
    version: "1.0",
    status: "draft",
    items: [
      { id: "bi-011", itemCode: "KIT-BOX", name: "Starter Kit Box", quantity: 1, unit: "pcs", unitCost: 15, totalCost: 15, leadTimeDays: 3 },
      { id: "bi-012", itemCode: "MAN-001", name: "User Manual", quantity: 1, unit: "pcs", unitCost: 5, totalCost: 5, leadTimeDays: 2 },
      { id: "bi-013", itemCode: "ACC-SET", name: "Accessory Set", quantity: 1, unit: "set", unitCost: 25, totalCost: 25, leadTimeDays: 5 },
    ],
    totalCost: 45,
    laborCost: 15,
    overheadCost: 10,
    totalProductionCost: 70,
    createdAt: "2024-02-12T09:00:00Z",
    updatedAt: "2024-02-12T09:00:00Z",
    createdBy: "John Smith",
  },
]

// Work Orders
export const mockWorkOrders: WorkOrder[] = [
  {
    id: "wo-001",
    orderNumber: "WO-2024-001",
    bomId: "bom-001",
    productId: "p1",
    productName: "Enterprise Suite Hardware",
    quantity: 50,
    quantityCompleted: 35,
    status: "in_progress",
    priority: "high",
    plannedStartDate: "2024-02-01",
    plannedEndDate: "2024-02-28",
    actualStartDate: "2024-02-01",
    operations: [
      { id: "op-001", sequence: 1, name: "Component Assembly", workCenterId: "wc-001", workCenterName: "Assembly Line 1", plannedHours: 40, actualHours: 28, status: "completed", startedAt: "2024-02-01T08:00:00Z", completedAt: "2024-02-08T17:00:00Z", assignedTo: "Team A" },
      { id: "op-002", sequence: 2, name: "System Integration", workCenterId: "wc-001", workCenterName: "Assembly Line 1", plannedHours: 30, actualHours: 18, status: "in_progress", startedAt: "2024-02-09T08:00:00Z", assignedTo: "Team A" },
      { id: "op-003", sequence: 3, name: "Quality Testing", workCenterId: "wc-003", workCenterName: "Quality Control Station", plannedHours: 15, status: "pending", assignedTo: "QC Team" },
      { id: "op-004", sequence: 4, name: "Final Packaging", workCenterId: "wc-004", workCenterName: "Packaging Station", plannedHours: 10, status: "pending", assignedTo: "Packaging Team" },
    ],
    estimatedCost: 45000,
    actualCost: 32500,
    assignedTo: "Production Manager",
    notes: "Rush order for Q1 delivery",
    createdAt: "2024-01-28T10:00:00Z",
    updatedAt: "2024-02-14T09:00:00Z",
  },
  {
    id: "wo-002",
    orderNumber: "WO-2024-002",
    bomId: "bom-002",
    productId: "p2",
    productName: "Pro Tools Device",
    quantity: 100,
    quantityCompleted: 0,
    status: "planned",
    priority: "medium",
    plannedStartDate: "2024-02-20",
    plannedEndDate: "2024-03-15",
    operations: [
      { id: "op-005", sequence: 1, name: "Board Assembly", workCenterId: "wc-002", workCenterName: "Assembly Line 2", plannedHours: 50, status: "pending", assignedTo: "Team B" },
      { id: "op-006", sequence: 2, name: "Sensor Calibration", workCenterId: "wc-003", workCenterName: "Quality Control Station", plannedHours: 25, status: "pending", assignedTo: "QC Team" },
      { id: "op-007", sequence: 3, name: "Packaging", workCenterId: "wc-004", workCenterName: "Packaging Station", plannedHours: 15, status: "pending", assignedTo: "Packaging Team" },
    ],
    estimatedCost: 50000,
    assignedTo: "Jane Doe",
    createdAt: "2024-02-10T11:00:00Z",
    updatedAt: "2024-02-10T11:00:00Z",
  },
  {
    id: "wo-003",
    orderNumber: "WO-2024-003",
    bomId: "bom-001",
    productId: "p1",
    productName: "Enterprise Suite Hardware",
    quantity: 25,
    quantityCompleted: 25,
    status: "completed",
    priority: "urgent",
    plannedStartDate: "2024-01-15",
    plannedEndDate: "2024-01-31",
    actualStartDate: "2024-01-15",
    actualEndDate: "2024-01-29",
    operations: [
      { id: "op-008", sequence: 1, name: "Component Assembly", workCenterId: "wc-001", workCenterName: "Assembly Line 1", plannedHours: 20, actualHours: 18, status: "completed", startedAt: "2024-01-15T08:00:00Z", completedAt: "2024-01-20T17:00:00Z" },
      { id: "op-009", sequence: 2, name: "System Integration", workCenterId: "wc-001", workCenterName: "Assembly Line 1", plannedHours: 15, actualHours: 14, status: "completed", startedAt: "2024-01-21T08:00:00Z", completedAt: "2024-01-25T17:00:00Z" },
      { id: "op-010", sequence: 3, name: "Quality Testing", workCenterId: "wc-003", workCenterName: "Quality Control Station", plannedHours: 8, actualHours: 7, status: "completed", startedAt: "2024-01-26T08:00:00Z", completedAt: "2024-01-28T12:00:00Z" },
      { id: "op-011", sequence: 4, name: "Final Packaging", workCenterId: "wc-004", workCenterName: "Packaging Station", plannedHours: 5, actualHours: 5, status: "completed", startedAt: "2024-01-28T13:00:00Z", completedAt: "2024-01-29T15:00:00Z" },
    ],
    estimatedCost: 22500,
    actualCost: 21800,
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-29T15:00:00Z",
  },
  {
    id: "wo-004",
    orderNumber: "WO-2024-004",
    bomId: "bom-002",
    productId: "p2",
    productName: "Pro Tools Device",
    quantity: 50,
    quantityCompleted: 0,
    status: "on_hold",
    priority: "low",
    plannedStartDate: "2024-03-01",
    plannedEndDate: "2024-03-20",
    operations: [
      { id: "op-012", sequence: 1, name: "Board Assembly", workCenterId: "wc-002", workCenterName: "Assembly Line 2", plannedHours: 25, status: "pending" },
      { id: "op-013", sequence: 2, name: "Testing", workCenterId: "wc-003", workCenterName: "Quality Control Station", plannedHours: 12, status: "pending" },
    ],
    estimatedCost: 25000,
    notes: "On hold - waiting for sensor components",
    createdAt: "2024-02-12T14:00:00Z",
    updatedAt: "2024-02-13T09:00:00Z",
  },
]

// Quality Checks
export const mockQualityChecks: QualityCheck[] = [
  {
    id: "qc-001",
    checkNumber: "QC-2024-001",
    workOrderId: "wo-003",
    workOrderNumber: "WO-2024-003",
    productName: "Enterprise Suite Hardware",
    batchNumber: "BATCH-001",
    inspectionDate: "2024-01-28",
    inspectorId: "emp-005",
    inspectorName: "Mike Johnson",
    status: "passed",
    items: [
      { id: "qci-001", parameter: "Visual Inspection", specification: "No visible defects", actualValue: "Pass", result: "pass" },
      { id: "qci-002", parameter: "Power Test", specification: "Output: 12V ± 0.5V", actualValue: "12.1V", result: "pass" },
      { id: "qci-003", parameter: "Memory Test", specification: "All modules detected", actualValue: "32GB detected", result: "pass" },
      { id: "qci-004", parameter: "Stress Test", specification: "Run 2hr without errors", actualValue: "2hr 15min - No errors", result: "pass" },
    ],
    overallResult: "pass",
    notes: "All units passed quality inspection",
    createdAt: "2024-01-28T14:00:00Z",
    updatedAt: "2024-01-28T16:00:00Z",
  },
  {
    id: "qc-002",
    checkNumber: "QC-2024-002",
    workOrderId: "wo-001",
    workOrderNumber: "WO-2024-001",
    productName: "Enterprise Suite Hardware",
    batchNumber: "BATCH-002",
    inspectionDate: "2024-02-10",
    inspectorId: "emp-005",
    inspectorName: "Mike Johnson",
    status: "passed",
    items: [
      { id: "qci-005", parameter: "Visual Inspection", specification: "No visible defects", actualValue: "Pass", result: "pass" },
      { id: "qci-006", parameter: "Power Test", specification: "Output: 12V ± 0.5V", actualValue: "11.9V", result: "pass" },
      { id: "qci-007", parameter: "Memory Test", specification: "All modules detected", actualValue: "32GB detected", result: "pass" },
      { id: "qci-008", parameter: "Stress Test", specification: "Run 2hr without errors", actualValue: "2hr - No errors", result: "pass" },
    ],
    overallResult: "pass",
    createdAt: "2024-02-10T10:00:00Z",
    updatedAt: "2024-02-10T12:00:00Z",
  },
  {
    id: "qc-003",
    checkNumber: "QC-2024-003",
    workOrderId: "wo-001",
    workOrderNumber: "WO-2024-001",
    productName: "Enterprise Suite Hardware",
    batchNumber: "BATCH-003",
    inspectionDate: "2024-02-14",
    inspectorId: "emp-006",
    inspectorName: "Sarah Williams",
    status: "needs_review",
    items: [
      { id: "qci-009", parameter: "Visual Inspection", specification: "No visible defects", actualValue: "Minor scratch on 2 units", result: "fail", notes: "Cosmetic only - review needed" },
      { id: "qci-010", parameter: "Power Test", specification: "Output: 12V ± 0.5V", actualValue: "12.0V", result: "pass" },
      { id: "qci-011", parameter: "Memory Test", specification: "All modules detected", actualValue: "32GB detected", result: "pass" },
      { id: "qci-012", parameter: "Stress Test", specification: "Run 2hr without errors", actualValue: "Pending", result: "pending" },
    ],
    overallResult: "pending",
    notes: "2 units have minor cosmetic scratches - awaiting disposition",
    createdAt: "2024-02-14T09:00:00Z",
    updatedAt: "2024-02-14T11:00:00Z",
  },
]

// ============================================
// PROJECTS MODULE DATA
// ============================================

// Projects
export const mockProjects: Project[] = [
  {
    id: "proj-001",
    code: "PRJ-2024-001",
    name: "ERP System Implementation",
    description: "Complete ERP system implementation for manufacturing operations including inventory, production, and quality modules.",
    clientId: "c1",
    clientName: "Acme Corporation",
    status: "active",
    priority: "high",
    startDate: "2024-01-15",
    endDate: "2024-06-30",
    budget: 150000,
    spent: 68500,
    progress: 45,
    managerId: "emp-001",
    managerName: "John Smith",
    teamMembers: ["emp-002", "emp-003", "emp-004"],
    tags: ["ERP", "Manufacturing", "Integration"],
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-02-14T10:00:00Z",
  },
  {
    id: "proj-002",
    code: "PRJ-2024-002",
    name: "Mobile App Development",
    description: "Native mobile application for field service technicians with offline capabilities.",
    clientId: "c2",
    clientName: "TechStart Inc",
    status: "active",
    priority: "medium",
    startDate: "2024-02-01",
    endDate: "2024-05-15",
    budget: 85000,
    spent: 22000,
    progress: 28,
    managerId: "emp-002",
    managerName: "Jane Doe",
    teamMembers: ["emp-003", "emp-005"],
    tags: ["Mobile", "iOS", "Android"],
    createdAt: "2024-01-25T14:00:00Z",
    updatedAt: "2024-02-12T16:00:00Z",
  },
  {
    id: "proj-003",
    code: "PRJ-2024-003",
    name: "Data Analytics Dashboard",
    description: "Business intelligence dashboard with real-time KPIs and custom reporting.",
    clientId: "c4",
    clientName: "Global Services Ltd",
    status: "planning",
    priority: "medium",
    startDate: "2024-03-01",
    endDate: "2024-05-30",
    budget: 65000,
    spent: 0,
    progress: 0,
    managerId: "emp-001",
    managerName: "John Smith",
    teamMembers: ["emp-004"],
    tags: ["Analytics", "BI", "Dashboard"],
    createdAt: "2024-02-10T11:00:00Z",
    updatedAt: "2024-02-10T11:00:00Z",
  },
  {
    id: "proj-004",
    code: "PRJ-2023-015",
    name: "Website Redesign",
    description: "Complete website redesign with new branding and improved UX.",
    clientId: "c1",
    clientName: "Acme Corporation",
    status: "completed",
    priority: "low",
    startDate: "2023-10-01",
    endDate: "2024-01-15",
    budget: 45000,
    spent: 42800,
    progress: 100,
    managerId: "emp-002",
    managerName: "Jane Doe",
    teamMembers: ["emp-003"],
    tags: ["Web", "Design", "UX"],
    createdAt: "2023-09-15T09:00:00Z",
    updatedAt: "2024-01-15T17:00:00Z",
  },
  {
    id: "proj-005",
    code: "PRJ-2024-004",
    name: "API Integration Platform",
    description: "Develop unified API platform for third-party integrations.",
    clientId: "c2",
    clientName: "TechStart Inc",
    status: "on_hold",
    priority: "low",
    startDate: "2024-04-01",
    endDate: "2024-07-31",
    budget: 95000,
    spent: 0,
    progress: 0,
    managerId: "emp-001",
    managerName: "John Smith",
    teamMembers: [],
    tags: ["API", "Integration", "Platform"],
    createdAt: "2024-02-05T10:00:00Z",
    updatedAt: "2024-02-08T14:00:00Z",
  },
]

// Tasks
export const mockTasks: Task[] = [
  {
    id: "task-001",
    projectId: "proj-001",
    projectName: "ERP System Implementation",
    title: "Requirements Gathering",
    description: "Document all business requirements and create functional specifications.",
    status: "completed",
    priority: "high",
    assigneeId: "emp-002",
    assigneeName: "Jane Doe",
    dueDate: "2024-01-31",
    estimatedHours: 40,
    actualHours: 38,
    tags: ["Requirements", "Documentation"],
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-30T17:00:00Z",
    completedAt: "2024-01-30T17:00:00Z",
  },
  {
    id: "task-002",
    projectId: "proj-001",
    projectName: "ERP System Implementation",
    title: "Database Schema Design",
    description: "Design and implement the database schema for all modules.",
    status: "completed",
    priority: "high",
    assigneeId: "emp-003",
    assigneeName: "Mike Johnson",
    dueDate: "2024-02-15",
    estimatedHours: 60,
    actualHours: 55,
    tags: ["Database", "Design"],
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-02-12T16:00:00Z",
    completedAt: "2024-02-12T16:00:00Z",
  },
  {
    id: "task-003",
    projectId: "proj-001",
    projectName: "ERP System Implementation",
    title: "Inventory Module Development",
    description: "Develop the inventory management module with stock tracking and alerts.",
    status: "in_progress",
    priority: "high",
    assigneeId: "emp-003",
    assigneeName: "Mike Johnson",
    dueDate: "2024-03-01",
    estimatedHours: 80,
    actualHours: 45,
    tags: ["Development", "Inventory"],
    createdAt: "2024-02-01T09:00:00Z",
    updatedAt: "2024-02-14T10:00:00Z",
  },
  {
    id: "task-004",
    projectId: "proj-001",
    projectName: "ERP System Implementation",
    title: "Production Module Development",
    description: "Build production planning and work order management features.",
    status: "todo",
    priority: "medium",
    assigneeId: "emp-004",
    assigneeName: "Sarah Williams",
    dueDate: "2024-03-15",
    estimatedHours: 100,
    tags: ["Development", "Production"],
    createdAt: "2024-02-05T11:00:00Z",
    updatedAt: "2024-02-05T11:00:00Z",
  },
  {
    id: "task-005",
    projectId: "proj-002",
    projectName: "Mobile App Development",
    title: "UI/UX Design",
    description: "Create wireframes and final designs for all app screens.",
    status: "review",
    priority: "high",
    assigneeId: "emp-005",
    assigneeName: "David Chen",
    dueDate: "2024-02-20",
    estimatedHours: 50,
    actualHours: 48,
    tags: ["Design", "UI", "UX"],
    createdAt: "2024-02-01T14:00:00Z",
    updatedAt: "2024-02-14T09:00:00Z",
  },
  {
    id: "task-006",
    projectId: "proj-002",
    projectName: "Mobile App Development",
    title: "iOS Development",
    description: "Native iOS app development using Swift.",
    status: "in_progress",
    priority: "medium",
    assigneeId: "emp-003",
    assigneeName: "Mike Johnson",
    dueDate: "2024-04-01",
    estimatedHours: 120,
    actualHours: 25,
    tags: ["iOS", "Swift", "Development"],
    createdAt: "2024-02-10T10:00:00Z",
    updatedAt: "2024-02-14T11:00:00Z",
  },
  {
    id: "task-007",
    projectId: "proj-001",
    projectName: "ERP System Implementation",
    title: "User Acceptance Testing",
    description: "Coordinate and execute UAT with client stakeholders.",
    status: "blocked",
    priority: "medium",
    assigneeId: "emp-002",
    assigneeName: "Jane Doe",
    dueDate: "2024-05-15",
    estimatedHours: 40,
    tags: ["Testing", "UAT"],
    createdAt: "2024-02-08T09:00:00Z",
    updatedAt: "2024-02-08T09:00:00Z",
  },
]

// Milestones
export const mockMilestones: Milestone[] = [
  {
    id: "ms-001",
    projectId: "proj-001",
    projectName: "ERP System Implementation",
    title: "Project Kickoff",
    description: "Official project start with all stakeholders aligned.",
    dueDate: "2024-01-15",
    status: "achieved",
    completedDate: "2024-01-15",
    deliverables: ["Project charter", "Stakeholder matrix", "Communication plan"],
    createdAt: "2024-01-10T09:00:00Z",
  },
  {
    id: "ms-002",
    projectId: "proj-001",
    projectName: "ERP System Implementation",
    title: "Requirements Complete",
    description: "All business requirements documented and approved.",
    dueDate: "2024-02-01",
    status: "achieved",
    completedDate: "2024-01-31",
    deliverables: ["BRD document", "Functional specifications", "Sign-off"],
    createdAt: "2024-01-10T09:00:00Z",
  },
  {
    id: "ms-003",
    projectId: "proj-001",
    projectName: "ERP System Implementation",
    title: "Phase 1 Development Complete",
    description: "Inventory and basic production modules ready for testing.",
    dueDate: "2024-03-15",
    status: "pending",
    deliverables: ["Inventory module", "Basic production module", "Test environment"],
    createdAt: "2024-01-10T09:00:00Z",
  },
  {
    id: "ms-004",
    projectId: "proj-002",
    projectName: "Mobile App Development",
    title: "Design Approval",
    description: "Final UI/UX designs approved by client.",
    dueDate: "2024-02-20",
    status: "pending",
    deliverables: ["Design mockups", "Style guide", "Asset library"],
    createdAt: "2024-01-25T14:00:00Z",
  },
  {
    id: "ms-005",
    projectId: "proj-004",
    projectName: "Website Redesign",
    title: "Website Launch",
    description: "New website goes live.",
    dueDate: "2024-01-15",
    status: "achieved",
    completedDate: "2024-01-15",
    deliverables: ["Live website", "Analytics setup", "Documentation"],
    createdAt: "2023-09-15T09:00:00Z",
  },
]

// Time Entries
export const mockTimeEntries: TimeEntry[] = [
  { id: "te-001", projectId: "proj-001", projectName: "ERP System Implementation", taskId: "task-001", taskTitle: "Requirements Gathering", userId: "emp-002", userName: "Jane Doe", date: "2024-01-20", hours: 8, description: "Client interviews and requirement documentation", billable: true, hourlyRate: 150, status: "approved", createdAt: "2024-01-20T17:00:00Z" },
  { id: "te-002", projectId: "proj-001", projectName: "ERP System Implementation", taskId: "task-001", taskTitle: "Requirements Gathering", userId: "emp-002", userName: "Jane Doe", date: "2024-01-21", hours: 6, description: "Requirements workshop with stakeholders", billable: true, hourlyRate: 150, status: "approved", createdAt: "2024-01-21T17:00:00Z" },
  { id: "te-003", projectId: "proj-001", projectName: "ERP System Implementation", taskId: "task-002", taskTitle: "Database Schema Design", userId: "emp-003", userName: "Mike Johnson", date: "2024-02-05", hours: 8, description: "Initial schema design and review", billable: true, hourlyRate: 125, status: "approved", createdAt: "2024-02-05T17:00:00Z" },
  { id: "te-004", projectId: "proj-001", projectName: "ERP System Implementation", taskId: "task-003", taskTitle: "Inventory Module Development", userId: "emp-003", userName: "Mike Johnson", date: "2024-02-14", hours: 7, description: "Stock tracking feature implementation", billable: true, hourlyRate: 125, status: "submitted", createdAt: "2024-02-14T17:00:00Z" },
  { id: "te-005", projectId: "proj-002", projectName: "Mobile App Development", taskId: "task-005", taskTitle: "UI/UX Design", userId: "emp-005", userName: "David Chen", date: "2024-02-12", hours: 8, description: "Home screen and navigation design", billable: true, hourlyRate: 135, status: "approved", createdAt: "2024-02-12T17:00:00Z" },
  { id: "te-006", projectId: "proj-002", projectName: "Mobile App Development", taskId: "task-005", taskTitle: "UI/UX Design", userId: "emp-005", userName: "David Chen", date: "2024-02-13", hours: 6, description: "Settings and profile screens", billable: true, hourlyRate: 135, status: "draft", createdAt: "2024-02-13T17:00:00Z" },
  { id: "te-007", projectId: "proj-002", projectName: "Mobile App Development", taskId: "task-006", taskTitle: "iOS Development", userId: "emp-003", userName: "Mike Johnson", date: "2024-02-14", hours: 5, description: "Project setup and architecture", billable: true, hourlyRate: 125, status: "draft", createdAt: "2024-02-14T17:00:00Z" },
]

// ============================================
// SETTINGS DATA
// ============================================

export const mockCompanyProfile: CompanyProfile = {
  id: "company-001",
  name: "Ontyx Inc",
  legalName: "Ontyx Technologies Inc.",
  email: "info@ontyx.com",
  phone: "+1 555-0100",
  website: "https://ontyx.com",
  address: "123 Tech Boulevard, Suite 500",
  city: "San Francisco",
  state: "CA",
  postalCode: "94105",
  country: "USA",
  taxId: "12-3456789",
  registrationNumber: "C1234567",
  currency: "USD",
  timezone: "America/Los_Angeles",
  fiscalYearStart: "January",
  industry: "Technology",
}

export const mockUserPreferences: UserPreferences = {
  theme: "dark",
  language: "en",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  currency: "USD",
  notifications: {
    email: true,
    push: true,
    desktop: false,
  },
  dashboardLayout: "default",
}

export const mockSystemSettings: SystemSettings = {
  invoicePrefix: "INV",
  invoiceNextNumber: 2024006,
  billPrefix: "BILL",
  billNextNumber: 4,
  workOrderPrefix: "WO",
  workOrderNextNumber: 2024005,
  projectCodePrefix: "PRJ",
  projectNextNumber: 2024005,
  defaultPaymentTerms: 30,
  defaultTaxRate: 10,
  autoBackup: true,
  backupFrequency: "daily",
}

// ============================================
// SUMMARY FUNCTIONS
// ============================================

export function getManufacturingSummary() {
  const activeWorkOrders = mockWorkOrders.filter(wo => wo.status === "in_progress").length
  const plannedWorkOrders = mockWorkOrders.filter(wo => wo.status === "planned").length
  const completedWorkOrders = mockWorkOrders.filter(wo => wo.status === "completed").length
  const onHoldWorkOrders = mockWorkOrders.filter(wo => wo.status === "on_hold").length
  
  const totalUnitsPlanned = mockWorkOrders.filter(wo => wo.status !== "completed" && wo.status !== "cancelled").reduce((sum, wo) => sum + wo.quantity, 0)
  const totalUnitsCompleted = mockWorkOrders.reduce((sum, wo) => sum + wo.quantityCompleted, 0)
  
  const pendingQC = mockQualityChecks.filter(qc => qc.status === "pending" || qc.status === "needs_review").length
  const passedQC = mockQualityChecks.filter(qc => qc.status === "passed").length
  
  const avgUtilization = mockWorkCenters.reduce((sum, wc) => sum + wc.currentUtilization, 0) / mockWorkCenters.length
  
  return {
    activeWorkOrders,
    plannedWorkOrders,
    completedWorkOrders,
    onHoldWorkOrders,
    totalUnitsPlanned,
    totalUnitsCompleted,
    pendingQC,
    passedQC,
    avgUtilization: Math.round(avgUtilization),
    totalBOMs: mockBOMs.length,
    activeWorkCenters: mockWorkCenters.filter(wc => wc.isActive).length,
  }
}

export function getProjectsSummary() {
  const activeProjects = mockProjects.filter(p => p.status === "active").length
  const totalProjects = mockProjects.length
  const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget, 0)
  const totalSpent = mockProjects.reduce((sum, p) => sum + p.spent, 0)
  
  const activeTasks = mockTasks.filter(t => t.status === "in_progress").length
  const completedTasks = mockTasks.filter(t => t.status === "completed").length
  const totalTasks = mockTasks.length
  
  const upcomingMilestones = mockMilestones.filter(m => m.status === "pending").length
  const achievedMilestones = mockMilestones.filter(m => m.status === "achieved").length
  
  const thisWeekHours = mockTimeEntries.filter(te => {
    const entryDate = new Date(te.date)
    const now = new Date()
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    return entryDate >= weekStart
  }).reduce((sum, te) => sum + te.hours, 0)
  
  return {
    activeProjects,
    totalProjects,
    totalBudget,
    totalSpent,
    budgetUtilization: Math.round((totalSpent / totalBudget) * 100),
    activeTasks,
    completedTasks,
    totalTasks,
    taskCompletionRate: Math.round((completedTasks / totalTasks) * 100),
    upcomingMilestones,
    achievedMilestones,
    thisWeekHours,
  }
}

// ==========================================
// OPERATIONS MOCK DATA
// ==========================================

import {
  ProductCategory, Product, StockMovement,
  Warehouse, WarehouseZone, BinLocation, StockTransfer,
  SalesOrder, Quote,
  Vendor, PurchaseOrder, GoodsReceipt, ReorderSuggestion
} from "@/types/operations"

// Product Categories
export const mockProductCategories: ProductCategory[] = [
  { id: "cat-1", name: "Electronics", slug: "electronics", description: "Electronic devices and components", productCount: 45, isActive: true, createdAt: "2024-01-01" },
  { id: "cat-2", name: "Office Supplies", slug: "office-supplies", description: "Office equipment and supplies", productCount: 128, isActive: true, createdAt: "2024-01-01" },
  { id: "cat-3", name: "Software", slug: "software", description: "Software licenses and subscriptions", productCount: 23, isActive: true, createdAt: "2024-01-01" },
  { id: "cat-4", name: "Furniture", slug: "furniture", description: "Office and home furniture", productCount: 67, isActive: true, createdAt: "2024-01-01" },
  { id: "cat-5", name: "Hardware", slug: "hardware", description: "Computer hardware and accessories", productCount: 89, isActive: true, createdAt: "2024-01-01" },
  { id: "cat-6", name: "Networking", slug: "networking", description: "Network equipment", parentId: "cat-1", productCount: 34, isActive: true, createdAt: "2024-01-15" },
]

// Products / Inventory
export const mockProducts: Product[] = [
  {
    id: "prod-1", sku: "ELEC-001", barcode: "123456789012", name: "Wireless Keyboard", description: "Ergonomic wireless keyboard with backlight",
    categoryId: "cat-1", categoryName: "Electronics", status: "active", unitPrice: 79.99, costPrice: 45.00, taxRate: 10,
    stockQuantity: 234, reorderLevel: 50, reorderQuantity: 100, unit: "pcs", weight: 0.8,
    dimensions: { length: 45, width: 15, height: 3 }, tags: ["wireless", "ergonomic"], isActive: true,
    createdAt: "2024-01-01", updatedAt: "2024-02-10"
  },
  {
    id: "prod-2", sku: "ELEC-002", barcode: "123456789013", name: "USB-C Hub 7-in-1", description: "Multi-port USB-C adapter",
    categoryId: "cat-1", categoryName: "Electronics", status: "active", unitPrice: 49.99, costPrice: 28.00, taxRate: 10,
    stockQuantity: 156, reorderLevel: 30, reorderQuantity: 80, unit: "pcs", weight: 0.15,
    tags: ["usb-c", "adapter"], isActive: true, createdAt: "2024-01-05", updatedAt: "2024-02-12"
  },
  {
    id: "prod-3", sku: "OFF-001", barcode: "123456789014", name: "Premium A4 Paper", description: "80gsm premium copy paper, 500 sheets",
    categoryId: "cat-2", categoryName: "Office Supplies", status: "active", unitPrice: 12.99, costPrice: 7.50, taxRate: 5,
    stockQuantity: 890, reorderLevel: 200, reorderQuantity: 500, unit: "ream", weight: 2.5,
    isActive: true, createdAt: "2024-01-01", updatedAt: "2024-02-08"
  },
  {
    id: "prod-4", sku: "SOFT-001", name: "Enterprise Suite License", description: "Annual enterprise software license",
    categoryId: "cat-3", categoryName: "Software", status: "active", unitPrice: 2499.00, costPrice: 1200.00, taxRate: 0,
    stockQuantity: 999, reorderLevel: 0, reorderQuantity: 0, unit: "license",
    isActive: true, createdAt: "2024-01-01", updatedAt: "2024-02-01"
  },
  {
    id: "prod-5", sku: "FURN-001", barcode: "123456789015", name: "Ergonomic Office Chair", description: "Adjustable lumbar support, mesh back",
    categoryId: "cat-4", categoryName: "Furniture", status: "active", unitPrice: 349.99, costPrice: 180.00, taxRate: 10,
    stockQuantity: 45, reorderLevel: 10, reorderQuantity: 25, unit: "pcs", weight: 18.5,
    dimensions: { length: 70, width: 70, height: 120 }, isActive: true, createdAt: "2024-01-10", updatedAt: "2024-02-11"
  },
  {
    id: "prod-6", sku: "HW-001", barcode: "123456789016", name: "32GB DDR5 RAM", description: "High-speed DDR5 memory module",
    categoryId: "cat-5", categoryName: "Hardware", status: "active", unitPrice: 129.99, costPrice: 85.00, taxRate: 10,
    stockQuantity: 8, reorderLevel: 20, reorderQuantity: 50, unit: "pcs", weight: 0.05,
    tags: ["ram", "memory", "ddr5"], isActive: true, createdAt: "2024-01-15", updatedAt: "2024-02-14"
  },
  {
    id: "prod-7", sku: "NET-001", barcode: "123456789017", name: "WiFi 6E Router", description: "Tri-band wireless router",
    categoryId: "cat-6", categoryName: "Networking", status: "active", unitPrice: 279.99, costPrice: 150.00, taxRate: 10,
    stockQuantity: 67, reorderLevel: 15, reorderQuantity: 40, unit: "pcs", weight: 0.9,
    isActive: true, createdAt: "2024-01-20", updatedAt: "2024-02-09"
  },
  {
    id: "prod-8", sku: "ELEC-003", barcode: "123456789018", name: "27\" 4K Monitor", description: "IPS panel, 60Hz refresh rate",
    categoryId: "cat-1", categoryName: "Electronics", status: "out_of_stock", unitPrice: 399.99, costPrice: 240.00, taxRate: 10,
    stockQuantity: 0, reorderLevel: 10, reorderQuantity: 30, unit: "pcs", weight: 6.5,
    dimensions: { length: 62, width: 20, height: 45 }, isActive: true, createdAt: "2024-01-08", updatedAt: "2024-02-14"
  },
  {
    id: "prod-9", sku: "OFF-002", barcode: "123456789019", name: "Whiteboard Markers Set", description: "12-color dry erase markers",
    categoryId: "cat-2", categoryName: "Office Supplies", status: "active", unitPrice: 14.99, costPrice: 6.00, taxRate: 5,
    stockQuantity: 456, reorderLevel: 100, reorderQuantity: 200, unit: "set",
    isActive: true, createdAt: "2024-01-12", updatedAt: "2024-02-05"
  },
  {
    id: "prod-10", sku: "FURN-002", barcode: "123456789020", name: "Standing Desk Electric", description: "Height adjustable electric desk",
    categoryId: "cat-4", categoryName: "Furniture", status: "active", unitPrice: 549.99, costPrice: 320.00, taxRate: 10,
    stockQuantity: 23, reorderLevel: 5, reorderQuantity: 15, unit: "pcs", weight: 45.0,
    dimensions: { length: 160, width: 80, height: 125 }, isActive: true, createdAt: "2024-01-25", updatedAt: "2024-02-13"
  },
]

// Stock Movements
export const mockStockMovements: StockMovement[] = [
  { id: "sm-1", productId: "prod-1", productName: "Wireless Keyboard", warehouseId: "wh-1", warehouseName: "Main Warehouse", type: "in", quantity: 100, previousStock: 134, newStock: 234, reference: "PO-2024-015", createdAt: "2024-02-10T10:00:00Z", createdBy: "John Smith" },
  { id: "sm-2", productId: "prod-6", productName: "32GB DDR5 RAM", warehouseId: "wh-1", warehouseName: "Main Warehouse", type: "out", quantity: 12, previousStock: 20, newStock: 8, reference: "SO-2024-042", createdAt: "2024-02-14T09:30:00Z", createdBy: "System" },
  { id: "sm-3", productId: "prod-3", productName: "Premium A4 Paper", warehouseId: "wh-2", warehouseName: "East Distribution", type: "transfer", quantity: 200, previousStock: 1090, newStock: 890, reference: "TRF-2024-003", notes: "Transfer to West warehouse", createdAt: "2024-02-08T14:00:00Z", createdBy: "Jane Doe" },
  { id: "sm-4", productId: "prod-8", productName: "27\" 4K Monitor", warehouseId: "wh-1", warehouseName: "Main Warehouse", type: "out", quantity: 15, previousStock: 15, newStock: 0, reference: "SO-2024-038", createdAt: "2024-02-12T11:00:00Z", createdBy: "System" },
  { id: "sm-5", productId: "prod-5", productName: "Ergonomic Office Chair", warehouseId: "wh-1", warehouseName: "Main Warehouse", type: "adjustment", quantity: -2, previousStock: 47, newStock: 45, notes: "Damaged in transit", createdAt: "2024-02-11T16:00:00Z", createdBy: "Warehouse Manager" },
]

// Warehouses
export const mockWarehouses: Warehouse[] = [
  {
    id: "wh-1", code: "MAIN", name: "Main Warehouse", address: "123 Industrial Park", city: "New York", country: "USA",
    status: "active", capacity: 10000, usedCapacity: 6850, managerId: "emp-1", managerName: "Mike Johnson",
    phone: "+1 555-0150", email: "main@warehouse.com", isDefault: true,
    zones: [
      { id: "z-1", warehouseId: "wh-1", name: "Receiving", code: "RCV", type: "receiving", capacity: 1000, usedCapacity: 450, isActive: true, binLocations: [] },
      { id: "z-2", warehouseId: "wh-1", name: "Storage A", code: "STA", type: "storage", capacity: 5000, usedCapacity: 4200, isActive: true, binLocations: [] },
      { id: "z-3", warehouseId: "wh-1", name: "Picking", code: "PCK", type: "picking", capacity: 2000, usedCapacity: 1500, isActive: true, binLocations: [] },
      { id: "z-4", warehouseId: "wh-1", name: "Shipping", code: "SHP", type: "shipping", capacity: 2000, usedCapacity: 700, isActive: true, binLocations: [] },
    ],
    createdAt: "2023-01-01", updatedAt: "2024-02-14"
  },
  {
    id: "wh-2", code: "EAST", name: "East Distribution Center", address: "456 Logistics Blvd", city: "Boston", country: "USA",
    status: "active", capacity: 8000, usedCapacity: 5200, managerName: "Sarah Chen",
    phone: "+1 555-0160", email: "east@warehouse.com", isDefault: false,
    zones: [
      { id: "z-5", warehouseId: "wh-2", name: "Bulk Storage", code: "BLK", type: "storage", capacity: 6000, usedCapacity: 4500, isActive: true, binLocations: [] },
      { id: "z-6", warehouseId: "wh-2", name: "Shipping Bay", code: "SBY", type: "shipping", capacity: 2000, usedCapacity: 700, isActive: true, binLocations: [] },
    ],
    createdAt: "2023-06-15", updatedAt: "2024-02-10"
  },
  {
    id: "wh-3", code: "WEST", name: "West Fulfillment", address: "789 Commerce Dr", city: "Los Angeles", country: "USA",
    status: "active", capacity: 12000, usedCapacity: 7800, managerName: "Carlos Rodriguez",
    phone: "+1 555-0170", email: "west@warehouse.com", isDefault: false,
    zones: [
      { id: "z-7", warehouseId: "wh-3", name: "Zone A", code: "ZNA", type: "storage", capacity: 8000, usedCapacity: 6000, isActive: true, binLocations: [] },
      { id: "z-8", warehouseId: "wh-3", name: "Zone B", code: "ZNB", type: "storage", capacity: 4000, usedCapacity: 1800, isActive: true, binLocations: [] },
    ],
    createdAt: "2023-09-01", updatedAt: "2024-02-12"
  },
  {
    id: "wh-4", code: "MAINT", name: "Maintenance Facility", address: "321 Service Rd", city: "Chicago", country: "USA",
    status: "maintenance", capacity: 3000, usedCapacity: 1200,
    phone: "+1 555-0180", isDefault: false,
    zones: [],
    createdAt: "2024-01-01", updatedAt: "2024-02-01"
  },
]

// Stock Transfers
export const mockStockTransfers: StockTransfer[] = [
  {
    id: "trf-1", transferNumber: "TRF-2024-001", fromWarehouseId: "wh-1", fromWarehouseName: "Main Warehouse",
    toWarehouseId: "wh-2", toWarehouseName: "East Distribution Center", status: "completed",
    items: [
      { id: "ti-1", productId: "prod-1", productName: "Wireless Keyboard", sku: "ELEC-001", quantity: 50 },
      { id: "ti-2", productId: "prod-2", productName: "USB-C Hub 7-in-1", sku: "ELEC-002", quantity: 30 },
    ],
    totalItems: 2, totalQuantity: 80, requestedBy: "John Smith", requestedAt: "2024-02-01T09:00:00Z",
    approvedBy: "Jane Doe", approvedAt: "2024-02-01T10:00:00Z", completedAt: "2024-02-03T14:00:00Z",
    createdAt: "2024-02-01T09:00:00Z", updatedAt: "2024-02-03T14:00:00Z"
  },
  {
    id: "trf-2", transferNumber: "TRF-2024-002", fromWarehouseId: "wh-2", fromWarehouseName: "East Distribution Center",
    toWarehouseId: "wh-3", toWarehouseName: "West Fulfillment", status: "in_transit",
    items: [
      { id: "ti-3", productId: "prod-3", productName: "Premium A4 Paper", sku: "OFF-001", quantity: 200 },
      { id: "ti-4", productId: "prod-9", productName: "Whiteboard Markers Set", sku: "OFF-002", quantity: 100 },
    ],
    totalItems: 2, totalQuantity: 300, notes: "Urgent replenishment", requestedBy: "Sarah Chen", requestedAt: "2024-02-12T11:00:00Z",
    approvedBy: "Mike Johnson", approvedAt: "2024-02-12T12:00:00Z",
    createdAt: "2024-02-12T11:00:00Z", updatedAt: "2024-02-13T08:00:00Z"
  },
  {
    id: "trf-3", transferNumber: "TRF-2024-003", fromWarehouseId: "wh-1", fromWarehouseName: "Main Warehouse",
    toWarehouseId: "wh-3", toWarehouseName: "West Fulfillment", status: "pending",
    items: [
      { id: "ti-5", productId: "prod-5", productName: "Ergonomic Office Chair", sku: "FURN-001", quantity: 15 },
      { id: "ti-6", productId: "prod-10", productName: "Standing Desk Electric", sku: "FURN-002", quantity: 8 },
    ],
    totalItems: 2, totalQuantity: 23, requestedBy: "Carlos Rodriguez", requestedAt: "2024-02-14T09:00:00Z",
    createdAt: "2024-02-14T09:00:00Z", updatedAt: "2024-02-14T09:00:00Z"
  },
]

// Sales Orders
export const mockSalesOrders: SalesOrder[] = [
  {
    id: "so-1", orderNumber: "SO-2024-001", customerId: "c1", customerName: "Acme Corporation",
    customerEmail: "orders@acme.com", customerPhone: "+1 555-0100",
    shippingAddress: { street: "123 Business Ave", city: "New York", state: "NY", postalCode: "10001", country: "USA" },
    status: "delivered", paymentStatus: "paid",
    items: [
      { id: "soi-1", productId: "prod-1", productName: "Wireless Keyboard", sku: "ELEC-001", quantity: 25, unitPrice: 79.99, taxRate: 10, discount: 0, total: 2199.73, fulfilledQuantity: 25, backorderedQuantity: 0 },
      { id: "soi-2", productId: "prod-2", productName: "USB-C Hub 7-in-1", sku: "ELEC-002", quantity: 25, unitPrice: 49.99, taxRate: 10, discount: 5, total: 1306.00, fulfilledQuantity: 25, backorderedQuantity: 0 },
    ],
    subtotal: 3249.50, taxTotal: 324.95, shippingCost: 45.00, discount: 68.72, total: 3550.73,
    amountPaid: 3550.73, amountDue: 0, currency: "USD", shippingMethod: "standard",
    trackingNumber: "1Z999AA10123456784", warehouseId: "wh-1",
    orderDate: "2024-01-15", expectedDelivery: "2024-01-22", shippedAt: "2024-01-17T10:00:00Z", deliveredAt: "2024-01-21T14:00:00Z",
    createdAt: "2024-01-15T09:00:00Z", updatedAt: "2024-01-21T14:00:00Z"
  },
  {
    id: "so-2", orderNumber: "SO-2024-002", customerId: "c2", customerName: "TechStart Inc",
    customerEmail: "purchasing@techstart.io",
    shippingAddress: { street: "456 Innovation Blvd", city: "San Francisco", state: "CA", postalCode: "94105", country: "USA" },
    status: "shipped", paymentStatus: "paid",
    items: [
      { id: "soi-3", productId: "prod-5", productName: "Ergonomic Office Chair", sku: "FURN-001", quantity: 10, unitPrice: 349.99, taxRate: 10, discount: 10, total: 3464.90, fulfilledQuantity: 10, backorderedQuantity: 0 },
      { id: "soi-4", productId: "prod-10", productName: "Standing Desk Electric", sku: "FURN-002", quantity: 10, unitPrice: 549.99, taxRate: 10, discount: 10, total: 5444.90, fulfilledQuantity: 10, backorderedQuantity: 0 },
    ],
    subtotal: 8999.80, taxTotal: 899.98, shippingCost: 150.00, discount: 989.98, total: 9059.80,
    amountPaid: 9059.80, amountDue: 0, currency: "USD", shippingMethod: "express",
    trackingNumber: "1Z999AA10123456785", warehouseId: "wh-1",
    orderDate: "2024-02-05", expectedDelivery: "2024-02-12", shippedAt: "2024-02-07T09:00:00Z",
    createdAt: "2024-02-05T11:00:00Z", updatedAt: "2024-02-07T09:00:00Z"
  },
  {
    id: "so-3", orderNumber: "SO-2024-003", customerId: "c4", customerName: "Global Services Ltd",
    customerEmail: "orders@globalservices.com",
    shippingAddress: { street: "789 Corporate Way", city: "Chicago", state: "IL", postalCode: "60601", country: "USA" },
    status: "processing", paymentStatus: "partial",
    items: [
      { id: "soi-5", productId: "prod-4", productName: "Enterprise Suite License", sku: "SOFT-001", quantity: 5, unitPrice: 2499.00, taxRate: 0, discount: 0, total: 12495.00, fulfilledQuantity: 0, backorderedQuantity: 0 },
      { id: "soi-6", productId: "prod-7", productName: "WiFi 6E Router", sku: "NET-001", quantity: 20, unitPrice: 279.99, taxRate: 10, discount: 0, total: 6159.78, fulfilledQuantity: 0, backorderedQuantity: 0 },
    ],
    subtotal: 18094.80, taxTotal: 559.98, shippingCost: 0, discount: 0, total: 18654.78,
    amountPaid: 9000.00, amountDue: 9654.78, currency: "USD", shippingMethod: "standard",
    warehouseId: "wh-1", orderDate: "2024-02-12", expectedDelivery: "2024-02-20",
    createdAt: "2024-02-12T14:00:00Z", updatedAt: "2024-02-14T10:00:00Z"
  },
  {
    id: "so-4", orderNumber: "SO-2024-004", customerId: "c1", customerName: "Acme Corporation",
    customerEmail: "orders@acme.com",
    shippingAddress: { street: "123 Business Ave", city: "New York", state: "NY", postalCode: "10001", country: "USA" },
    status: "confirmed", paymentStatus: "pending",
    items: [
      { id: "soi-7", productId: "prod-6", productName: "32GB DDR5 RAM", sku: "HW-001", quantity: 50, unitPrice: 129.99, taxRate: 10, discount: 15, total: 6074.53, fulfilledQuantity: 0, backorderedQuantity: 42 },
      { id: "soi-8", productId: "prod-8", productName: "27\" 4K Monitor", sku: "ELEC-003", quantity: 15, unitPrice: 399.99, taxRate: 10, discount: 0, total: 6599.84, fulfilledQuantity: 0, backorderedQuantity: 15 },
    ],
    subtotal: 11499.35, taxTotal: 1149.94, shippingCost: 75.00, discount: 1025.02, total: 11699.27,
    amountPaid: 0, amountDue: 11699.27, currency: "USD", shippingMethod: "standard",
    internalNotes: "Customer requested delivery after 2024-02-25",
    warehouseId: "wh-1", orderDate: "2024-02-14", expectedDelivery: "2024-02-28",
    createdAt: "2024-02-14T08:00:00Z", updatedAt: "2024-02-14T08:00:00Z"
  },
  {
    id: "so-5", orderNumber: "SO-2024-005", customerId: "c2", customerName: "TechStart Inc",
    customerEmail: "purchasing@techstart.io",
    shippingAddress: { street: "456 Innovation Blvd", city: "San Francisco", state: "CA", postalCode: "94105", country: "USA" },
    status: "draft", paymentStatus: "pending",
    items: [
      { id: "soi-9", productId: "prod-3", productName: "Premium A4 Paper", sku: "OFF-001", quantity: 100, unitPrice: 12.99, taxRate: 5, discount: 0, total: 1363.95, fulfilledQuantity: 0, backorderedQuantity: 0 },
    ],
    subtotal: 1299.00, taxTotal: 64.95, shippingCost: 25.00, discount: 0, total: 1388.95,
    amountPaid: 0, amountDue: 1388.95, currency: "USD", shippingMethod: "standard",
    warehouseId: "wh-3", orderDate: "2024-02-14",
    createdAt: "2024-02-14T15:00:00Z", updatedAt: "2024-02-14T15:00:00Z"
  },
]

// Quotes
export const mockQuotes: Quote[] = [
  {
    id: "qt-1", quoteNumber: "QT-2024-001", customerId: "c1", customerName: "Acme Corporation",
    customerEmail: "purchasing@acme.com", status: "accepted",
    items: [
      { id: "qi-1", productId: "prod-1", productName: "Wireless Keyboard", sku: "ELEC-001", quantity: 100, unitPrice: 75.00, taxRate: 10, discount: 5, total: 7837.50 },
      { id: "qi-2", productId: "prod-2", productName: "USB-C Hub 7-in-1", sku: "ELEC-002", quantity: 100, unitPrice: 45.00, taxRate: 10, discount: 5, total: 4702.50 },
    ],
    subtotal: 12000.00, taxTotal: 1200.00, discount: 660.00, total: 12540.00, currency: "USD",
    validUntil: "2024-03-01", notes: "Bulk order pricing applied", terms: "Net 30",
    convertedOrderId: "so-1", createdAt: "2024-01-10T10:00:00Z", updatedAt: "2024-01-14T09:00:00Z", sentAt: "2024-01-10T11:00:00Z"
  },
  {
    id: "qt-2", quoteNumber: "QT-2024-002", customerId: "c4", customerName: "Global Services Ltd",
    customerEmail: "procurement@globalservices.com", status: "sent",
    items: [
      { id: "qi-3", productId: "prod-4", productName: "Enterprise Suite License", sku: "SOFT-001", quantity: 10, unitPrice: 2299.00, taxRate: 0, discount: 8, total: 21150.80 },
    ],
    subtotal: 22990.00, taxTotal: 0, discount: 1839.20, total: 21150.80, currency: "USD",
    validUntil: "2024-03-15", notes: "Volume discount for 10+ licenses", terms: "50% upfront, 50% on delivery",
    createdAt: "2024-02-10T14:00:00Z", updatedAt: "2024-02-10T15:00:00Z", sentAt: "2024-02-10T15:00:00Z"
  },
  {
    id: "qt-3", quoteNumber: "QT-2024-003", customerId: "c2", customerName: "TechStart Inc",
    customerEmail: "office@techstart.io", status: "draft",
    items: [
      { id: "qi-4", productId: "prod-5", productName: "Ergonomic Office Chair", sku: "FURN-001", quantity: 25, unitPrice: 320.00, taxRate: 10, discount: 10, total: 7920.00 },
      { id: "qi-5", productId: "prod-10", productName: "Standing Desk Electric", sku: "FURN-002", quantity: 25, unitPrice: 500.00, taxRate: 10, discount: 10, total: 12375.00 },
    ],
    subtotal: 20500.00, taxTotal: 2050.00, discount: 2255.00, total: 20295.00, currency: "USD",
    validUntil: "2024-03-01", createdAt: "2024-02-14T11:00:00Z", updatedAt: "2024-02-14T11:00:00Z"
  },
  {
    id: "qt-4", quoteNumber: "QT-2024-004", customerId: "c1", customerName: "Acme Corporation",
    customerEmail: "it@acme.com", status: "expired",
    items: [
      { id: "qi-6", productId: "prod-7", productName: "WiFi 6E Router", sku: "NET-001", quantity: 50, unitPrice: 260.00, taxRate: 10, discount: 7, total: 13299.00 },
    ],
    subtotal: 13000.00, taxTotal: 1300.00, discount: 1001.00, total: 13299.00, currency: "USD",
    validUntil: "2024-01-31", createdAt: "2024-01-05T09:00:00Z", updatedAt: "2024-02-01T00:00:00Z", sentAt: "2024-01-05T10:00:00Z"
  },
]

// Vendors
export const mockVendors: Vendor[] = [
  {
    id: "vnd-1", code: "VND-001", name: "Tech Supplies Inc", email: "orders@techsupplies.com", phone: "+1 555-0200",
    address: "100 Supplier Lane", city: "Seattle", country: "USA", contactName: "David Lee",
    paymentTerms: "Net 30", currency: "USD", taxId: "12-3456789", rating: 4.5,
    isActive: true, totalOrders: 45, totalSpent: 125000, createdAt: "2023-01-15", updatedAt: "2024-02-10"
  },
  {
    id: "vnd-2", code: "VND-002", name: "Office Depot Pro", email: "b2b@officedepotpro.com", phone: "+1 555-0210",
    address: "200 Office Park", city: "Dallas", country: "USA", contactName: "Lisa Wang",
    paymentTerms: "Net 15", currency: "USD", rating: 4.8,
    isActive: true, totalOrders: 89, totalSpent: 45000, createdAt: "2023-03-20", updatedAt: "2024-02-12"
  },
  {
    id: "vnd-3", code: "VND-003", name: "Furniture World", email: "wholesale@furnitureworld.com", phone: "+1 555-0220",
    address: "300 Industrial Blvd", city: "Los Angeles", country: "USA", contactName: "Michael Brown",
    paymentTerms: "Net 45", currency: "USD", rating: 4.2,
    isActive: true, totalOrders: 23, totalSpent: 89000, createdAt: "2023-06-10", updatedAt: "2024-01-28"
  },
  {
    id: "vnd-4", code: "VND-004", name: "Global Electronics", email: "sales@globalelec.com", phone: "+1 555-0230",
    address: "400 Tech Drive", city: "San Jose", country: "USA", contactName: "Jennifer Kim",
    paymentTerms: "Net 30", currency: "USD", taxId: "98-7654321", rating: 4.6,
    isActive: true, totalOrders: 67, totalSpent: 234000, createdAt: "2023-02-01", updatedAt: "2024-02-14"
  },
  {
    id: "vnd-5", code: "VND-005", name: "Network Solutions Ltd", email: "orders@netsolutions.com", phone: "+1 555-0240",
    address: "500 Connect Ave", city: "Austin", country: "USA",
    paymentTerms: "Net 30", currency: "USD", rating: 3.9, notes: "Specializes in networking equipment",
    isActive: true, totalOrders: 18, totalSpent: 56000, createdAt: "2023-08-15", updatedAt: "2024-02-05"
  },
]

// Purchase Orders
export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: "po-1", poNumber: "PO-2024-001", vendorId: "vnd-1", vendorName: "Tech Supplies Inc",
    vendorEmail: "orders@techsupplies.com", status: "received", receivingStatus: "complete",
    items: [
      { id: "poi-1", productId: "prod-1", productName: "Wireless Keyboard", sku: "ELEC-001", quantity: 100, receivedQuantity: 100, unitCost: 45.00, taxRate: 10, total: 4950.00 },
      { id: "poi-2", productId: "prod-2", productName: "USB-C Hub 7-in-1", sku: "ELEC-002", quantity: 80, receivedQuantity: 80, unitCost: 28.00, taxRate: 10, total: 2464.00 },
    ],
    subtotal: 6760.00, taxTotal: 676.00, shippingCost: 150.00, total: 7586.00, amountPaid: 7586.00, currency: "USD",
    warehouseId: "wh-1", warehouseName: "Main Warehouse",
    orderDate: "2024-01-20", expectedDelivery: "2024-02-05", sentAt: "2024-01-20T10:00:00Z",
    confirmedAt: "2024-01-21T09:00:00Z", receivedAt: "2024-02-03T14:00:00Z",
    createdAt: "2024-01-20T09:00:00Z", updatedAt: "2024-02-03T14:00:00Z", createdBy: "John Smith"
  },
  {
    id: "po-2", poNumber: "PO-2024-002", vendorId: "vnd-2", vendorName: "Office Depot Pro",
    vendorEmail: "b2b@officedepotpro.com", status: "received", receivingStatus: "complete",
    items: [
      { id: "poi-3", productId: "prod-3", productName: "Premium A4 Paper", sku: "OFF-001", quantity: 500, receivedQuantity: 500, unitCost: 7.50, taxRate: 5, total: 3937.50 },
      { id: "poi-4", productId: "prod-9", productName: "Whiteboard Markers Set", sku: "OFF-002", quantity: 200, receivedQuantity: 200, unitCost: 6.00, taxRate: 5, total: 1260.00 },
    ],
    subtotal: 4950.00, taxTotal: 247.50, shippingCost: 75.00, total: 5272.50, amountPaid: 5272.50, currency: "USD",
    warehouseId: "wh-2", warehouseName: "East Distribution Center",
    orderDate: "2024-02-01", expectedDelivery: "2024-02-08", sentAt: "2024-02-01T11:00:00Z",
    confirmedAt: "2024-02-01T14:00:00Z", receivedAt: "2024-02-07T10:00:00Z",
    createdAt: "2024-02-01T10:00:00Z", updatedAt: "2024-02-07T10:00:00Z", createdBy: "Jane Doe"
  },
  {
    id: "po-3", poNumber: "PO-2024-003", vendorId: "vnd-4", vendorName: "Global Electronics",
    vendorEmail: "sales@globalelec.com", status: "confirmed", receivingStatus: "pending",
    items: [
      { id: "poi-5", productId: "prod-6", productName: "32GB DDR5 RAM", sku: "HW-001", quantity: 100, receivedQuantity: 0, unitCost: 85.00, taxRate: 10, total: 9350.00 },
      { id: "poi-6", productId: "prod-8", productName: "27\" 4K Monitor", sku: "ELEC-003", quantity: 50, receivedQuantity: 0, unitCost: 240.00, taxRate: 10, total: 13200.00 },
    ],
    subtotal: 20500.00, taxTotal: 2050.00, shippingCost: 250.00, total: 22800.00, amountPaid: 0, currency: "USD",
    warehouseId: "wh-1", warehouseName: "Main Warehouse",
    orderDate: "2024-02-10", expectedDelivery: "2024-02-20", sentAt: "2024-02-10T09:00:00Z",
    confirmedAt: "2024-02-11T10:00:00Z", internalNotes: "Expedited shipping requested",
    createdAt: "2024-02-10T08:00:00Z", updatedAt: "2024-02-11T10:00:00Z", createdBy: "John Smith"
  },
  {
    id: "po-4", poNumber: "PO-2024-004", vendorId: "vnd-3", vendorName: "Furniture World",
    status: "sent", receivingStatus: "pending",
    items: [
      { id: "poi-7", productId: "prod-5", productName: "Ergonomic Office Chair", sku: "FURN-001", quantity: 30, receivedQuantity: 0, unitCost: 180.00, taxRate: 10, total: 5940.00 },
      { id: "poi-8", productId: "prod-10", productName: "Standing Desk Electric", sku: "FURN-002", quantity: 20, receivedQuantity: 0, unitCost: 320.00, taxRate: 10, total: 7040.00 },
    ],
    subtotal: 11800.00, taxTotal: 1180.00, shippingCost: 350.00, total: 13330.00, amountPaid: 0, currency: "USD",
    warehouseId: "wh-3", warehouseName: "West Fulfillment",
    orderDate: "2024-02-12", expectedDelivery: "2024-03-01", sentAt: "2024-02-12T14:00:00Z",
    createdAt: "2024-02-12T13:00:00Z", updatedAt: "2024-02-12T14:00:00Z", createdBy: "Carlos Rodriguez"
  },
  {
    id: "po-5", poNumber: "PO-2024-005", vendorId: "vnd-5", vendorName: "Network Solutions Ltd",
    status: "draft", receivingStatus: "pending",
    items: [
      { id: "poi-9", productId: "prod-7", productName: "WiFi 6E Router", sku: "NET-001", quantity: 50, receivedQuantity: 0, unitCost: 150.00, taxRate: 10, total: 8250.00 },
    ],
    subtotal: 7500.00, taxTotal: 750.00, shippingCost: 100.00, total: 8350.00, amountPaid: 0, currency: "USD",
    warehouseId: "wh-1", warehouseName: "Main Warehouse",
    orderDate: "2024-02-14", expectedDelivery: "2024-02-28",
    createdAt: "2024-02-14T10:00:00Z", updatedAt: "2024-02-14T10:00:00Z", createdBy: "John Smith"
  },
]

// Goods Receipts
export const mockGoodsReceipts: GoodsReceipt[] = [
  {
    id: "gr-1", receiptNumber: "GR-2024-001", purchaseOrderId: "po-1", poNumber: "PO-2024-001",
    vendorId: "vnd-1", vendorName: "Tech Supplies Inc", warehouseId: "wh-1", warehouseName: "Main Warehouse",
    items: [
      { id: "gri-1", productId: "prod-1", productName: "Wireless Keyboard", sku: "ELEC-001", orderedQuantity: 100, receivedQuantity: 100, condition: "good" },
      { id: "gri-2", productId: "prod-2", productName: "USB-C Hub 7-in-1", sku: "ELEC-002", orderedQuantity: 80, receivedQuantity: 80, condition: "good" },
    ],
    totalQuantity: 180, receivedBy: "Mike Johnson", receivedAt: "2024-02-03T14:00:00Z", createdAt: "2024-02-03T14:00:00Z"
  },
  {
    id: "gr-2", receiptNumber: "GR-2024-002", purchaseOrderId: "po-2", poNumber: "PO-2024-002",
    vendorId: "vnd-2", vendorName: "Office Depot Pro", warehouseId: "wh-2", warehouseName: "East Distribution Center",
    items: [
      { id: "gri-3", productId: "prod-3", productName: "Premium A4 Paper", sku: "OFF-001", orderedQuantity: 500, receivedQuantity: 498, condition: "good", notes: "2 reams damaged in transit" },
      { id: "gri-4", productId: "prod-9", productName: "Whiteboard Markers Set", sku: "OFF-002", orderedQuantity: 200, receivedQuantity: 200, condition: "good" },
    ],
    totalQuantity: 698, notes: "2 reams of paper damaged, claim filed with carrier",
    receivedBy: "Sarah Chen", receivedAt: "2024-02-07T10:00:00Z", createdAt: "2024-02-07T10:00:00Z"
  },
]

// Reorder Suggestions
export const mockReorderSuggestions: ReorderSuggestion[] = [
  { id: "rs-1", productId: "prod-6", productName: "32GB DDR5 RAM", sku: "HW-001", currentStock: 8, reorderLevel: 20, reorderQuantity: 50, preferredVendorId: "vnd-4", preferredVendorName: "Global Electronics", lastOrderDate: "2024-01-15", avgLeadTime: 7, priority: "critical" },
  { id: "rs-2", productId: "prod-8", productName: "27\" 4K Monitor", sku: "ELEC-003", currentStock: 0, reorderLevel: 10, reorderQuantity: 30, preferredVendorId: "vnd-4", preferredVendorName: "Global Electronics", lastOrderDate: "2024-01-20", avgLeadTime: 10, priority: "critical" },
  { id: "rs-3", productId: "prod-5", productName: "Ergonomic Office Chair", sku: "FURN-001", currentStock: 45, reorderLevel: 10, reorderQuantity: 25, preferredVendorId: "vnd-3", preferredVendorName: "Furniture World", lastOrderDate: "2024-02-01", avgLeadTime: 14, priority: "low" },
]

// Summary functions for operations
export function getInventorySummary() {
  const totalProducts = mockProducts.length
  const totalValue = mockProducts.reduce((sum, p) => sum + (p.stockQuantity * p.costPrice), 0)
  const lowStock = mockProducts.filter(p => p.stockQuantity <= p.reorderLevel && p.stockQuantity > 0).length
  const outOfStock = mockProducts.filter(p => p.stockQuantity === 0).length
  return { totalProducts, totalValue, lowStock, outOfStock }
}

export function getWarehouseSummary() {
  const totalWarehouses = mockWarehouses.filter(w => w.status === "active").length
  const totalCapacity = mockWarehouses.reduce((sum, w) => sum + w.capacity, 0)
  const usedCapacity = mockWarehouses.reduce((sum, w) => sum + w.usedCapacity, 0)
  const utilizationRate = Math.round((usedCapacity / totalCapacity) * 100)
  const pendingTransfers = mockStockTransfers.filter(t => t.status === "pending" || t.status === "in_transit").length
  return { totalWarehouses, totalCapacity, usedCapacity, utilizationRate, pendingTransfers }
}

export function getSalesSummary() {
  const totalOrders = mockSalesOrders.length
  const totalRevenue = mockSalesOrders.filter(o => o.paymentStatus === "paid").reduce((sum, o) => sum + o.total, 0)
  const pendingOrders = mockSalesOrders.filter(o => ["draft", "confirmed", "processing"].includes(o.status)).length
  const pendingQuotes = mockQuotes.filter(q => q.status === "sent" || q.status === "draft").length
  return { totalOrders, totalRevenue, pendingOrders, pendingQuotes }
}

export function getPurchaseSummary() {
  const totalOrders = mockPurchaseOrders.length
  const totalSpent = mockPurchaseOrders.filter(p => p.status === "received").reduce((sum, p) => sum + p.total, 0)
  const pendingOrders = mockPurchaseOrders.filter(p => ["draft", "sent", "confirmed"].includes(p.status)).length
  const pendingDeliveries = mockPurchaseOrders.filter(p => p.status === "confirmed" && p.receivingStatus !== "complete").length
  const reorderAlerts = mockReorderSuggestions.filter(r => r.priority === "critical" || r.priority === "high").length
  return { totalOrders, totalSpent, pendingOrders, pendingDeliveries, reorderAlerts }
}

// ============================================
