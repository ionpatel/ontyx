'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export interface Organization {
  id: string
  name: string
  slug: string
  logoUrl?: string
  businessType?: string
  businessSubtype?: string
  businessSize?: 'solo' | 'small' | 'medium' | 'large'
  enabledModules: string[]
  onboardingCompleted: boolean
  province?: string
  currency: string
  timezone: string
}

export function useOrganization() {
  const { organizationId } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrganization = useCallback(async () => {
    if (!organizationId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

      if (error) throw error

      setOrganization({
        id: data.id,
        name: data.name,
        slug: data.slug,
        logoUrl: data.logo_url,
        businessType: data.business_type,
        businessSubtype: data.business_subtype,
        businessSize: data.business_size,
        enabledModules: data.enabled_modules || [],
        onboardingCompleted: data.onboarding_completed ?? false,
        province: data.province,
        currency: data.currency || 'CAD',
        timezone: data.timezone || 'America/Toronto',
      })
    } catch (err) {
      console.error('Error fetching organization:', err)
      setError('Failed to load organization')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchOrganization()
  }, [fetchOrganization])

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!organizationId) return null

    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('organizations')
        .update({
          name: updates.name,
          business_type: updates.businessType,
          business_subtype: updates.businessSubtype,
          business_size: updates.businessSize,
          enabled_modules: updates.enabledModules,
          onboarding_completed: updates.onboardingCompleted,
          province: updates.province,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId)
        .select()
        .single()

      if (error) throw error

      await fetchOrganization()
      return data
    } catch (err) {
      console.error('Error updating organization:', err)
      return null
    }
  }

  // Check if a module is enabled
  const isModuleEnabled = (moduleId: string): boolean => {
    // If no modules specified, show all (legacy behavior)
    if (!organization?.enabledModules?.length) return true
    return organization.enabledModules.includes(moduleId)
  }

  return {
    organization,
    loading,
    error,
    refetch: fetchOrganization,
    updateOrganization,
    isModuleEnabled,
    needsOnboarding: !loading && organization && !organization.onboardingCompleted,
  }
}
