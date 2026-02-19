'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './use-auth'

export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string | null
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  metadata: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user?: {
    id: string
    email: string
    full_name: string
    avatar_url: string | null
  }
}

interface UseAuditLogsOptions {
  action?: string
  entityType?: string
  userId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const { organizationId, loading: authLoading } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const { 
    action, 
    entityType, 
    userId, 
    startDate, 
    endDate,
    limit = 50,
    offset = 0,
  } = options

  const fetchLogs = useCallback(async () => {
    if (!organizationId || authLoading) return

    setLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(id, email, full_name, avatar_url)
        `, { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (action && action !== 'all') {
        query = query.eq('action', action)
      }
      if (entityType && entityType !== 'all') {
        query = query.eq('entity_type', entityType)
      }
      if (userId) {
        query = query.eq('user_id', userId)
      }
      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      setLogs(data || [])
      setTotalCount(count || 0)
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err)
      setError(err.message || 'Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }, [organizationId, authLoading, action, entityType, userId, startDate, endDate, limit, offset])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return {
    logs,
    loading: loading || authLoading,
    error,
    totalCount,
    refetch: fetchLogs,
  }
}

/**
 * Hook to create audit logs easily from components
 */
export function useCreateAuditLog() {
  const { organizationId, user } = useAuth()

  const createLog = useCallback(async (
    action: string,
    entityType: string,
    entityId?: string,
    changes?: { old?: Record<string, any>; new?: Record<string, any> },
    metadata?: Record<string, any>
  ) => {
    if (!organizationId || !user) return

    const supabase = createClient()

    try {
      await supabase.from('audit_logs').insert({
        organization_id: organizationId,
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        old_values: changes?.old || null,
        new_values: changes?.new || null,
        metadata: metadata || {},
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
      })
    } catch (err) {
      console.error('Failed to create audit log:', err)
    }
  }, [organizationId, user])

  return { createLog }
}

/**
 * Get summary stats for audit logs
 */
export function useAuditStats() {
  const { organizationId, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<{
    totalLogs: number
    todayLogs: number
    actionCounts: Record<string, number>
    entityCounts: Record<string, number>
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId || authLoading) return

    const fetchStats = async () => {
      setLoading(true)
      const supabase = createClient()

      try {
        // Get total count
        const { count: totalLogs } = await supabase
          .from('audit_logs')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)

        // Get today's count
        const today = new Date().toISOString().split('T')[0]
        const { count: todayLogs } = await supabase
          .from('audit_logs')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .gte('created_at', today)

        // Get recent logs for action/entity breakdown
        const { data: recentLogs } = await supabase
          .from('audit_logs')
          .select('action, entity_type')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(500)

        const actionCounts: Record<string, number> = {}
        const entityCounts: Record<string, number> = {}

        ;(recentLogs || []).forEach(log => {
          actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
          entityCounts[log.entity_type] = (entityCounts[log.entity_type] || 0) + 1
        })

        setStats({
          totalLogs: totalLogs || 0,
          todayLogs: todayLogs || 0,
          actionCounts,
          entityCounts,
        })
      } catch (err) {
        console.error('Failed to fetch audit stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [organizationId, authLoading])

  return { stats, loading: loading || authLoading }
}
