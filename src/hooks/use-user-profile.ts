'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const cached = typeof window !== 'undefined' ? getCachedProfile() : null
  
  const [profile, setProfile] = useState<UserProfile | null>(cached)
  const [loading, setLoading] = useState(!cached) // Only loading if no cache
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const userId = user?.id 

  const fetchProfile = useCallback(async () => {
    if (authLoading) return // Wait for auth to stabilize
    
    if (!userId) {
      clearCachedProfile()
      setProfile(null)
      setLoading(false)
      return
    }
    
    // Don't set loading if we have cached data
    if (!profile) setLoading(true)
    setError(null)
    
    try {
      const data = await userProfileService.getProfile(userId)
      if (data) {
        setCachedProfile(data)
        setProfile(data)
      }
    } catch (err) {
      setError('Failed to fetch profile')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [userId, authLoading, profile])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

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

  return {
    profile,
    loading: loading && authLoading, // Only loading if BOTH are loading
    error,
    saving,
    refetch: fetchProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
  }
}
