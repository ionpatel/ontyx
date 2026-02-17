import { createClient } from '@/lib/supabase/client'
import type { 
  Bill, 
  BillItem, 
  CreateBillInput, 
  UpdateBillInput,
  BillSummary,
  BillStatus
} from '@/types/bills'

// Generate bill number
async function generateBillNumber(organizationId: string): Promise<string> {
  const supabase = createClient()
  const year = new Date().getFullYear()
  const prefix = `BILL-${year}-`
  
  const { data } = await supabase
    .from('bills')
    .select('bill_number')
    .eq('organization_id', organizationId)
    .ilike('bill_number', `${prefix}%`)
    .order('bill_number', { ascending: false })
    .limit(1)
    .single()
  
  if (data?.bill_number) {
    const lastNum = parseInt(data.bill_number.replace(prefix, ''), 10) || 0
    return `${prefix}${String(lastNum + 1).padStart(4, '0')}`
  }
  return `${prefix}0001`
}

// Calculate totals from items
function calculateTotals(items: CreateBillInput['items']) {
  let subtotal = 0
  let taxAmount = 0
  
  for (const item of items) {
    const lineTotal = item.quantity * item.unit_price
    const lineTax = lineTotal * ((item.tax_rate || 0) / 100)
    subtotal += lineTotal
    taxAmount += lineTax
  }
  
  return {
    subtotal,
    tax_amount: taxAmount,
    total: subtotal + taxAmount
  }
}

// Get all bills
export async function getBills(organizationId: string): Promise<Bill[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('bills')
    .select(`
      *,
      contact:contacts!contact_id (
        id,
        display_name,
        email
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  // Update overdue status
  const today = new Date().toISOString().split('T')[0]
  return (data || []).map(bill => ({
    ...bill,
    status: bill.status === 'pending' && bill.due_date < today ? 'overdue' : bill.status
  }))
}

// Get single bill with items
export async function getBill(id: string): Promise<Bill | null> {
  const supabase = createClient()
  
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .select(`
      *,
      contact:contacts!contact_id (
        id,
        display_name,
        email,
        phone
      )
    `)
    .eq('id', id)
    .single()
  
  if (billError) throw billError
  if (!bill) return null
  
  // Get items
  const { data: items, error: itemsError } = await supabase
    .from('bill_items')
    .select('*')
    .eq('bill_id', id)
    .order('line_number')
  
  if (itemsError) throw itemsError
  
  return { ...bill, items: items || [] }
}

// Create bill
export async function createBill(
  organizationId: string,
  input: CreateBillInput
): Promise<Bill> {
  const supabase = createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // Generate bill number
  const billNumber = await generateBillNumber(organizationId)
  
  // Calculate totals
  const totals = calculateTotals(input.items)
  
  // Default due date: 30 days from bill date
  const billDate = input.bill_date || new Date().toISOString().split('T')[0]
  const dueDate = input.due_date || new Date(
    new Date(billDate).getTime() + 30 * 24 * 60 * 60 * 1000
  ).toISOString().split('T')[0]
  
  // Create bill
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .insert({
      organization_id: organizationId,
      bill_number: billNumber,
      contact_id: input.contact_id,
      bill_date: billDate,
      due_date: dueDate,
      vendor_ref: input.vendor_ref,
      currency: input.currency || 'CAD',
      notes: input.notes,
      status: 'pending',
      subtotal: totals.subtotal,
      tax_amount: totals.tax_amount,
      total: totals.total,
      amount_due: totals.total,
      amount_paid: 0,
      discount_amount: 0,
      created_by: user.id
    })
    .select()
    .single()
  
  if (billError) throw billError
  
  // Create items
  const itemsToInsert = input.items.map((item, index) => {
    const lineTotal = item.quantity * item.unit_price
    const taxAmount = lineTotal * ((item.tax_rate || 0) / 100)
    
    return {
      bill_id: bill.id,
      line_number: index + 1,
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate || 0,
      tax_amount: taxAmount,
      line_total: lineTotal + taxAmount,
      account_id: item.account_id
    }
  })
  
  const { error: itemsError } = await supabase
    .from('bill_items')
    .insert(itemsToInsert)
  
  if (itemsError) throw itemsError
  
  return getBill(bill.id) as Promise<Bill>
}

// Update bill
export async function updateBill(
  id: string,
  input: UpdateBillInput
): Promise<Bill> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('bills')
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
  
  if (error) throw error
  return getBill(id) as Promise<Bill>
}

// Update bill status
export async function updateBillStatus(
  id: string,
  status: BillStatus
): Promise<void> {
  const supabase = createClient()
  
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString()
  }
  
  // If approving, record approval
  if (status === 'approved') {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      updateData.approved_by = user.id
      updateData.approved_at = new Date().toISOString()
    }
  }
  
  const { error } = await supabase
    .from('bills')
    .update(updateData)
    .eq('id', id)
  
  if (error) throw error
}

// Record payment on bill
export async function recordBillPayment(
  id: string,
  amount: number
): Promise<void> {
  const supabase = createClient()
  
  // Get current bill
  const { data: bill, error: fetchError } = await supabase
    .from('bills')
    .select('amount_paid, total')
    .eq('id', id)
    .single()
  
  if (fetchError) throw fetchError
  
  const newAmountPaid = (bill.amount_paid || 0) + amount
  const newAmountDue = bill.total - newAmountPaid
  
  const status: BillStatus = newAmountDue <= 0 ? 'paid' : 'partial'
  
  const { error } = await supabase
    .from('bills')
    .update({
      amount_paid: newAmountPaid,
      amount_due: Math.max(0, newAmountDue),
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
  
  if (error) throw error
}

// Delete bill (only drafts)
export async function deleteBill(id: string): Promise<void> {
  const supabase = createClient()
  
  // Check status first
  const { data: bill } = await supabase
    .from('bills')
    .select('status')
    .eq('id', id)
    .single()
  
  if (bill?.status !== 'draft') {
    throw new Error('Only draft bills can be deleted')
  }
  
  // Items deleted via cascade
  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Get bill summary
export async function getBillSummary(organizationId: string): Promise<BillSummary> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('bills')
    .select('status, amount_due, due_date')
    .eq('organization_id', organizationId)
    .neq('status', 'void')
  
  if (error) throw error
  
  const bills = data || []
  const today = new Date().toISOString().split('T')[0]
  
  const pendingBills = bills.filter(b => 
    ['pending', 'approved', 'partial'].includes(b.status)
  )
  
  const overdueBills = pendingBills.filter(b => b.due_date < today)
  
  return {
    total_bills: bills.length,
    pending_count: pendingBills.length,
    overdue_count: overdueBills.length,
    total_payable: pendingBills.reduce((sum, b) => sum + (b.amount_due || 0), 0),
    overdue_amount: overdueBills.reduce((sum, b) => sum + (b.amount_due || 0), 0)
  }
}
