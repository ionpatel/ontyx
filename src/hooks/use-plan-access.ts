'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { 
  PlanTier, 
  FeatureKey, 
  hasFeature, 
  canAccessRoute,
  getUpgradeMessage,
  getMinimumPlan 
} from '@/lib/plan-features'

interface UsePlanAccessReturn {
  tier: PlanTier
  loading: boolean
  hasFeature: (feature: FeatureKey) => boolean
  canAccessRoute: (pathname: string) => boolean
  getUpgradeMessage: (feature: FeatureKey) => string
  getMinimumPlan: (feature: FeatureKey) => PlanTier
}

export function usePlanAccess(): UsePlanAccessReturn {
  const { organizationId } = useAuth()
  const [tier, setTier] = useState<PlanTier>('starter')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrganizationTier() {
      if (!organizationId) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('organizations')
        .select('tier')
        .eq('id', organizationId)
        .single()

      if (!error && data?.tier) {
        setTier(data.tier as PlanTier)
      }
      setLoading(false)
    }

    fetchOrganizationTier()
  }, [organizationId])

  return {
    tier,
    loading,
    hasFeature: (feature: FeatureKey) => hasFeature(tier, feature),
    canAccessRoute: (pathname: string) => canAccessRoute(tier, pathname),
    getUpgradeMessage,
    getMinimumPlan,
  }
}

// Simple context-free check for middleware/server components
export async function checkPlanAccess(
  organizationId: string, 
  feature: FeatureKey
): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('organizations')
    .select('tier')
    .eq('id', organizationId)
    .single()

  const tier = (data?.tier as PlanTier) || 'starter'
  return hasFeature(tier, feature)
}
