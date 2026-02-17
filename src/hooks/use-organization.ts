'use client'

import { useState, useEffect, useCallback } from 'react'
import { organizationService, type Organization, type UpdateOrganizationInput } from '@/services/organization'
import { useAuth } from '@/components/providers/auth-provider'

export function useOrganization() {
  const { organizationId, loading: authLoading } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchOrganization = useCallback(async () => {
    if (!organizationId) {
      setOrganization(null)
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await organizationService.getOrganization(organizationId)
      setOrganization(data)
    } catch (err) {
      setError('Failed to fetch organization')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (authLoading) return
    fetchOrganization()
  }, [fetchOrganization, authLoading])

  const updateOrganization = async (updates: UpdateOrganizationInput): Promise<boolean> => {
    if (!organizationId) return false
    
    setSaving(true)
    setError(null)
    
    try {
      const updated = await organizationService.updateOrganization(organizationId, updates)
      if (updated) {
        setOrganization(updated)
        return true
      }
      return false
    } catch (err) {
      setError('Failed to update organization')
      console.error(err)
      return false
    } finally {
      setSaving(false)
    }
  }

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!organizationId) return null
    
    setSaving(true)
    
    try {
      const url = await organizationService.uploadLogo(organizationId, file)
      if (url) {
        setOrganization(prev => prev ? { ...prev, logoUrl: url } : null)
      }
      return url
    } catch (err) {
      console.error('Failed to upload logo:', err)
      return null
    } finally {
      setSaving(false)
    }
  }

  return {
    organization,
    loading: loading || authLoading,
    error,
    saving,
    refetch: fetchOrganization,
    updateOrganization,
    uploadLogo,
  }
}
