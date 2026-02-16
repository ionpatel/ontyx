// ============================================================
// Common / Shared Types
// ============================================================

export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  exchange_rate: number
  is_base: boolean
  is_active: boolean
  decimal_places: number
  updated_at: string
}

export interface TaxRate {
  id: string
  name: string
  code: string
  rate: number
  description?: string
  is_compound: boolean
  is_active: boolean
  region?: string
  created_at: string
}

export interface FiscalYear {
  id: string
  name: string
  start_date: string
  end_date: string
  is_closed: boolean
  closed_at?: string
  closed_by?: string
  created_at: string
}

export interface UnitOfMeasure {
  id: string
  name: string
  abbreviation: string
  category?: string
  base_unit_id?: string
  conversion_factor: number
  is_active: boolean
}

export interface AuditLogEntry {
  id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  changed_fields?: string[]
  user_id?: string
  user_email?: string
  ip_address?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id?: string
  type: 'info' | 'warning' | 'error' | 'success'
  channel: 'in_app' | 'email' | 'sms'
  title: string
  message?: string
  link?: string
  is_read: boolean
  read_at?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface FileAttachment {
  id: string
  table_name: string
  record_id: string
  file_name: string
  file_path: string
  file_size?: number
  mime_type?: string
  uploaded_by?: string
  uploaded_by_name?: string
  created_at: string
}

// Activity Feed (dashboard)
export interface ActivityItem {
  id: string
  type: 'invoice' | 'payment' | 'order' | 'customer' | 'product' | 'expense' | 'payroll' | 'project'
  action?: string
  title: string
  description?: string
  amount?: number
  timestamp: string
  status?: 'success' | 'pending' | 'failed'
  user?: string
}

// KPI Summary
export interface KPISummary {
  totalRevenue: number
  revenueChange: number
  totalExpenses: number
  expensesChange: number
  netProfit: number
  profitChange: number
  outstandingInvoices: number
  invoicesChange: number
  cashBalance: number
  cashChange: number
  customersCount: number
  customersChange: number
  ordersCount: number
  ordersChange: number
  averageOrderValue: number
  aovChange: number
}

// Revenue
export interface RevenueDataPoint extends Record<string, unknown> {
  month: string
  year: number
  revenue: number
  expenses: number
  profit?: number
}

// Cash flow
export interface CashFlowData {
  date: string
  inflow: number
  outflow: number
  balance: number
}

// Expense category
export interface ExpenseCategory {
  name: string
  amount: number
  percentage: number
  color?: string
}

// Top customer
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

// Top product
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

// Pagination
export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// Service response
export interface ServiceResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}
