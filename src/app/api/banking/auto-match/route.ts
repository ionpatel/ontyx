import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // Get unmatched transactions
    const { data: transactions } = await supabase
      .from('bank_transactions')
      .select(`
        id, transaction_date, description, amount,
        bank_account:bank_accounts!inner(organization_id)
      `)
      .eq('bank_account.organization_id', member.organization_id)
      .is('matched_invoice_id', null)
      .is('matched_expense_id', null)
      .is('matched_bill_id', null)

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ matched: 0 })
    }

    let matchedCount = 0

    for (const transaction of transactions) {
      const amount = transaction.amount
      const date = transaction.transaction_date
      const description = transaction.description.toLowerCase()

      // Try to match deposits to invoices (positive amounts)
      if (amount > 0) {
        const { data: invoices } = await supabase
          .from('invoices')
          .select('id, invoice_number')
          .eq('organization_id', member.organization_id)
          .eq('total', amount)
          .eq('status', 'sent')
          .gte('issue_date', subtractDays(date, 7))
          .lte('issue_date', addDays(date, 7))
          .limit(1)

        if (invoices && invoices.length > 0) {
          const invoice = invoices[0]
          
          await supabase
            .from('bank_transactions')
            .update({
              matched_invoice_id: invoice.id,
              matched_reference: invoice.invoice_number,
              category: 'Payment Received'
            })
            .eq('id', transaction.id)

          // Mark invoice as paid
          await supabase
            .from('invoices')
            .update({ status: 'paid', paid_at: transaction.transaction_date })
            .eq('id', invoice.id)

          matchedCount++
          continue
        }
      }

      // Try to match withdrawals to expenses (negative amounts)
      if (amount < 0) {
        const absAmount = Math.abs(amount)
        
        const { data: expenses } = await supabase
          .from('expenses')
          .select('id, title')
          .eq('organization_id', member.organization_id)
          .eq('amount', absAmount)
          .is('matched_transaction_id', null)
          .gte('expense_date', subtractDays(date, 7))
          .lte('expense_date', addDays(date, 7))
          .limit(1)

        if (expenses && expenses.length > 0) {
          const expense = expenses[0]
          
          await supabase
            .from('bank_transactions')
            .update({
              matched_expense_id: expense.id,
              matched_reference: expense.title,
              category: 'Expense'
            })
            .eq('id', transaction.id)

          await supabase
            .from('expenses')
            .update({ matched_transaction_id: transaction.id })
            .eq('id', expense.id)

          matchedCount++
          continue
        }

        // Try to match to bills
        const { data: bills } = await supabase
          .from('bills')
          .select('id, bill_number')
          .eq('organization_id', member.organization_id)
          .eq('total', absAmount)
          .eq('status', 'approved')
          .gte('bill_date', subtractDays(date, 7))
          .lte('bill_date', addDays(date, 7))
          .limit(1)

        if (bills && bills.length > 0) {
          const bill = bills[0]
          
          await supabase
            .from('bank_transactions')
            .update({
              matched_bill_id: bill.id,
              matched_reference: bill.bill_number,
              category: 'Bill Payment'
            })
            .eq('id', transaction.id)

          await supabase
            .from('bills')
            .update({ status: 'paid', paid_at: transaction.transaction_date })
            .eq('id', bill.id)

          matchedCount++
          continue
        }
      }

      // Auto-categorize based on description keywords
      const category = categorizeByDescription(description)
      if (category) {
        await supabase
          .from('bank_transactions')
          .update({ category })
          .eq('id', transaction.id)
      }
    }

    return NextResponse.json({ matched: matchedCount })
  } catch (err: any) {
    console.error('Auto-match error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function subtractDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function categorizeByDescription(description: string): string | null {
  const categoryKeywords: Record<string, string[]> = {
    'Bank Fees': ['fee', 'service charge', 'monthly fee', 'overdraft'],
    'Utilities': ['hydro', 'electricity', 'gas', 'water', 'rogers', 'bell', 'telus', 'fido'],
    'Software': ['adobe', 'microsoft', 'google', 'aws', 'shopify', 'quickbooks', 'zoom'],
    'Office Supplies': ['staples', 'office depot', 'amazon', 'costco business'],
    'Meals & Entertainment': ['restaurant', 'uber eats', 'skip', 'doordash', 'starbucks', 'tim hortons'],
    'Transportation': ['uber', 'lyft', 'taxi', 'parking', 'petro', 'esso', 'shell', 'presto'],
    'Insurance': ['insurance', 'manulife', 'sunlife', 'intact'],
    'Payroll': ['payroll', 'salary', 'wage', 'ceridian', 'adp'],
    'Rent': ['rent', 'lease', 'landlord'],
    'Marketing': ['facebook', 'google ads', 'marketing', 'advertising'],
  }

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => description.includes(kw))) {
      return category
    }
  }

  return null
}
