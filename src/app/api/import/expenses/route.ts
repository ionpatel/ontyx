import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface ColumnMapping {
  sourceColumn: string
  targetField: string
}

interface ImportRow {
  [key: string]: string
}

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

    const { rows, mappings } = await request.json() as { rows: ImportRow[], mappings: ColumnMapping[] }
    
    let success = 0
    let failed = 0
    const errors: string[] = []

    for (const row of rows) {
      try {
        const expense: Record<string, any> = {
          organization_id: member.organization_id,
          currency: 'CAD',
          status: 'approved', // Historical imports are assumed approved
          submitted_by: user.id,
          created_at: new Date().toISOString(),
        }

        for (const mapping of mappings) {
          const value = row[mapping.sourceColumn]?.trim()
          if (!value) continue

          switch (mapping.targetField) {
            case 'date':
              const date = parseDate(value)
              if (date) {
                expense.expense_date = date.toISOString().split('T')[0]
              }
              break
            case 'description':
              expense.description = value
              break
            case 'amount':
              const amount = parseFloat(value.replace(/[^0-9.-]/g, ''))
              if (!isNaN(amount)) {
                expense.total_amount = Math.abs(amount) // Store as decimal
                expense.subtotal = Math.abs(amount) // Same for now
              }
              break
            case 'category':
              // Look up or create expense category
              let { data: existingCat } = await supabase
                .from('expense_categories')
                .select('id')
                .eq('organization_id', member.organization_id)
                .ilike('name', value)
                .single()

              if (!existingCat) {
                const { data: newCat } = await supabase
                  .from('expense_categories')
                  .insert({
                    organization_id: member.organization_id,
                    name: value,
                    is_active: true,
                  })
                  .select('id')
                  .single()
                existingCat = newCat
              }

              if (existingCat) {
                expense.category_id = existingCat.id
              }
              break
            case 'vendor':
              expense.merchant = value
              
              // Optionally link to vendor contact
              const { data: vendor } = await supabase
                .from('contacts')
                .select('id')
                .eq('organization_id', member.organization_id)
                .eq('is_vendor', true)
                .ilike('display_name', value)
                .single()
              
              if (vendor) {
                expense.contact_id = vendor.id
              }
              break
            case 'payment_method':
              const methodLower = value.toLowerCase()
              if (methodLower.includes('cash')) {
                expense.payment_method = 'cash'
              } else if (methodLower.includes('credit') || methodLower.includes('card')) {
                expense.payment_method = 'credit_card'
              } else if (methodLower.includes('debit')) {
                expense.payment_method = 'debit'
              } else if (methodLower.includes('transfer') || methodLower.includes('eft')) {
                expense.payment_method = 'bank_transfer'
              } else if (methodLower.includes('cheque') || methodLower.includes('check')) {
                expense.payment_method = 'cheque'
              } else {
                expense.payment_method = 'other'
              }
              break
            case 'receipt_number':
              expense.receipt_number = value
              break
          }
        }

        // Validate required fields
        if (!expense.description) {
          throw new Error('Description is required')
        }
        if (!expense.total_amount) {
          throw new Error('Amount is required')
        }

        // Set defaults
        if (!expense.expense_date) {
          expense.expense_date = new Date().toISOString().split('T')[0]
        }
        if (!expense.payment_method) {
          expense.payment_method = 'other'
        }

        const { error } = await supabase.from('expenses').insert(expense)
        
        if (error) throw error
        success++
      } catch (err: any) {
        failed++
        const desc = row[mappings.find(m => m.targetField === 'description')?.sourceColumn || ''] || 'Unknown'
        errors.push(`"${desc.slice(0, 30)}": ${err.message}`)
      }
    }

    return NextResponse.json({ success, failed, errors: errors.slice(0, 10) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function parseDate(value: string): Date | null {
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/,
  ]

  for (const format of formats) {
    const match = value.match(format)
    if (match) {
      let year, month, day
      if (format === formats[0]) {
        [, year, month, day] = match
      } else {
        [, month, day, year] = match
        if (year.length === 2) year = '20' + year
      }
      
      const date = new Date(parseInt(year as string), parseInt(month as string) - 1, parseInt(day as string))
      if (!isNaN(date.getTime())) return date
    }
  }

  const parsed = Date.parse(value)
  return isNaN(parsed) ? null : new Date(parsed)
}
