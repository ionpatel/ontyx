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
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Get user's organization
        supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .single()
          .then(({ data }) => {
            setState({
              user: session.user,
              organizationId: data?.organization_id || null,
              loading: false,
            })
          })
      } else {
        setState({
          user: null,
          organizationId: null,
          loading: false,
        })
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single()
          
          setState({
            user: session.user,
            organizationId: data?.organization_id || null,
            loading: false,
          })
        } else {
          setState({
            user: null,
            organizationId: null,
            loading: false,
          })
        }
      }
    )

    return () => {
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
