'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// ============================================================================
// FAANG-STYLE AUTH: Instant hydration from cache, verify in background
// ============================================================================

const AUTH_CACHE_KEY = 'ontyx_auth_cache'

interface CachedAuth {
  userId: string
  email: string
  organizationId: string
  timestamp: number
}

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
  loading: false,
  initialized: false,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

// Cache helpers
function getCachedAuth(): CachedAuth | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY)
    if (!cached) return null
    const data = JSON.parse(cached) as CachedAuth
    // Cache valid for 24 hours
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(AUTH_CACHE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function setCachedAuth(userId: string, email: string, organizationId: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
      userId,
      email,
      organizationId,
      timestamp: Date.now(),
    }))
  } catch {}
}

function clearCachedAuth() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(AUTH_CACHE_KEY)
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // INSTANT: Check cache synchronously on mount
  const cached = typeof window !== 'undefined' ? getCachedAuth() : null
  
  const [state, setState] = useState<AuthState>({
    user: null,
    // Hydrate organizationId from cache INSTANTLY (no loading flash)
    organizationId: cached?.organizationId || null,
    // Only show loading on first visit (no cache)
    loading: !cached,
    initialized: !!cached,
  })

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    async function initAuth() {
      try {
        console.log('[AuthProvider] Getting session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          console.log('[AuthProvider] No session:', sessionError?.message || 'No user')
          clearCachedAuth()
          if (mounted) setState({ user: null, organizationId: null, loading: false, initialized: true })
          return
        }

        console.log('[AuthProvider] Session found, user:', session.user.id)

        // Fetch org membership
        const { data: orgData, error: orgError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .single()
        
        console.log('[AuthProvider] Org query result:', { orgData, orgError })

        const organizationId = orgData?.organization_id || null

        // Update cache for next refresh
        if (organizationId) {
          setCachedAuth(session.user.id, session.user.email || '', organizationId)
        }

        if (mounted) {
          setState({
            user: session.user,
            organizationId,
            loading: false,
            initialized: true,
          })
        }
      } catch (err) {
        console.error('Auth init error:', err)
        clearCachedAuth()
        if (mounted) setState({ user: null, organizationId: null, loading: false, initialized: true })
      }
    }

    // Start verification in background
    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          clearCachedAuth()
          if (mounted) setState({ user: null, organizationId: null, loading: false, initialized: true })
          return
        }

        if (session?.user) {
          const { data } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single()
          
          const organizationId = data?.organization_id || null
          
          if (organizationId) {
            setCachedAuth(session.user.id, session.user.email || '', organizationId)
          }
          
          if (mounted) {
            setState({
              user: session.user,
              organizationId,
              loading: false,
              initialized: true,
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
    clearCachedAuth()
    await supabase.auth.signOut()
    setState({ user: null, organizationId: null, loading: false, initialized: true })
  }

  return (
    <AuthContext.Provider value={{ ...state, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
