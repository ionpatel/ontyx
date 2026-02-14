// Contact Types for Ontyx CRM

export type ContactType = 'customer' | 'vendor' | 'both'
export type ContactCategory = 'individual' | 'company'

export interface Address {
  id: string
  type: 'billing' | 'shipping' | 'other'
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  isPrimary: boolean
}

export interface ContactActivity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'invoice' | 'payment' | 'order'
  title: string
  description?: string
  date: string
  user: string
  metadata?: Record<string, any>
}

export interface Contact {
  id: string
  type: ContactType
  category: ContactCategory
  name: string
  email: string
  phone?: string
  company?: string
  jobTitle?: string
  avatar?: string
  website?: string
  addresses: Address[]
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
  totalRevenue: number
  totalOrders: number
  lastContactedAt?: string
  activities: ContactActivity[]
}

export interface ContactStats {
  total: number
  customers: number
  vendors: number
  newThisMonth: number
  activeDeals: number
}
