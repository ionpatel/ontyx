// Plan-based feature configuration for Ontyx
// This controls which features are available for each subscription tier

export type PlanTier = 'starter' | 'growth' | 'enterprise'

// Feature keys used throughout the app
export type FeatureKey = 
  | 'invoices'
  | 'quotes'
  | 'expenses'
  | 'contacts'
  | 'inventory'
  | 'reports'
  | 'pos'
  | 'crm'
  | 'projects'
  | 'payroll'
  | 'appointments'
  | 'helpdesk'
  | 'manufacturing'
  | 'field_service'
  | 'multi_warehouse'
  | 'multi_currency'
  | 'api_access'
  | 'custom_integrations'
  | 'white_label'
  | 'ai_insights'
  | 'purchases'
  | 'banking'
  | 'import_export'
  | 'team_members'
  | 'audit_logs'

// Define features available per plan
export const PLAN_FEATURES: Record<PlanTier, FeatureKey[]> = {
  starter: [
    'invoices',
    'quotes',
    'expenses',
    'contacts',
    'inventory', // Basic, 1 location
    'reports', // Basic reports
    'import_export',
    'banking', // CSV import only
  ],
  growth: [
    // All starter features
    'invoices',
    'quotes', 
    'expenses',
    'contacts',
    'inventory',
    'reports',
    'import_export',
    'banking',
    // Plus growth features
    'pos',
    'crm',
    'projects',
    'payroll',
    'appointments',
    'helpdesk',
    'purchases',
    'multi_warehouse',
    'team_members',
    'audit_logs',
  ],
  enterprise: [
    // All growth features
    'invoices',
    'quotes',
    'expenses',
    'contacts',
    'inventory',
    'reports',
    'import_export',
    'banking',
    'pos',
    'crm',
    'projects',
    'payroll',
    'appointments',
    'helpdesk',
    'purchases',
    'multi_warehouse',
    'team_members',
    'audit_logs',
    // Plus enterprise features
    'manufacturing',
    'field_service',
    'multi_currency',
    'api_access',
    'custom_integrations',
    'white_label',
    'ai_insights',
  ],
}

// Route to feature mapping
export const ROUTE_FEATURES: Record<string, FeatureKey> = {
  '/pos': 'pos',
  '/crm': 'crm',
  '/projects': 'projects',
  '/payroll': 'payroll',
  '/appointments': 'appointments',
  '/helpdesk': 'helpdesk',
  '/manufacturing': 'manufacturing',
  '/field-service': 'field_service',
  '/purchases': 'purchases',
  '/sales': 'crm',
}

// Check if a feature is available for a plan
export function hasFeature(tier: PlanTier, feature: FeatureKey): boolean {
  return PLAN_FEATURES[tier]?.includes(feature) ?? false
}

// Check if a route is accessible for a plan
export function canAccessRoute(tier: PlanTier, pathname: string): boolean {
  // Check exact match first
  const feature = ROUTE_FEATURES[pathname]
  if (feature) {
    return hasFeature(tier, feature)
  }
  
  // Check prefix match for dynamic routes
  for (const [route, feat] of Object.entries(ROUTE_FEATURES)) {
    if (pathname.startsWith(route)) {
      return hasFeature(tier, feat)
    }
  }
  
  // Routes not in the mapping are accessible by all plans
  return true
}

// Get upgrade message for a feature
export function getUpgradeMessage(feature: FeatureKey): string {
  const featureNames: Record<FeatureKey, string> = {
    invoices: 'Invoicing',
    quotes: 'Quotes & Estimates',
    expenses: 'Expense Tracking',
    contacts: 'Contact Management',
    inventory: 'Inventory Management',
    reports: 'Reports & Analytics',
    pos: 'Point of Sale',
    crm: 'CRM & Sales Pipeline',
    projects: 'Project Management',
    payroll: 'Payroll & T4s',
    appointments: 'Appointments',
    helpdesk: 'Help Desk & Tickets',
    manufacturing: 'Manufacturing',
    field_service: 'Field Service',
    multi_warehouse: 'Multi-Warehouse',
    multi_currency: 'Multi-Currency',
    api_access: 'API Access',
    custom_integrations: 'Custom Integrations',
    white_label: 'White Label',
    ai_insights: 'AI Insights',
    purchases: 'Purchase Orders',
    banking: 'Bank Connections',
    import_export: 'Import/Export',
    team_members: 'Team Members',
    audit_logs: 'Audit Logs',
  }
  
  return `${featureNames[feature]} requires an upgraded plan.`
}

// Get minimum plan required for a feature
export function getMinimumPlan(feature: FeatureKey): PlanTier {
  if (PLAN_FEATURES.starter.includes(feature)) return 'starter'
  if (PLAN_FEATURES.growth.includes(feature)) return 'growth'
  return 'enterprise'
}
