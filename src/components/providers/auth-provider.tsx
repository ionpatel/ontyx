'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// ============================================================================
// SESSION-LINKED AUTH PROVIDER
// Uses Supabase's encrypted session token for instant auth recovery
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

// Org cache - cleared on logout
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
    localStorage.removeItem('ontyx_auth_cache')
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

    async function initAuth() {
      try {
        // Supabase stores session in localStorage with encryption
        // getSession() recovers it if valid
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          // No valid session - clear all caches
          clearAuthCache()
          if (mounted) {
            setState({ 
              user: null, 
              organizationId: null, 
              loading: false, 
              initialized: true 
            })
          }
          return
        }

        // Session exists! User is authenticated
        // Check if we have cached org ID for instant load
        const cachedOrgId = getCachedOrgId()
        
        if (cachedOrgId) {
          // Instant load with cached org
          if (mounted) {
            setState({
              user: session.user,
              organizationId: cachedOrgId,
              loading: false,
              initialized: true,
            })
          }
          
          // Verify org membership in background (update if changed)
          const { data: orgData } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single()
          
          if (mounted && orgData?.organization_id && orgData.organization_id !== cachedOrgId) {
            setCachedOrgId(orgData.organization_id)
            setState(prev => ({ ...prev, organizationId: orgData.organization_id }))
          }
        } else {
          // No cache - fetch org membership
          const { data: orgData, error: orgError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single()

          const orgId = orgData?.organization_id || null
          
          if (orgId) {
            setCachedOrgId(orgId)
          }

          if (mounted) {
            setState({
              user: session.user,
              organizationId: orgId,
              loading: false,
              initialized: true,
            })
          }
        }
      } catch (err) {
        console.error('Auth init error:', err)
        clearAuthCache()
        if (mounted) {
          setState({ 
            user: null, 
            organizationId: null, 
            loading: false, 
            initialized: true 
          })
        }
      }
    }

    initAuth()

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State change:', event)
        
        if (event === 'SIGNED_OUT') {
          // Clear ALL cached data on logout
          clearAuthCache()
          if (mounted) {
            setState({ 
              user: null, 
              organizationId: null, 
              loading: false, 
              initialized: true 
            })
          }
          return
        }

        if (event === 'SIGNED_IN' && session?.user) {
          // New login - fetch fresh org data
          const { data } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single()
          
          const orgId = data?.organization_id || null
          if (orgId) {
            setCachedOrgId(orgId)
          }
          
          if (mounted) {
            setState({
              user: session.user,
              organizationId: orgId,
              loading: false,
              initialized: true,
            })
          }
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token refreshed - keep existing state, just update user
          if (mounted) {
            setState(prev => ({ ...prev, user: session.user }))
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
    // Clear cache BEFORE signing out
    clearAuthCache()
    await supabase.auth.signOut()
    setState({ 
      user: null, 
      organizationId: null, 
      loading: false, 
      initialized: true 
    })
  }

  return (
    <AuthContext.Provider value={{ ...state, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
