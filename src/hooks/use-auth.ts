'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  organizationId: string | null
  loading: boolean
  isConfigured: boolean
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  
  // If not in context, create standalone auth state
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
    isConfigured: false,
  })

  useEffect(() => {
    const supabase = createClient()
    const configured = isSupabaseConfigured()
    
    if (!supabase || !configured) {
      setState({
        user: null,
        organizationId: null,
        loading: false,
        isConfigured: false,
      })
      return
    }

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
              isConfigured: true,
            })
          })
      } else {
        setState({
          user: null,
          organizationId: null,
          loading: false,
          isConfigured: true,
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
            isConfigured: true,
          })
        } else {
          setState({
            user: null,
            organizationId: null,
            loading: false,
            isConfigured: true,
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
    if (supabase) {
      await supabase.auth.signOut()
    }
    setState(prev => ({ ...prev, user: null, organizationId: null }))
  }

  return { ...state, signOut }
}

export { AuthContext }
export type { AuthContextType }
