'use client'

import { useState, useEffect, useCallback } from 'react'
import { organizationService, type Organization, type UpdateOrganizationInput } from '@/services/organization'
import { useAuth } from './use-auth'

export function useOrganization() {
  const { organizationId } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Use 'demo' as fallback for demo mode
  const effectiveOrgId = organizationId 

  const fetchOrganization = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await organizationService.getOrganization(effectiveOrgId)
      setOrganization(data)
    } catch (err) {
      setError('Failed to fetch organization')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [effectiveOrgId])

  useEffect(() => {
    fetchOrganization()
  }, [fetchOrganization])

  const updateOrganization = async (updates: UpdateOrganizationInput): Promise<boolean> => {
    setSaving(true)
    setError(null)
    
    try {
      const updated = await organizationService.updateOrganization(effectiveOrgId, updates)
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
    setSaving(true)
    
    try {
      const url = await organizationService.uploadLogo(effectiveOrgId, file)
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
    loading,
    error,
    saving,
    refetch: fetchOrganization,
    updateOrganization,
    uploadLogo,
  }
}
