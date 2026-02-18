// CRM Types

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'
export type OpportunityStatus = 'open' | 'won' | 'lost'

export interface Lead {
  id: string
  organization_id: string
  source?: string
  campaign?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company_name?: string
  job_title?: string
  website?: string
  address_line1?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  status: LeadStatus
  score: number
  assigned_to?: string
  notes?: string
  converted_at?: string
  converted_to_contact_id?: string
  converted_to_opportunity_id?: string
  last_activity_at?: string
  next_follow_up?: string
  tags?: string[]
  created_by?: string
  created_at: string
  updated_at: string
  // Joined
  assigned_user?: {
    id: string
    full_name?: string
    email?: string
  }
}

export interface PipelineStage {
  id: string
  organization_id: string
  name: string
  description?: string
  probability: number
  sort_order: number
  color: string
  is_won: boolean
  is_lost: boolean
  is_active: boolean
  created_at: string
}

export interface Opportunity {
  id: string
  organization_id: string
  name: string
  contact_id?: string
  lead_id?: string
  stage_id?: string
  probability: number
  currency: string
  amount?: number
  expected_revenue?: number
  expected_close?: string
  actual_close?: string
  status: OpportunityStatus
  lost_reason?: string
  assigned_to?: string
  description?: string
  next_step?: string
  last_activity_at?: string
  tags?: string[]
  created_by?: string
  created_at: string
  updated_at: string
  // Joined
  stage?: PipelineStage
  contact?: {
    id: string
    display_name: string
    email?: string
  }
  assigned_user?: {
    id: string
    full_name?: string
  }
}

export interface Activity {
  id: string
  organization_id: string
  activity_type: string
  entity_type?: string
  entity_id?: string
  subject?: string
  description?: string
  scheduled_at?: string
  completed_at?: string
  duration_minutes?: number
  assigned_to?: string
  outcome?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CreateLeadInput {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company_name?: string
  job_title?: string
  source?: string
  notes?: string
  assigned_to?: string
  score?: number
}

export interface UpdateLeadInput {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company_name?: string
  job_title?: string
  source?: string
  notes?: string
  assigned_to?: string
  score?: number
  status?: LeadStatus
  next_follow_up?: string
}

export interface CreateOpportunityInput {
  name: string
  contact_id?: string
  lead_id?: string
  stage_id?: string
  amount?: number
  expected_close?: string
  description?: string
  assigned_to?: string
}

export interface UpdateOpportunityInput {
  name?: string
  stage_id?: string
  amount?: number
  expected_close?: string
  description?: string
  next_step?: string
  assigned_to?: string
}

export interface CRMSummary {
  total_leads: number
  new_leads: number
  qualified_leads: number
  total_opportunities: number
  open_opportunities: number
  pipeline_value: number
  won_this_month: number
  conversion_rate: number
}

// Type aliases for backwards compatibility
export type DealActivity = Activity
export type DealStage = PipelineStage

// Helper type for leads page
export interface LeadWithHelpers extends Lead {
  name?: string  // computed from first_name + last_name
  company?: string  // alias for company_name
  createdAt?: string  // alias for created_at
  assignedTo?: string  // alias for assigned_to
}

