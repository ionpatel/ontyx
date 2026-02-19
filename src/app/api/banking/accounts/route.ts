import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
      return NextResponse.json({ accounts: [] })
    }

    const { data: accounts, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('organization_id', member.organization_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ 
      accounts: accounts?.map(a => ({
        id: a.id,
        institution: a.institution_name,
        accountName: a.account_name,
        accountNumber: a.account_number_last4,
        type: a.account_type,
        balance: a.balance / 100, // Convert from cents
        currency: a.currency,
        lastSync: a.last_synced_at,
        status: a.status
      })) || []
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
