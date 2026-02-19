import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
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
      return NextResponse.json({ transactions: [] })
    }

    let query = supabase
      .from('bank_transactions')
      .select(`
        *,
        bank_account:bank_accounts!inner(organization_id)
      `)
      .eq('bank_account.organization_id', member.organization_id)
      .order('transaction_date', { ascending: false })
      .limit(100)

    if (accountId) {
      query = query.eq('bank_account_id', accountId)
    }
    
    if (startDate) {
      query = query.gte('transaction_date', startDate)
    }
    
    if (endDate) {
      query = query.lte('transaction_date', endDate)
    }

    const { data: transactions, error } = await query

    if (error) throw error

    return NextResponse.json({ 
      transactions: transactions?.map(t => ({
        id: t.id,
        date: t.transaction_date,
        description: t.description,
        amount: t.amount / 100,
        type: t.amount >= 0 ? 'credit' : 'debit',
        category: t.category,
        matched: !!t.matched_invoice_id || !!t.matched_expense_id || !!t.matched_bill_id,
        matchedTo: t.matched_invoice_id 
          ? { type: 'invoice', id: t.matched_invoice_id, number: t.matched_reference }
          : t.matched_expense_id
            ? { type: 'expense', id: t.matched_expense_id, number: t.matched_reference }
            : t.matched_bill_id
              ? { type: 'bill', id: t.matched_bill_id, number: t.matched_reference }
              : null,
        accountId: t.bank_account_id
      })) || []
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
