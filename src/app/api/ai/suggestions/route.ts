import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface Suggestion {
  type: 'tax_tip' | 'savings' | 'deadline' | 'action' | 'insight'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: { label: string; href: string }
  savingsEstimate?: number
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
      return NextResponse.json({ suggestions: [] })
    }

    const suggestions: Suggestion[] = []
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Get financial data for analysis
    const [expensesRes, invoicesRes, orgRes] = await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .eq('organization_id', member.organization_id)
        .gte('expense_date', `${currentYear}-01-01`),
      supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', member.organization_id)
        .eq('status', 'sent'),
      supabase
        .from('organizations')
        .select('*')
        .eq('id', member.organization_id)
        .single()
    ])

    const expenses = expensesRes.data || []
    const unpaidInvoices = invoicesRes.data || []
    const org = orgRes.data

    // 1. Tax deadline reminders (Canadian specific)
    const taxDeadlines = getTaxDeadlines(currentMonth)
    suggestions.push(...taxDeadlines)

    // 2. HST/GST filing reminder
    if (currentMonth % 3 === 0) { // Quarterly
      suggestions.push({
        type: 'deadline',
        priority: 'high',
        title: 'HST/GST Filing Due Soon',
        description: 'Quarterly HST/GST return is due at the end of this month',
        action: { label: 'View Tax Summary', href: '/reports?tab=tax' }
      })
    }

    // 3. Overdue invoices
    const overdueAmount = unpaidInvoices
      .filter(inv => new Date(inv.due_date) < now)
      .reduce((sum, inv) => sum + (inv.total || 0), 0) / 100

    if (overdueAmount > 0) {
      suggestions.push({
        type: 'action',
        priority: 'high',
        title: `$${overdueAmount.toFixed(2)} in overdue invoices`,
        description: 'Send payment reminders to improve cash flow',
        action: { label: 'View Overdue', href: '/invoices?status=overdue' }
      })
    }

    // 4. Year-end tax planning (November-December)
    if (currentMonth >= 10) {
      const ytdExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0) / 100
      
      suggestions.push({
        type: 'tax_tip',
        priority: 'medium',
        title: 'Year-End Tax Planning',
        description: `YTD expenses: $${ytdExpenses.toFixed(0)}. Consider accelerating deductible purchases before Dec 31.`,
        action: { label: 'Tax Planning Tips', href: '/reports?tab=tax' }
      })
    }

    // 5. Home office deduction reminder
    if (!expenses.some(e => e.category?.toLowerCase().includes('home office'))) {
      suggestions.push({
        type: 'savings',
        priority: 'medium',
        title: 'Claiming Home Office Expenses?',
        description: 'If you work from home, you may be able to deduct a portion of rent, utilities, and internet.',
        savingsEstimate: 2000,
        action: { label: 'Learn More', href: '/knowledge/home-office-deduction' }
      })
    }

    // 6. Vehicle expense tracking
    const vehicleExpenses = expenses.filter(e => 
      e.category?.toLowerCase().includes('vehicle') || 
      e.description?.toLowerCase().includes('gas') ||
      e.description?.toLowerCase().includes('parking')
    )
    
    if (vehicleExpenses.length > 0 && vehicleExpenses.length < 10) {
      suggestions.push({
        type: 'tax_tip',
        priority: 'low',
        title: 'Track Vehicle Mileage',
        description: 'For maximum CRA deductions, maintain a mileage log alongside fuel receipts.',
        action: { label: 'Add Mileage Entry', href: '/expenses/new?category=vehicle' }
      })
    }

    // 7. Uncategorized expenses
    const uncategorized = expenses.filter(e => !e.category).length
    if (uncategorized > 5) {
      suggestions.push({
        type: 'action',
        priority: 'medium',
        title: `${uncategorized} uncategorized expenses`,
        description: 'Categorize expenses for accurate tax reporting and deductions.',
        action: { label: 'Categorize Now', href: '/expenses?filter=uncategorized' }
      })
    }

    // 8. CPP/EI reminder for self-employed
    if (org?.business_size === 'solo') {
      suggestions.push({
        type: 'insight',
        priority: 'low',
        title: 'Self-Employed CPP Contributions',
        description: 'Remember: self-employed individuals pay both employee and employer CPP portions (11.9% for 2024).',
        action: { label: 'Calculate CPP', href: '/payroll/cpp-calculator' }
      })
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    return NextResponse.json({ suggestions: suggestions.slice(0, 8) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function getTaxDeadlines(currentMonth: number): Suggestion[] {
  const deadlines: Suggestion[] = []
  
  // Canadian tax deadlines
  const taxCalendar: Record<number, { title: string; description: string }[]> = {
    0: [{ // January
      title: 'T4 Slips Due Feb 28',
      description: 'Prepare T4 slips for employees by end of February'
    }],
    1: [{ // February
      title: 'T4 Filing Deadline',
      description: 'T4 slips must be filed with CRA and provided to employees by Feb 28'
    }],
    2: [{ // March
      title: 'RRSP Deadline Passed',
      description: 'RRSP contributions for previous tax year were due Mar 1'
    }],
    3: [{ // April
      title: 'Personal Tax Filing Due Apr 30',
      description: 'T1 personal income tax returns due April 30'
    }],
    5: [{ // June
      title: 'Self-Employed Tax Deadline',
      description: 'Self-employed individuals have until June 15 to file (but taxes owed still due Apr 30)'
    }]
  }

  const monthDeadlines = taxCalendar[currentMonth]
  if (monthDeadlines) {
    for (const deadline of monthDeadlines) {
      deadlines.push({
        type: 'deadline',
        priority: 'high',
        title: deadline.title,
        description: deadline.description,
        action: { label: 'Prepare Now', href: '/reports?tab=tax' }
      })
    }
  }

  return deadlines
}
