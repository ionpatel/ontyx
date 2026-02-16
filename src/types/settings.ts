// ============================================================
// Settings Types
// ============================================================

export interface CompanyProfile {
  id: string
  name: string
  legalName?: string
  email: string
  phone?: string
  website?: string
  address: string
  city: string
  province?: string
  postalCode?: string
  country: string
  taxId?: string
  registrationNumber?: string
  logo?: string
  favicon?: string
  currency: string
  timezone: string
  fiscalYearStart: string
  industry?: string
}

export interface BrandingSettings {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl?: string
  faviconUrl?: string
  fontFamily: string
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full'
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  currency: string
  notifications: {
    email: boolean
    push: boolean
    desktop: boolean
  }
  dashboardLayout: 'default' | 'compact' | 'expanded'
}

export interface SystemSettings {
  invoicePrefix: string
  invoiceNextNumber: number
  billPrefix: string
  billNextNumber: number
  quotePrefix: string
  quoteNextNumber: number
  salesOrderPrefix: string
  salesOrderNextNumber: number
  purchaseOrderPrefix: string
  purchaseOrderNextNumber: number
  workOrderPrefix: string
  workOrderNextNumber: number
  projectCodePrefix: string
  projectNextNumber: number
  defaultPaymentTerms: number
  defaultTaxRate: number
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
}
