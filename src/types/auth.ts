/**
 * Auth & Organization Types
 * =========================
 * Multi-tenant RBAC system for Ontyx
 */

// User profile (extends Supabase auth.users)
export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

// Organization
export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  industry: string | null
  
  // Address
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  province: string | null
  postalCode: string | null
  country: string
  
  // Contact
  phone: string | null
  email: string | null
  website: string | null
  
  // Tax
  taxNumber: string | null // GST/HST registration number
  
  // Tier
  tier: 'starter' | 'growth' | 'enterprise'
  onboardingCompleted: boolean
  
  timezone: string
  currency: string
  fiscal_year_start: number // Month (1-12)
  created_at: string
  updated_at: string
  settings: OrganizationSettings
}

export interface OrganizationSettings {
  // Tax settings
  tax_number?: string // GST/HST number
  pst_number?: string // Provincial sales tax number
  
  // Invoice settings
  invoice_prefix?: string
  invoice_next_number?: number
  invoice_due_days?: number
  invoice_notes?: string
  invoice_terms?: string
  
  // Payroll settings
  payroll_schedule?: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'
  
  // Branding
  primary_color?: string
  secondary_color?: string
  
  // Features
  enabled_modules?: string[]
}

// Organization membership
export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: UserRole
  invited_by: string | null
  invited_at: string | null
  accepted_at: string | null
  created_at: string
  updated_at: string
  
  // Joined data
  user?: UserProfile
  organization?: Organization
}

// User roles
export type UserRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer'

// Role permissions
export interface RolePermissions {
  // Module access
  dashboard: Permission
  inventory: Permission
  invoices: Permission
  accounting: Permission
  contacts: Permission
  sales: Permission
  purchases: Permission
  crm: Permission
  employees: Permission
  payroll: Permission
  projects: Permission
  pos: Permission
  reports: Permission
  settings: Permission
  
  // Special permissions
  can_invite_users: boolean
  can_manage_roles: boolean
  can_delete_org: boolean
  can_export_data: boolean
  can_access_api: boolean
}

export type Permission = 'none' | 'view' | 'edit' | 'full'

// Default role permissions
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
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

// Invitation
export interface Invitation {
  id: string
  organization_id: string
  email: string
  role: UserRole
  invited_by: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

// Audit log entry
export interface AuditLog {
  id: string
  organization_id: string
  user_id: string
  action: AuditAction
  resource_type: string
  resource_id: string | null
  details: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  created_at: string
  
  // Joined data
  user?: UserProfile
}

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'login'
  | 'logout'
  | 'invite'
  | 'role_change'
  | 'settings_change'

// Session with organization context
export interface SessionWithOrg {
  user: UserProfile
  organization: Organization
  membership: OrganizationMember
  permissions: RolePermissions
}
