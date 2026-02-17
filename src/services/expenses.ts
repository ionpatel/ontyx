import { createClient } from '@/lib/supabase/client'

// =============================================================================
// TYPES
// =============================================================================

export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed' | 'cancelled'
export type PaymentMethod = 'personal' | 'company_card' | 'cash' | 'petty_cash'

export interface ExpenseCategory {
  id: string
  organizationId: string
  name: string
  code?: string
  description?: string
  expenseAccountId?: string
  requiresReceiptAbove: number
  maxAmount?: number
  isActive: boolean
}

export interface Expense {
  id: string
  organizationId: string
  employeeId?: string
  submittedBy: string
  expenseNumber?: string
  categoryId?: string
  categoryName?: string
  description: string
  merchant?: string
  expenseDate: string
  location?: string
  currency: string
  subtotal: number
  gstHstAmount: number
  pstAmount: number
  tipAmount: number
  totalAmount: number
  vendorTaxNumber?: string
  paymentMethod: PaymentMethod
  isBillable: boolean
  projectId?: string
  contactId?: string
  receiptUrl?: string
  receiptVerified: boolean
  status: ExpenseStatus
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  reimbursedAt?: string
  reimbursementMethod?: string
  reimbursementReference?: string
  reportId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateExpenseInput {
  categoryId?: string
  description: string
  merchant?: string
  expenseDate: string
  location?: string
  subtotal: number
  gstHstAmount?: number
  pstAmount?: number
  tipAmount?: number
  vendorTaxNumber?: string
  paymentMethod?: PaymentMethod
  isBillable?: boolean
  projectId?: string
  contactId?: string
  receiptUrl?: string
  notes?: string
}

export interface ExpenseStats {
  totalExpenses: number
  pendingApproval: number
  approvedThisMonth: number
  reimbursedThisMonth: number
  totalAmountPending: number
  totalAmountApproved: number
}

// =============================================================================
// SERVICE
// =============================================================================

export const expensesService = {
  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------
  
  async getCategories(organizationId: string): Promise<ExpenseCategory[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.error('Error fetching expense categories:', error)
      return []
    }
    
    return (data || []).map(mapCategoryFromDb)
  },
  
  async createCategory(input: { name: string; code?: string; description?: string }, organizationId: string): Promise<ExpenseCategory | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('expense_categories')
      .insert({
        organization_id: organizationId,
        name: input.name,
        code: input.code,
        description: input.description,
        is_active: true,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating expense category:', error)
      return null
    }
    
    return mapCategoryFromDb(data)
  },
  
  async seedDefaultCategories(organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    const defaults = [
      { code: 'TRAVEL', name: 'Travel', description: 'Flights, hotels, transportation' },
      { code: 'MEALS', name: 'Meals & Entertainment', description: 'Business meals, client entertainment' },
      { code: 'OFFICE', name: 'Office Supplies', description: 'Stationery, printer supplies' },
      { code: 'SOFTWARE', name: 'Software & Subscriptions', description: 'SaaS, licenses, subscriptions' },
      { code: 'PROF', name: 'Professional Services', description: 'Legal, accounting, consulting' },
      { code: 'MARKETING', name: 'Marketing & Advertising', description: 'Ads, promo materials' },
      { code: 'UTILITIES', name: 'Utilities', description: 'Phone, internet, utilities' },
      { code: 'EQUIPMENT', name: 'Equipment', description: 'Hardware, tools, machinery' },
      { code: 'FUEL', name: 'Fuel & Vehicle', description: 'Gas, parking, vehicle expenses' },
      { code: 'OTHER', name: 'Other', description: 'Miscellaneous expenses' },
    ]
    
    const { error } = await supabase
      .from('expense_categories')
      .insert(defaults.map(d => ({
        organization_id: organizationId,
        ...d,
        is_active: true,
      })))
    
    if (error) {
      console.error('Error seeding expense categories:', error)
      return false
    }
    
    return true
  },
  
  // ---------------------------------------------------------------------------
  // Expenses
  // ---------------------------------------------------------------------------
  
