'use client'

import { useState, useEffect, useCallback } from 'react'
import { userProfileService, type UserProfile, type UpdateProfileInput } from '@/services/user-profile'
import { useAuth } from './use-auth'

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Use 'demo' as fallback for demo mode
  const userId = user?.id 

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await userProfileService.getProfile(userId)
      setProfile(data)
    } catch (err) {
      setError('Failed to fetch profile')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = async (updates: UpdateProfileInput): Promise<boolean> => {
    setSaving(true)
    setError(null)
    
    try {
      const updated = await userProfileService.updateProfile(userId, updates)
      if (updated) {
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
    setSaving(true)
    
    try {
      const url = await userProfileService.uploadAvatar(userId, file)
      if (url) {
        setProfile(prev => prev ? { ...prev, avatarUrl: url } : null)
      }
      return url
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      return null
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    setSaving(true)
    
    try {
      return await userProfileService.changePassword(newPassword)
    } finally {
      setSaving(false)
    }
  }

  return {
    profile,
    loading,
    error,
    saving,
    refetch: fetchProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
  }
}
