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

    // Get all existing invoices for comparison
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .eq('organization_id', member.organization_id)

    if (!existingInvoices) {
      return NextResponse.json({ duplicates: [] })
    }

    // Build lookup map
    const invoiceNumMap = new Map<string, string>()
    
    existingInvoices.forEach(inv => {
      if (inv.invoice_number) {
        invoiceNumMap.set(inv.invoice_number.toLowerCase().trim(), inv.id)
      }
    })

    // Check each row
    rows.forEach((row) => {
      const rowIndex = row._rowIndex as number

      // Check invoice number (primary identifier)
      if (row.invoice_number) {
        const invNum = row.invoice_number.toLowerCase().trim()
        const existingId = invoiceNumMap.get(invNum)
        if (existingId) {
          duplicates.push({ rowIndex, field: 'invoice_number', value: row.invoice_number, existingId })
        }
      }
    })

    return NextResponse.json({ duplicates })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