  async getExpenses(organizationId: string, filters?: {
    status?: ExpenseStatus
    categoryId?: string
    employeeId?: string
    startDate?: string
    endDate?: string
  }): Promise<Expense[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('expenses')
      .select(`
        *,
        category:expense_categories(name)
      `)
      .eq('organization_id', organizationId)
      .order('expense_date', { ascending: false })
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }
    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId)
    }
    if (filters?.startDate) {
      query = query.gte('expense_date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('expense_date', filters.endDate)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching expenses:', error)
      return []
    }
    
    return (data || []).map(row => ({
      ...mapExpenseFromDb(row),
      categoryName: row.category?.name,
    }))
  },
  
  async getExpense(id: string, organizationId: string): Promise<Expense | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:expense_categories(name)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()
    
    if (error) {
      console.error('Error fetching expense:', error)
      return null
    }
    
    return {
      ...mapExpenseFromDb(data),
      categoryName: data.category?.name,
    }
  },
  
  async createExpense(input: CreateExpenseInput, organizationId: string, userId: string, employeeId?: string): Promise<Expense | null> {
    const supabase = createClient()
    
    // Calculate total
    const total = (input.subtotal || 0) + 
                  (input.gstHstAmount || 0) + 
                  (input.pstAmount || 0) + 
                  (input.tipAmount || 0)
    
    // Generate expense number
    const expenseNumber = `EXP-${Date.now().toString(36).toUpperCase()}`
    
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        organization_id: organizationId,
        submitted_by: userId,
        employee_id: employeeId,
        expense_number: expenseNumber,
        category_id: input.categoryId,
        description: input.description,
        merchant: input.merchant,
        expense_date: input.expenseDate,
        location: input.location,
        subtotal: input.subtotal,
        gst_hst_amount: input.gstHstAmount || 0,
        pst_amount: input.pstAmount || 0,
        tip_amount: input.tipAmount || 0,
        total_amount: total,
        vendor_tax_number: input.vendorTaxNumber,
        payment_method: input.paymentMethod || 'personal',
        is_billable: input.isBillable || false,
        project_id: input.projectId,
        contact_id: input.contactId,
        receipt_url: input.receiptUrl,
        notes: input.notes,
        status: 'draft',
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating expense:', error)
      return null
    }
    
    return mapExpenseFromDb(data)
  },
  
  async updateExpense(id: string, input: Partial<CreateExpenseInput>, organizationId: string): Promise<Expense | null> {
    const supabase = createClient()
    
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    
    if (input.categoryId !== undefined) updates.category_id = input.categoryId
    if (input.description !== undefined) updates.description = input.description
    if (input.merchant !== undefined) updates.merchant = input.merchant
    if (input.expenseDate !== undefined) updates.expense_date = input.expenseDate
    if (input.location !== undefined) updates.location = input.location
    if (input.subtotal !== undefined) updates.subtotal = input.subtotal
    if (input.gstHstAmount !== undefined) updates.gst_hst_amount = input.gstHstAmount
    if (input.pstAmount !== undefined) updates.pst_amount = input.pstAmount
    if (input.tipAmount !== undefined) updates.tip_amount = input.tipAmount
    if (input.vendorTaxNumber !== undefined) updates.vendor_tax_number = input.vendorTaxNumber
    if (input.paymentMethod !== undefined) updates.payment_method = input.paymentMethod
    if (input.isBillable !== undefined) updates.is_billable = input.isBillable
    if (input.projectId !== undefined) updates.project_id = input.projectId
    if (input.contactId !== undefined) updates.contact_id = input.contactId
    if (input.receiptUrl !== undefined) updates.receipt_url = input.receiptUrl
    if (input.notes !== undefined) updates.notes = input.notes
    
    // Recalculate total if amounts changed
    if (input.subtotal !== undefined || input.gstHstAmount !== undefined || 
        input.pstAmount !== undefined || input.tipAmount !== undefined) {
      // Get current values for any not provided
      const { data: current } = await supabase
        .from('expenses')
        .select('subtotal, gst_hst_amount, pst_amount, tip_amount')
        .eq('id', id)
        .single()
      
      if (current) {
        updates.total_amount = 
          (input.subtotal ?? current.subtotal) +
          (input.gstHstAmount ?? current.gst_hst_amount) +
          (input.pstAmount ?? current.pst_amount) +
          (input.tipAmount ?? current.tip_amount)
      }
    }
    
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating expense:', error)
      return null
    }
    
    return mapExpenseFromDb(data)
  },
  
  async submitExpense(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('expenses')
      .update({ 
        status: 'submitted',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('status', 'draft')
    
    if (error) {
      console.error('Error submitting expense:', error)
      return false
    }
    
    return true
  },
  
  async approveExpense(id: string, organizationId: string, approverId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('expenses')
      .update({ 
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('status', 'submitted')
    
    if (error) {
      console.error('Error approving expense:', error)
      return false
    }
    
    return true
  },
  
  async rejectExpense(id: string, organizationId: string, approverId: string, reason: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('expenses')
      .update({ 
        status: 'rejected',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('status', 'submitted')
    
    if (error) {
      console.error('Error rejecting expense:', error)
      return false
    }
    
    return true
  },
  
  async reimburseExpense(id: string, organizationId: string, method: string, reference?: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('expenses')
      .update({ 
        status: 'reimbursed',
        reimbursed_at: new Date().toISOString(),
        reimbursement_method: method,
        reimbursement_reference: reference,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .eq('status', 'approved')
    
    if (error) {
      console.error('Error reimbursing expense:', error)
      return false
    }
    
    return true
  },
  
  async deleteExpense(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)
      .in('status', ['draft', 'rejected'])
    
    if (error) {
      console.error('Error deleting expense:', error)
      return false
    }
    
    return true
  },
  
  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------
  
  async getStats(organizationId: string): Promise<ExpenseStats> {
    const supabase = createClient()
    
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('expenses')
      .select('status, total_amount, approved_at, reimbursed_at')
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error fetching expense stats:', error)
      return {
        totalExpenses: 0,
        pendingApproval: 0,
        approvedThisMonth: 0,
        reimbursedThisMonth: 0,
        totalAmountPending: 0,
        totalAmountApproved: 0,
      }
    }
    
    const expenses = data || []
    
    return {
      totalExpenses: expenses.length,
      pendingApproval: expenses.filter(e => e.status === 'submitted').length,
      approvedThisMonth: expenses.filter(e => 
        e.status === 'approved' && e.approved_at && e.approved_at >= monthStart
      ).length,
      reimbursedThisMonth: expenses.filter(e => 
        e.status === 'reimbursed' && e.reimbursed_at && e.reimbursed_at >= monthStart
      ).length,
      totalAmountPending: expenses
        .filter(e => e.status === 'submitted')
        .reduce((sum, e) => sum + (e.total_amount || 0), 0),
      totalAmountApproved: expenses
        .filter(e => e.status === 'approved')
        .reduce((sum, e) => sum + (e.total_amount || 0), 0),
    }
  },
}

// =============================================================================
// MAPPERS
// =============================================================================

function mapCategoryFromDb(row: any): ExpenseCategory {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    code: row.code,
    description: row.description,
    expenseAccountId: row.expense_account_id,
    requiresReceiptAbove: row.requires_receipt_above || 25,
    maxAmount: row.max_amount,
    isActive: row.is_active,
  }
}

function mapExpenseFromDb(row: any): Expense {
  return {
    id: row.id,
    organizationId: row.organization_id,
    employeeId: row.employee_id,
    submittedBy: row.submitted_by,
    expenseNumber: row.expense_number,
    categoryId: row.category_id,
    description: row.description,
    merchant: row.merchant,
    expenseDate: row.expense_date,
    location: row.location,
    currency: row.currency || 'CAD',
    subtotal: row.subtotal || 0,
    gstHstAmount: row.gst_hst_amount || 0,
    pstAmount: row.pst_amount || 0,
    tipAmount: row.tip_amount || 0,
    totalAmount: row.total_amount || 0,
    vendorTaxNumber: row.vendor_tax_number,
    paymentMethod: row.payment_method || 'personal',
    isBillable: row.is_billable || false,
    projectId: row.project_id,
    contactId: row.contact_id,
    receiptUrl: row.receipt_url,
    receiptVerified: row.receipt_verified || false,
    status: row.status || 'draft',
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    rejectionReason: row.rejection_reason,
    reimbursedAt: row.reimbursed_at,
    reimbursementMethod: row.reimbursement_method,
    reimbursementReference: row.reimbursement_reference,
    reportId: row.report_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default expensesService
