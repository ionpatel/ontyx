import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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

    const { rows } = await request.json() as { rows: Record<string, any>[] }

    const duplicates: { rowIndex: number; field: string; value: string; existingId: string }[] = []

    // Get all existing expenses for comparison (recent ones, last 2 years)
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    const { data: existingExpenses } = await supabase
      .from('expenses')
      .select('id, expense_date, total_amount, description')
      .eq('organization_id', member.organization_id)
      .gte('expense_date', twoYearsAgo.toISOString().split('T')[0])

    if (!existingExpenses) {
      return NextResponse.json({ duplicates: [] })
    }

    // Build lookup map: date + amount + description prefix
    const expenseMap = new Map<string, string>()
    
    existingExpenses.forEach(exp => {
      const key = `${exp.expense_date}|${exp.total_amount}|${exp.description?.toLowerCase().slice(0, 30) || ''}`
      expenseMap.set(key, exp.id)
    })

    // Check each row
    rows.forEach((row) => {
      const rowIndex = row._rowIndex as number

      // Check combination of date + amount + description
      if (row.date && row.amount) {
        // Parse date
        let dateStr = row.date
        const parsedDate = new Date(row.date)
        if (!isNaN(parsedDate.getTime())) {
          dateStr = parsedDate.toISOString().split('T')[0]
        }

        // Parse amount
        const amount = parseFloat((row.amount || '').replace(/[^0-9.-]/g, ''))
        
        const desc = (row.description || '').toLowerCase().slice(0, 30)
        const key = `${dateStr}|${amount}|${desc}`
        
        const existingId = expenseMap.get(key)
        if (existingId) {
          duplicates.push({ 
            rowIndex, 
            field: 'date+amount+description', 
            value: `${row.date} / ${row.amount} / ${row.description?.slice(0, 20)}...`,
            existingId 
          })
        }
      }
    })

    return NextResponse.json({ duplicates })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
