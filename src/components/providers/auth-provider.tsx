'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// ============================================================================
// AUTH PROVIDER - Event-driven (onAuthStateChange is primary)
// ============================================================================

interface AuthState {
  user: User | null
  organizationId: string | null
  loading: boolean
  initialized: boolean
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  organizationId: null,
  loading: true,
  initialized: false,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

const ORG_CACHE_KEY = 'ontyx_org_id'

function getCachedOrgId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(ORG_CACHE_KEY)
  } catch {
    return null
  }
}

function setCachedOrgId(orgId: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ORG_CACHE_KEY, orgId)
  } catch {}
}

function clearAuthCache() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(ORG_CACHE_KEY)
    localStorage.removeItem('ontyx_profile_cache')
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    organizationId: null,
    loading: true,
    initialized: false,
  })

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    // Helper to fetch org ID
    async function fetchOrgId(userId: string): Promise<string | null> {
      // Check cache first
      const cached = getCachedOrgId()
      if (cached) return cached

      // Fetch from DB
      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single()

        if (error) return null

        const orgId = data?.organization_id || null
        if (orgId) setCachedOrgId(orgId)
        return orgId
      } catch {
        return null
      }
    }

    // Helper to update state with user
    async function setAuthenticatedState(user: User) {
      const orgId = await fetchOrgId(user.id)
      if (mounted) {
        setState({
          user,
          organizationId: orgId,
          loading: false,
          initialized: true,
        })
      }
    }

    // Listen for auth state changes - this is the PRIMARY handler
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          clearAuthCache()
          if (mounted) {
            setState({
              user: null,
              organizationId: null,
              loading: false,
              initialized: true,
            })
          }
          return
        }

        // User is authenticated (SIGNED_IN, INITIAL_SESSION, TOKEN_REFRESHED)
        if (session.user) {
          await setAuthenticatedState(session.user)
        }
      }
    )

    // Cleanup
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    clearAuthCache()
    await supabase.auth.signOut()
    setState({
      user: null,
      organizationId: null,
      loading: false,
      initialized: true,
    })
  }

  return (
    <AuthContext.Provider value={{ ...state, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
