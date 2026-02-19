import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface Anomaly {
  type: 'duplicate' | 'unusual_amount' | 'unusual_vendor' | 'missing_receipt' | 'round_number' | 'weekend_expense' | 'unusual_time'
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  expenseId?: string
  transactionId?: string
  amount?: number
  suggestion: string
}

export async function GET() {
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
      return NextResponse.json({ anomalies: [] })
    }

    // Get recent expenses for analysis
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('organization_id', member.organization_id)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days
      .order('created_at', { ascending: false })

    if (!expenses || expenses.length === 0) {
      return NextResponse.json({ anomalies: [] })
    }

    const anomalies: Anomaly[] = []

    // 1. Detect potential duplicates
    const duplicates = detectDuplicates(expenses)
    anomalies.push(...duplicates)

    // 2. Detect unusual amounts (outliers)
    const unusualAmounts = detectUnusualAmounts(expenses)
    anomalies.push(...unusualAmounts)

    // 3. Detect round numbers (potential estimates/fraud)
    const roundNumbers = detectRoundNumbers(expenses)
    anomalies.push(...roundNumbers)

    // 4. Detect missing receipts for high-value expenses
    const missingReceipts = detectMissingReceipts(expenses)
    anomalies.push(...missingReceipts)

    // 5. Detect weekend expenses (unusual for B2B)
    const weekendExpenses = detectWeekendExpenses(expenses)
    anomalies.push(...weekendExpenses)

    // Sort by severity
    const severityOrder = { high: 0, medium: 1, low: 2 }
    anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    return NextResponse.json({ 
      anomalies,
      summary: {
        total: anomalies.length,
        high: anomalies.filter(a => a.severity === 'high').length,
        medium: anomalies.filter(a => a.severity === 'medium').length,
        low: anomalies.filter(a => a.severity === 'low').length,
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function detectDuplicates(expenses: any[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  const seen = new Map<string, any[]>()

  for (const expense of expenses) {
    // Key by amount + date (same day, same amount = potential duplicate)
    const dateStr = expense.expense_date?.split('T')[0] || expense.created_at?.split('T')[0]
    const key = `${expense.amount}-${dateStr}`
    
    if (!seen.has(key)) {
      seen.set(key, [])
    }
    seen.get(key)!.push(expense)
  }

  for (const [key, group] of seen.entries()) {
    if (group.length > 1) {
      const amount = group[0].amount / 100
      anomalies.push({
        type: 'duplicate',
        severity: amount > 100 ? 'high' : 'medium',
        title: `Potential duplicate payment`,
        description: `${group.length} expenses of $${amount.toFixed(2)} on the same day`,
        expenseId: group[0].id,
        amount: group[0].amount,
        suggestion: 'Review these expenses to ensure they are not duplicates'
      })
    }
  }

  return anomalies
}

function detectUnusualAmounts(expenses: any[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  // Group by category and calculate averages
  const byCategory = new Map<string, number[]>()
  
  for (const expense of expenses) {
    const category = expense.category || 'uncategorized'
    if (!byCategory.has(category)) {
      byCategory.set(category, [])
    }
    byCategory.get(category)!.push(expense.amount)
  }

  // Find outliers (> 3 standard deviations from mean)
  for (const expense of expenses) {
    const category = expense.category || 'uncategorized'
    const amounts = byCategory.get(category)!
    
    if (amounts.length < 5) continue // Need enough data
    
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const stdDev = Math.sqrt(amounts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / amounts.length)
    
    if (stdDev > 0 && expense.amount > mean + 2.5 * stdDev) {
      const amountDollars = expense.amount / 100
      const meanDollars = mean / 100
      
      anomalies.push({
        type: 'unusual_amount',
        severity: expense.amount > mean + 3 * stdDev ? 'high' : 'medium',
        title: `Unusually high ${category} expense`,
        description: `$${amountDollars.toFixed(2)} is ${((expense.amount / mean - 1) * 100).toFixed(0)}% above average ($${meanDollars.toFixed(2)})`,
        expenseId: expense.id,
        amount: expense.amount,
        suggestion: 'Verify this expense amount is correct and properly documented'
      })
    }
  }

  return anomalies
}

function detectRoundNumbers(expenses: any[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  for (const expense of expenses) {
    const amount = expense.amount / 100
    
    // Flag large round numbers ($500, $1000, etc.)
    if (amount >= 100 && amount % 100 === 0) {
      anomalies.push({
        type: 'round_number',
        severity: amount >= 500 ? 'medium' : 'low',
        title: `Round number expense`,
        description: `$${amount.toFixed(2)} for "${expense.title || expense.description}"`,
        expenseId: expense.id,
        amount: expense.amount,
        suggestion: 'Round numbers may indicate estimates. Attach receipt to verify actual amount.'
      })
    }
  }

  return anomalies.slice(0, 5) // Limit to avoid noise
}

function detectMissingReceipts(expenses: any[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  for (const expense of expenses) {
    const amount = expense.amount / 100
    
    // CRA requires receipts for expenses over $75 (stricter: $50)
    if (amount >= 50 && !expense.receipt_url && !expense.receipt_number) {
      anomalies.push({
        type: 'missing_receipt',
        severity: amount >= 75 ? 'high' : 'medium',
        title: `Missing receipt for $${amount.toFixed(2)} expense`,
        description: `"${expense.title || expense.description}" has no attached receipt`,
        expenseId: expense.id,
        amount: expense.amount,
        suggestion: 'CRA requires documentation for expenses. Upload receipt to ensure deductibility.'
      })
    }
  }

  return anomalies.slice(0, 10) // Limit
}

function detectWeekendExpenses(expenses: any[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  const businessCategories = ['Office Expenses', 'Professional Fees', 'Rent', 'Utilities']
  
  for (const expense of expenses) {
    const dateStr = expense.expense_date || expense.created_at
    if (!dateStr) continue
    
    const date = new Date(dateStr)
    const day = date.getDay()
    
    // Saturday = 6, Sunday = 0
    if ((day === 0 || day === 6) && businessCategories.includes(expense.category)) {
      const amount = expense.amount / 100
      
      anomalies.push({
        type: 'weekend_expense',
        severity: 'low',
        title: `Weekend business expense`,
        description: `$${amount.toFixed(2)} ${expense.category} on ${day === 0 ? 'Sunday' : 'Saturday'}`,
        expenseId: expense.id,
        amount: expense.amount,
        suggestion: 'Verify this expense date is correct'
      })
    }
  }

  return anomalies.slice(0, 3)
}
