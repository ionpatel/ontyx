'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  organizationId: string | null
  loading: boolean
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    return useAuthState()
  }
  
  return context
}

function useAuthState(): AuthContextType {
  const [state, setState] = useState<AuthState>({
    user: null,
    organizationId: null,
    loading: true,
  })

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    async function initAuth() {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          if (mounted) setState({ user: null, organizationId: null, loading: false })
          return
        }

        if (!session?.user) {
          if (mounted) setState({ user: null, organizationId: null, loading: false })
          return
        }

        // Get organization membership
        const { data: orgData, error: orgError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .single()

        if (orgError) {
          console.error('Org membership error:', orgError)
        }

        if (mounted) {
          setState({
            user: session.user,
            organizationId: orgData?.organization_id || null,
            loading: false,
          })
        }
      } catch (err) {
        console.error('Auth init error:', err)
        if (mounted) setState({ user: null, organizationId: null, loading: false })
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event)
        
        if (session?.user) {
          const { data } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single()
          
          if (mounted) {
            setState({
              user: session.user,
              organizationId: data?.organization_id || null,
              loading: false,
            })
          }
        } else {
          if (mounted) {
            setState({
              user: null,
              organizationId: null,
              loading: false,
            })
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setState({ user: null, organizationId: null, loading: false })
  }

  return { ...state, signOut }
}

export { AuthContext }
export type { AuthContextType }
