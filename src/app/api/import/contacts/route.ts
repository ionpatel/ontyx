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

    // Get user's organization
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
        // Build contact object from mappings
        const contact: Record<string, any> = {
          organization_id: member.organization_id,
          is_active: true,
          created_at: new Date().toISOString(),
        }

        for (const mapping of mappings) {
          const value = row[mapping.sourceColumn]?.trim()
          if (!value) continue

          switch (mapping.targetField) {
            case 'name':
              contact.display_name = value
              // Try to split into first/last name
              const parts = value.split(' ')
              if (parts.length >= 2) {
                contact.first_name = parts[0]
                contact.last_name = parts.slice(1).join(' ')
              } else {
                contact.first_name = value
              }
              break
            case 'email':
              contact.email = value.toLowerCase()
              break
            case 'phone':
              contact.phone = value
              break
            case 'company':
              contact.company_name = value
              break
            case 'address':
              contact.billing_address_line1 = value
              break
            case 'city':
              contact.billing_city = value
              break
            case 'province':
              // Normalize province codes
              const provinceMap: Record<string, string> = {
                'ontario': 'ON', 'on': 'ON',
                'quebec': 'QC', 'qc': 'QC',
                'british columbia': 'BC', 'bc': 'BC',
                'alberta': 'AB', 'ab': 'AB',
                'manitoba': 'MB', 'mb': 'MB',
                'saskatchewan': 'SK', 'sk': 'SK',
                'nova scotia': 'NS', 'ns': 'NS',
                'new brunswick': 'NB', 'nb': 'NB',
                'newfoundland': 'NL', 'nl': 'NL',
                'prince edward island': 'PE', 'pei': 'PE', 'pe': 'PE',
                'northwest territories': 'NT', 'nt': 'NT',
                'yukon': 'YT', 'yt': 'YT',
                'nunavut': 'NU', 'nu': 'NU',
              }
              contact.billing_state = provinceMap[value.toLowerCase()] || value.toUpperCase().slice(0, 2)
              break
            case 'postal_code':
              contact.billing_postal_code = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
              break
            case 'type':
              const typeLower = value.toLowerCase()
              contact.is_customer = typeLower.includes('customer') || typeLower.includes('client')
              contact.is_vendor = typeLower.includes('vendor') || typeLower.includes('supplier')
              if (!contact.is_customer && !contact.is_vendor) {
                contact.is_customer = true // Default to customer
              }
              break
            case 'notes':
              contact.notes = value
              break
          }
        }

        // Validate required fields
        if (!contact.display_name) {
          throw new Error('Name is required')
        }

        // Default to customer if type not specified
        if (contact.is_customer === undefined && contact.is_vendor === undefined) {
          contact.is_customer = true
        }

        const { error } = await supabase.from('contacts').insert(contact)
        
        if (error) throw error
        success++
      } catch (err: any) {
        failed++
        const name = row[mappings.find(m => m.targetField === 'name')?.sourceColumn || ''] || 'Unknown'
        errors.push(`Row "${name}": ${err.message}`)
      }
    }

    return NextResponse.json({ success, failed, errors: errors.slice(0, 10) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
