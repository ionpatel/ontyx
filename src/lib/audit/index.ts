/**
 * Audit Logging System
 * ====================
 * Track all user actions for compliance and security
 */

import { createClient } from '@/lib/supabase/client'
import type { AuditAction } from '@/types/auth'

interface AuditLogParams {
  organizationId: string
  userId: string
  action: AuditAction
  resourceType: string
  resourceId?: string
  details?: Record<string, any>
}

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  organizationId,
  userId,
  action,
  resourceType,
  resourceId,
  details = {},
}: AuditLogParams) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: null, // Set by server if available
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
      })
    
    if (error) {
      console.error('Failed to create audit log:', error)
    }
  } catch (err) {
    console.error('Audit log error:', err)
  }
}

/**
 * Get audit logs for an organization
 */
export async function getAuditLogs(
  organizationId: string,
  options: {
    limit?: number
    offset?: number
    action?: AuditAction
    resourceType?: string
    userId?: string
    startDate?: string
    endDate?: string
  } = {}
) {
  const supabase = createClient()
  const { 
    limit = 50, 
    offset = 0, 
    action, 
    resourceType, 
    userId,
    startDate,
    endDate,
  } = options

  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      user:user_profiles(id, email, full_name, avatar_url)
    `, { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (action) {
    query = query.eq('action', action)
  }
  if (resourceType) {
    query = query.eq('resource_type', resourceType)
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

  const { data, error, count } = await query

  return { data, error, count }
}

/**
 * Audit log action descriptions
 */
export const auditActionLabels: Record<AuditAction, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  view: 'Viewed',
  export: 'Exported',
  login: 'Logged in',
  logout: 'Logged out',
  invite: 'Invited user',
  role_change: 'Changed role',
  settings_change: 'Changed settings',
}

/**
 * Resource type labels
 */
export const resourceTypeLabels: Record<string, string> = {
  invoice: 'Invoice',
  contact: 'Contact',
  product: 'Product',
  order: 'Sales Order',
  purchase: 'Purchase Order',
  employee: 'Employee',
  payroll: 'Payroll',
  project: 'Project',
  report: 'Report',
  settings: 'Settings',
  user: 'User',
  organization: 'Organization',
}

/**
 * Hook for easy audit logging in components
 */
export function useAuditLog(organizationId: string, userId: string) {
  const log = (
    action: AuditAction,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ) => {
    createAuditLog({
      organizationId,
      userId,
      action,
      resourceType,
      resourceId,
      details,
    })
  }

  return { log }
}
