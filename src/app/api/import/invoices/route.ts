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
        const invoice: Record<string, any> = {
          organization_id: member.organization_id,
          currency: 'CAD',
          created_by: user.id,
          created_at: new Date().toISOString(),
        }

        let customerName = ''

        for (const mapping of mappings) {
          const value = row[mapping.sourceColumn]?.trim()
          if (!value) continue

          switch (mapping.targetField) {
            case 'invoice_number':
              invoice.invoice_number = value
              break
            case 'customer_name':
              customerName = value
              break
            case 'date':
              // Parse various date formats
              const date = parseDate(value)
              if (date) {
                invoice.issue_date = date.toISOString().split('T')[0]
              }
              break
            case 'due_date':
              const dueDate = parseDate(value)
              if (dueDate) {
                invoice.due_date = dueDate.toISOString().split('T')[0]
              }
              break
            case 'total':
              const total = parseFloat(value.replace(/[^0-9.-]/g, ''))
              if (!isNaN(total)) {
                invoice.total = total
                invoice.subtotal = total / 1.13 // Assume HST was included
                invoice.tax_amount = total - invoice.subtotal
                invoice.amount_due = total
              }
              break
            case 'status':
              const statusLower = value.toLowerCase()
              if (statusLower.includes('paid') || statusLower.includes('complete')) {
                invoice.status = 'paid'
              } else if (statusLower.includes('sent') || statusLower.includes('pending')) {
                invoice.status = 'sent'
              } else if (statusLower.includes('overdue') || statusLower.includes('late')) {
                invoice.status = 'overdue'
              } else if (statusLower.includes('draft')) {
                invoice.status = 'draft'
              } else {
                invoice.status = 'paid' // Assume historical invoices are paid
              }
              break
          }
        }

        // Validate required fields
        if (!invoice.invoice_number) {
          throw new Error('Invoice number is required')
        }
        if (!customerName) {
          throw new Error('Customer name is required')
        }
        if (!invoice.total) {
          throw new Error('Total amount is required')
        }

        // Look up or create customer
        let { data: contact } = await supabase
          .from('contacts')
          .select('id')
          .eq('organization_id', member.organization_id)
          .ilike('display_name', customerName)
          .single()

        if (!contact) {
          // Create contact
          const { data: newContact } = await supabase
            .from('contacts')
            .insert({
              organization_id: member.organization_id,
              display_name: customerName,
              first_name: customerName.split(' ')[0],
              last_name: customerName.split(' ').slice(1).join(' ') || '',
              is_customer: true,
              is_active: true,
            })
            .select('id')
            .single()
          contact = newContact
        }

        if (contact) {
          invoice.contact_id = contact.id
        }

        // Set defaults
        if (!invoice.issue_date) {
          invoice.issue_date = new Date().toISOString().split('T')[0]
        }
        if (!invoice.due_date) {
          const due = new Date(invoice.issue_date)
          due.setDate(due.getDate() + 30)
          invoice.due_date = due.toISOString().split('T')[0]
        }
        if (!invoice.status) {
          invoice.status = 'paid'
        }

        const { error } = await supabase.from('invoices').insert(invoice)
        
        if (error) throw error
        success++
      } catch (err: any) {
        failed++
        const invNum = row[mappings.find(m => m.targetField === 'invoice_number')?.sourceColumn || ''] || 'Unknown'
        errors.push(`Invoice "${invNum}": ${err.message}`)
      }
    }

    return NextResponse.json({ success, failed, errors: errors.slice(0, 10) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function parseDate(value: string): Date | null {
  // Try various formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, // M/D/YY or M/D/YYYY
  ]

  for (const format of formats) {
    const match = value.match(format)
    if (match) {
      let year, month, day
      if (format === formats[0]) {
        [, year, month, day] = match
      } else if (format === formats[1]) {
        [, month, day, year] = match
      } else if (format === formats[2]) {
        [, day, month, year] = match
      } else {
        [, month, day, year] = match
        if (year.length === 2) {
          year = '20' + year
        }
      }
      
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      if (!isNaN(date.getTime())) {
        return date
      }
    }
  }

  // Fallback to Date.parse
  const parsed = Date.parse(value)
  return isNaN(parsed) ? null : new Date(parsed)
}
