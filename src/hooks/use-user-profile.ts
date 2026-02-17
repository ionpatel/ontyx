'use client'

import { useState, useEffect, useRef } from 'react'
import { userProfileService, type UserProfile, type UpdateProfileInput } from '@/services/user-profile'
import { useAuth } from '@/components/providers/auth-provider'

// ============================================================================
// USER PROFILE HOOK
// Caches profile in localStorage for faster loads
// ============================================================================

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
  const { user, loading: authLoading, initialized } = useAuth()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  const hasFetched = useRef(false)
  const previousUserId = useRef<string | null>(null)
  const userId = user?.id || null

  // Handle user change (login/logout)
  useEffect(() => {
    // User logged out
    if (previousUserId.current && !userId) {
      clearCachedProfile()
      setProfile(null)
      setLoading(false)
      hasFetched.current = false
    }
    
    // User changed (different account)
    if (userId && previousUserId.current && userId !== previousUserId.current) {
      clearCachedProfile()
      setProfile(null)
      hasFetched.current = false
    }
    
    previousUserId.current = userId
  }, [userId])

  // Load profile when auth is ready
  useEffect(() => {
    // Wait for auth to initialize
    if (!initialized) return
    
    // No user = no profile
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }
    
    // Try to load from cache first
    const cached = getCachedProfile()
    if (cached && cached.id === userId) {
      setProfile(cached)
      setLoading(false)
      
      // Still verify in background
      if (!hasFetched.current) {
        hasFetched.current = true
        userProfileService.getProfile(userId).then(data => {
          if (data) {
            setCachedProfile(data)
            setProfile(data)
          }
        }).catch(console.error)
      }
      return
    }
    
    // No cache - fetch fresh
    if (hasFetched.current) return
    hasFetched.current = true
    
    async function fetchProfile() {
      setError(null)
      setLoading(true)
      
      try {
        const data = await userProfileService.getProfile(userId!)
        
        if (data) {
          setCachedProfile(data)
          setProfile(data)
        }
      } catch (err) {
        setError('Failed to fetch profile')
        console.error('[useUserProfile] Error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProfile()
  }, [userId, initialized])

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

  return {
    profile,
    loading: !initialized || loading,
    error,
    saving,
    refetch,
    updateProfile,
    uploadAvatar,
    changePassword,
  }
}
