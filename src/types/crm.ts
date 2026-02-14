// CRM Types for Ontyx

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified'
export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  source: string
  status: LeadStatus
  score: number
  assignedTo?: string
  notes?: string
  createdAt: string
  convertedAt?: string
}

export interface Deal {
  id: string
  title: string
  value: number
  currency: string
  stage: DealStage
  probability: number
  contactId: string
  contactName: string
  contactEmail: string
  company?: string
  assignedTo: string
  assignedToName: string
  assignedToAvatar?: string
  expectedCloseDate: string
  createdAt: string
  updatedAt: string
  activities: DealActivity[]
  tags: string[]
  notes?: string
}

export interface DealActivity {
  id: string
  type: ActivityType
  title: string
  description?: string
  date: string
  user: string
  completed: boolean
}

export interface PipelineStage {
  id: DealStage
  name: string
  color: string
  deals: Deal[]
  totalValue: number
}

export interface CRMStats {
  totalDeals: number
  totalValue: number
  wonDeals: number
  wonValue: number
  lostDeals: number
  conversionRate: number
  avgDealSize: number
  pipelineValue: number
}
