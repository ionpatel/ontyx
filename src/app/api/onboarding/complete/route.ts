import { createClient } from '@supabase/supabase-js'
import { createClient as createBrowserClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Use service role for updates (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // Get user from session
    const supabase = await createBrowserClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const {
      businessName,
      businessType,
      businessSubtype,
      businessSize,
      province,
      enabledModules,
      tier
    } = body

    // Get user's organization from organization_members
    const { data: member, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (memberError || !member?.organization_id) {
      console.error('No organization found:', memberError)
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Update organization with service role (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from('organizations')
      .update({
        name: businessName,
        business_type: businessType,
        business_subtype: businessSubtype,
        business_size: businessSize,
        province: province,
        enabled_modules: enabledModules,
        tier: tier || 'starter',
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', member.organization_id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Onboarding complete error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
