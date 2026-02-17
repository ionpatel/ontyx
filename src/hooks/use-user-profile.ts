'use client'

import { useState, useEffect, useRef } from 'react'
import { userProfileService, type UserProfile, type UpdateProfileInput } from '@/services/user-profile'
import { useAuth } from '@/components/providers/auth-provider'

// Cache profile in localStorage for instant hydration
const PROFILE_CACHE_KEY = 'ontyx_profile_cache'

function getCachedProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY)
    if (!cached) return null
    return JSON.parse(cached) as UserProfile
  } catch {
    return null
  }
}

function setCachedProfile(profile: UserProfile) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile))
  } catch {}
}

function clearCachedProfile() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY)
  } catch {}
}

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth()
  
  // Hydrate from cache INSTANTLY
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      return getCachedProfile()
    }
    return null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Track if we've fetched to avoid double-fetch
  const hasFetched = useRef(false)

  const userId = user?.id

  // Fetch profile when auth is ready
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return
    
    // No user = no profile
    if (!userId) {
      clearCachedProfile()
      setProfile(null)
      setLoading(false)
      return
    }
    
    // Already fetched for this user
    if (hasFetched.current) return
    hasFetched.current = true
    
    async function fetchProfile() {
      setError(null)
      
      try {
        console.log('[useUserProfile] Fetching profile for:', userId)
        const data = await userProfileService.getProfile(userId)
        console.log('[useUserProfile] Got profile:', data)
        
        if (data) {
          setCachedProfile(data)
          setProfile(data)
        } else {
          // Profile fetch returned null - might be RLS issue
          console.warn('[useUserProfile] Profile returned null')
        }
      } catch (err) {
        setError('Failed to fetch profile')
        console.error('[useUserProfile] Error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProfile()
  }, [userId, authLoading])

  // Reset hasFetched when user changes
  useEffect(() => {
    hasFetched.current = false
  }, [userId])

  const updateProfile = async (updates: UpdateProfileInput): Promise<boolean> => {
    if (!userId) return false
    
    setSaving(true)
    setError(null)
    
    try {
      const updated = await userProfileService.updateProfile(userId, updates)
      if (updated) {
        setCachedProfile(updated)
        setProfile(updated)
        return true
      }
      return false
    } catch (err) {
      setError('Failed to update profile')
      console.error(err)
      return false
    } finally {
      setSaving(false)
    }
  }

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!userId) return null
    
    setSaving(true)
    
    try {
      const url = await userProfileService.uploadAvatar(userId, file)
      if (url && profile) {
        const updated = { ...profile, avatarUrl: url }
        setCachedProfile(updated)
        setProfile(updated)
      }
      return url
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      return null
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    setSaving(true)
    
    try {
      return await userProfileService.changePassword(currentPassword, newPassword)
    } finally {
      setSaving(false)
    }
  }

  const refetch = async () => {
    if (!userId) return
    hasFetched.current = false
    setLoading(true)
    
    try {
      const data = await userProfileService.getProfile(userId)
      if (data) {
        setCachedProfile(data)
        setProfile(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Show cached profile immediately, loading only if no cache AND auth/fetch in progress
  const isLoading = !profile && (authLoading || loading)

  return {
    profile,
    loading: isLoading,
    error,
    saving,
    refetch,
    updateProfile,
    uploadAvatar,
    changePassword,
  }
}
