// Bills (Accounts Payable) Types

export type BillStatus = 'draft' | 'pending' | 'approved' | 'partial' | 'paid' | 'overdue' | 'void'

export interface Bill {
  id: string
  organization_id: string
  bill_number: string
  vendor_ref?: string
  contact_id: string
  bill_date: string
  due_date: string
  currency: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  total: number
  amount_paid: number
  amount_due: number
  status: BillStatus
  approved_by?: string
  approved_at?: string
  notes?: string
  expense_account_id?: string
  ap_account_id?: string
  paid_at?: string
  created_by?: string
  created_at: string
  updated_at: string
  // Joined data
  contact?: {
    id: string
    display_name: string
    email?: string
  }
  items?: BillItem[]
}

export interface BillItem {
  id: string
  bill_id: string
  line_number: number
  product_id?: string
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
  tax_amount: number
  line_total: number
  account_id?: string
  created_at: string
}

export interface CreateBillInput {
  contact_id: string
  bill_date?: string
  due_date?: string
  vendor_ref?: string
  currency?: string
  notes?: string
  items: {
    product_id?: string
    description: string
    quantity: number
    unit_price: number
    tax_rate?: number
    account_id?: string
  }[]
}

export interface UpdateBillInput {
  vendor_ref?: string
  due_date?: string
  notes?: string
}

export interface BillSummary {
  total_bills: number
  pending_count: number
  overdue_count: number
  total_payable: number
  overdue_amount: number
}
