'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './context'
import type { 
  Organization, 
  OrganizationMember, 
  UserRole,
  RolePermissions,
  Permission,
  DEFAULT_ROLE_PERMISSIONS 
} from '@/types/auth'

interface OrganizationContextType {
  organization: Organization | null
  membership: OrganizationMember | null
  organizations: Organization[]
  loading: boolean
  permissions: RolePermissions | null
  switchOrganization: (orgId: string) => Promise<void>
  createOrganization: (data: Partial<Organization>) => Promise<{ data: Organization | null, error: Error | null }>
  updateOrganization: (updates: Partial<Organization>) => Promise<{ error: Error | null }>
  hasPermission: (module: keyof RolePermissions, level: Permission) => boolean
  canAccess: (module: string) => boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

// Permission level hierarchy
const permissionLevels: Permission[] = ['none', 'view', 'edit', 'full']

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [membership, setMembership] = useState<OrganizationMember | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState<RolePermissions | null>(null)
  
  const supabase = createClient()

  // Load user's organizations
  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      setOrganization(null)
      setMembership(null)
      setOrganizations([])
      setPermissions(null)
      setLoading(false)
      return
    }

    const loadOrganizations = async () => {
      setLoading(true)
      
      try {
        // Get user's organization memberships
        const { data: memberships, error } = await supabase
          .from('organization_members')
          .select(`
            *,
            organization:organizations(*)
          `)
          .eq('user_id', user.id)
          .not('accepted_at', 'is', null)

        if (error) throw error

        const orgs = memberships
          ?.map(m => m.organization)
          .filter(Boolean) as Organization[]
        
        setOrganizations(orgs || [])

        // Get last used organization from localStorage or use first one
        const lastOrgId = localStorage.getItem('ontyx_current_org')
        const currentMembership = memberships?.find(
          m => m.organization_id === lastOrgId
        ) || memberships?.[0]

        if (currentMembership) {
          setOrganization(currentMembership.organization as Organization)
          setMembership(currentMembership)
          setPermissions(getPermissionsForRole(currentMembership.role))
          localStorage.setItem('ontyx_current_org', currentMembership.organization_id)
        }
      } catch (error) {
        console.error('Error loading organizations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrganizations()
  }, [user, authLoading, supabase])

  // Get permissions for a role
  const getPermissionsForRole = (role: UserRole): RolePermissions => {
    // In production, this could be customized per organization
    const rolePermissions: Record<UserRole, RolePermissions> = {
      owner: {
        dashboard: 'full',
        inventory: 'full',
        invoices: 'full',
        accounting: 'full',
        contacts: 'full',
        sales: 'full',
        purchases: 'full',
        crm: 'full',
        employees: 'full',
        payroll: 'full',
        projects: 'full',
        pos: 'full',
        reports: 'full',
        settings: 'full',
        can_invite_users: true,
        can_manage_roles: true,
        can_delete_org: true,
        can_export_data: true,
        can_access_api: true,
      },
      admin: {
        dashboard: 'full',
        inventory: 'full',
        invoices: 'full',
        accounting: 'full',
        contacts: 'full',
        sales: 'full',
        purchases: 'full',
        crm: 'full',
        employees: 'full',
        payroll: 'full',
        projects: 'full',
        pos: 'full',
        reports: 'full',
        settings: 'edit',
        can_invite_users: true,
        can_manage_roles: true,
        can_delete_org: false,
        can_export_data: true,
        can_access_api: true,
      },
      manager: {
        dashboard: 'full',
        inventory: 'edit',
        invoices: 'edit',
        accounting: 'view',
        contacts: 'edit',
        sales: 'edit',
        purchases: 'edit',
        crm: 'edit',
        employees: 'view',
        payroll: 'none',
        projects: 'edit',
        pos: 'full',
        reports: 'view',
        settings: 'view',
        can_invite_users: false,
        can_manage_roles: false,
        can_delete_org: false,
        can_export_data: true,
        can_access_api: false,
      },
      member: {
        dashboard: 'view',
        inventory: 'edit',
        invoices: 'edit',
        accounting: 'none',
        contacts: 'edit',
        sales: 'edit',
        purchases: 'view',
        crm: 'edit',
        employees: 'none',
        payroll: 'none',
        projects: 'edit',
        pos: 'full',
        reports: 'none',
        settings: 'none',
        can_invite_users: false,
        can_manage_roles: false,
        can_delete_org: false,
        can_export_data: false,
        can_access_api: false,
      },
      viewer: {
        dashboard: 'view',
        inventory: 'view',
        invoices: 'view',
        accounting: 'view',
        contacts: 'view',
        sales: 'view',
        purchases: 'view',
        crm: 'view',
        employees: 'none',
        payroll: 'none',
        projects: 'view',
        pos: 'none',
        reports: 'view',
        settings: 'none',
        can_invite_users: false,
        can_manage_roles: false,
        can_delete_org: false,
        can_export_data: false,
        can_access_api: false,
      },
    }
    return rolePermissions[role]
  }

  const switchOrganization = useCallback(async (orgId: string) => {
    const newMembership = organizations.find(o => o.id === orgId)
    if (newMembership) {
      // Re-fetch the membership to get role
      const { data } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId)
        .eq('user_id', user?.id)
        .single()
      
      if (data) {
        setOrganization(newMembership)
        setMembership(data)
        setPermissions(getPermissionsForRole(data.role))
        localStorage.setItem('ontyx_current_org', orgId)
      }
    }
  }, [organizations, supabase, user?.id])

  const createOrganization = useCallback(async (data: Partial<Organization>) => {
    if (!user) return { data: null, error: new Error('Not authenticated') }

    try {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-'),
          industry: data.industry,
          province: data.province,
          timezone: data.timezone || 'America/Toronto',
          currency: data.currency || 'CAD',
          fiscal_year_start: data.fiscal_year_start || 1,
          settings: data.settings || {},
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Add user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
          accepted_at: new Date().toISOString(),
        })

      if (memberError) throw memberError

      // Update local state
      setOrganizations(prev => [...prev, org])
      setOrganization(org)
      setPermissions(getPermissionsForRole('owner'))
      localStorage.setItem('ontyx_current_org', org.id)

      return { data: org, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }, [user, supabase])

  const updateOrganization = useCallback(async (updates: Partial<Organization>) => {
    if (!organization) return { error: new Error('No organization selected') }

    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organization.id)

      if (error) throw error

      setOrganization(prev => prev ? { ...prev, ...updates } : null)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }, [organization, supabase])

  const hasPermission = useCallback((
    module: keyof RolePermissions, 
    level: Permission
  ): boolean => {
    if (!permissions) return false
    const modulePermission = permissions[module]
    if (typeof modulePermission === 'boolean') return modulePermission
    
    const requiredLevel = permissionLevels.indexOf(level)
    const userLevel = permissionLevels.indexOf(modulePermission as Permission)
    return userLevel >= requiredLevel
  }, [permissions])

  const canAccess = useCallback((module: string): boolean => {
    return hasPermission(module as keyof RolePermissions, 'view')
  }, [hasPermission])

  const value = {
    organization,
    membership,
    organizations,
    loading,
    permissions,
    switchOrganization,
    createOrganization,
    updateOrganization,
    hasPermission,
    canAccess,
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}

export function usePermissions() {
  const { permissions, hasPermission, canAccess } = useOrganization()
  return { permissions, hasPermission, canAccess }
}
