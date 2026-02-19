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

    const { rows, keys } = await request.json() as { 
      rows: Record<string, any>[]
      keys: string[] 
    }

    const duplicates: { rowIndex: number; field: string; value: string; existingId: string }[] = []

    // Get all existing contacts for comparison
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('id, email, display_name, phone')
      .eq('organization_id', member.organization_id)

    if (!existingContacts) {
      return NextResponse.json({ duplicates: [] })
    }

    // Build lookup maps
    const emailMap = new Map<string, string>()
    const nameMap = new Map<string, string>()
    
    existingContacts.forEach(c => {
      if (c.email) emailMap.set(c.email.toLowerCase().trim(), c.id)
      if (c.display_name) nameMap.set(c.display_name.toLowerCase().trim(), c.id)
    })

    // Check each row
    rows.forEach((row) => {
      const rowIndex = row._rowIndex as number

      // Check email
      if (row.email) {
        const email = row.email.toLowerCase().trim()
        const existingId = emailMap.get(email)
        if (existingId) {
          duplicates.push({ rowIndex, field: 'email', value: row.email, existingId })
          return // Skip further checks for this row
        }
      }

      // Check name
      if (row.name) {
        const name = row.name.toLowerCase().trim()
        const existingId = nameMap.get(name)
        if (existingId) {
          duplicates.push({ rowIndex, field: 'name', value: row.name, existingId })
        }
      }
    })

    return NextResponse.json({ duplicates })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
