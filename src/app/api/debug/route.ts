import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase config' })
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {},
          remove() {},
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      return NextResponse.json({ 
        authenticated: false, 
        error: userError.message 
      })
    }
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'No user session' 
      })
    }

    // Get organization
    const { data: orgMember, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(name)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
      organization: orgMember || null,
      orgError: orgError?.message || null,
      profile: profile || null,
      profileError: profileError?.message || null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}
