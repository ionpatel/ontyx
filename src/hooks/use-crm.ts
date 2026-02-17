'use client'

import { useState, useEffect, useCallback } from 'react'
import * as crmService from '@/services/crm'
import { useAuth } from '@/components/providers/auth-provider'
import type { 
  Lead, 
  Opportunity,
  PipelineStage,
  CreateLeadInput, 
  UpdateLeadInput,
  CreateOpportunityInput,
  UpdateOpportunityInput,
  CRMSummary,
  LeadStatus,
  Activity
} from '@/types/crm'

// =============================================================================
// LEADS
// =============================================================================

export function useLeads() {
  const { organizationId, loading: authLoading } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    if (!organizationId) {
      setLeads([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await crmService.getLeads(organizationId)
      setLeads(data)
    } catch (err) {
      setError('Failed to fetch leads')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (authLoading) return
    fetchLeads()
  }, [fetchLeads, authLoading])

  return {
    data: leads,
    isLoading: loading || authLoading,
    error,
    refetch: fetchLeads
  }
}

export function useLead(id: string | undefined) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLead = useCallback(async () => {
    if (!id) {
      setLead(null)
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const data = await crmService.getLead(id)
      setLead(data)
    } catch (err) {
      setError('Failed to fetch lead')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchLead()
  }, [fetchLead])

  return { data: lead, isLoading: loading, error, refetch: fetchLead }
}

export function useCreateLead() {
  const { organizationId } = useAuth()
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (input: CreateLeadInput): Promise<Lead> => {
    if (!organizationId) throw new Error('No organization')
    setIsPending(true)
    try {
      return await crmService.createLead(organizationId, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useUpdateLead() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ id, input }: { id: string; input: UpdateLeadInput }): Promise<Lead> => {
    setIsPending(true)
    try {
      return await crmService.updateLead(id, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useUpdateLeadStatus() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ id, status }: { id: string; status: LeadStatus }): Promise<void> => {
    setIsPending(true)
    try {
      await crmService.updateLeadStatus(id, status)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useDeleteLead() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (id: string): Promise<void> => {
    setIsPending(true)
    try {
      await crmService.deleteLead(id)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useConvertLead() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ 
    leadId, 
    createOpportunity, 
    opportunityData 
  }: { 
    leadId: string
    createOpportunity?: boolean
    opportunityData?: { name: string; amount?: number; expected_close?: string }
  }): Promise<{ contactId: string; opportunityId?: string }> => {
    setIsPending(true)
    try {
      return await crmService.convertLead(leadId, createOpportunity, opportunityData)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

// =============================================================================
// PIPELINE
// =============================================================================

export function usePipelineStages() {
  const { organizationId, loading: authLoading } = useAuth()
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStages = useCallback(async () => {
    if (!organizationId) {
      setStages([])
      setLoading(false)
      return
    }
    
    try {
      const data = await crmService.getPipelineStages(organizationId)
      setStages(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (authLoading) return
    fetchStages()
  }, [fetchStages, authLoading])

  return { data: stages, isLoading: loading }
}

// =============================================================================
// OPPORTUNITIES
// =============================================================================

export function useOpportunities() {
  const { organizationId, loading: authLoading } = useAuth()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOpportunities = useCallback(async () => {
    if (!organizationId) {
      setOpportunities([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const data = await crmService.getOpportunities(organizationId)
      setOpportunities(data)
    } catch (err) {
      setError('Failed to fetch opportunities')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (authLoading) return
    fetchOpportunities()
  }, [fetchOpportunities, authLoading])

  return { data: opportunities, isLoading: loading, error, refetch: fetchOpportunities }
}

export function useOpportunity(id: string | undefined) {
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOpportunity = useCallback(async () => {
    if (!id) {
      setOpportunity(null)
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const data = await crmService.getOpportunity(id)
      setOpportunity(data)
    } catch (err) {
      setError('Failed to fetch opportunity')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchOpportunity()
  }, [fetchOpportunity])

  return { data: opportunity, isLoading: loading, error, refetch: fetchOpportunity }
}

export function useCreateOpportunity() {
  const { organizationId } = useAuth()
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (input: CreateOpportunityInput): Promise<Opportunity> => {
    if (!organizationId) throw new Error('No organization')
    setIsPending(true)
    try {
      return await crmService.createOpportunity(organizationId, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useUpdateOpportunity() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async ({ id, input }: { id: string; input: UpdateOpportunityInput }): Promise<Opportunity> => {
    setIsPending(true)
    try {
      return await crmService.updateOpportunity(id, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export function useDeleteOpportunity() {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (id: string): Promise<void> => {
    setIsPending(true)
    try {
      await crmService.deleteOpportunity(id)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

// =============================================================================
// ACTIVITIES
// =============================================================================

export function useActivities(entityType?: string, entityId?: string) {
  const { organizationId, loading: authLoading } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    if (!organizationId) {
      setActivities([])
      setLoading(false)
      return
    }
    
    try {
      const data = await crmService.getActivities(organizationId, entityType, entityId)
      setActivities(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId, entityType, entityId])

  useEffect(() => {
    if (authLoading) return
    fetchActivities()
  }, [fetchActivities, authLoading])

  return { data: activities, isLoading: loading, refetch: fetchActivities }
}

export function useCreateActivity() {
  const { organizationId } = useAuth()
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (input: Partial<Activity>): Promise<Activity> => {
    if (!organizationId) throw new Error('No organization')
    setIsPending(true)
    try {
      return await crmService.createActivity(organizationId, input)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

// =============================================================================
// SUMMARY
// =============================================================================

export function useCRMSummary() {
  const { organizationId, loading: authLoading } = useAuth()
  const [summary, setSummary] = useState<CRMSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    if (!organizationId) {
      setSummary(null)
      setLoading(false)
      return
    }
    
    try {
      const data = await crmService.getCRMSummary(organizationId)
      setSummary(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (authLoading) return
    fetchSummary()
  }, [fetchSummary, authLoading])

  return { data: summary, isLoading: loading }
}
