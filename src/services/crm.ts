import { createClient } from '@/lib/supabase/client'
import type { 
  Lead, 
  Opportunity, 
  PipelineStage,
  Activity,
  CreateLeadInput, 
  UpdateLeadInput,
  CreateOpportunityInput,
  UpdateOpportunityInput,
  CRMSummary,
  LeadStatus
} from '@/types/crm'

// =============================================================================
// LEADS
// =============================================================================

export async function getLeads(organizationId: string): Promise<Lead[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      assigned_user:users!assigned_to (
        id,
        full_name,
        email
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getLead(id: string): Promise<Lead | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      assigned_user:users!assigned_to (
        id,
        full_name,
        email
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function createLead(
  organizationId: string,
  input: CreateLeadInput
): Promise<Lead> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('leads')
    .insert({
      organization_id: organizationId,
      ...input,
      status: 'new',
      score: input.score || 0,
      created_by: user.id
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateLead(
  id: string,
  input: UpdateLeadInput
): Promise<Lead> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('leads')
    .update({
      ...input,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('leads')
    .update({
      status,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
  
  if (error) throw error
}

export async function deleteLead(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Convert lead to contact and opportunity
export async function convertLead(
  leadId: string,
  createOpportunity: boolean = true,
  opportunityData?: { name: string; amount?: number; expected_close?: string }
): Promise<{ contactId: string; opportunityId?: string }> {
  const supabase = createClient()
  
  // Get lead
  const lead = await getLead(leadId)
  if (!lead) throw new Error('Lead not found')
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // Create contact from lead
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .insert({
      organization_id: lead.organization_id,
      is_customer: true,
      is_vendor: false,
      type: lead.company_name ? 'company' : 'individual',
      company_name: lead.company_name,
      display_name: lead.company_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email || 'Unknown',
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      billing_address_line1: lead.address_line1,
      billing_city: lead.city,
      billing_state: lead.state,
      billing_postal_code: lead.postal_code,
      billing_country: lead.country,
      notes: lead.notes
    })
    .select()
    .single()
  
  if (contactError) throw contactError
  
  let opportunityId: string | undefined
  
  // Create opportunity if requested
  if (createOpportunity) {
    const oppName = opportunityData?.name || 
      `${lead.company_name || lead.first_name || 'Lead'} - New Opportunity`
    
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .insert({
        organization_id: lead.organization_id,
        name: oppName,
        contact_id: contact.id,
        lead_id: leadId,
        amount: opportunityData?.amount,
        expected_close: opportunityData?.expected_close,
        status: 'open',
        probability: 10,
        assigned_to: lead.assigned_to,
        created_by: user.id
      })
      .select()
      .single()
    
    if (oppError) throw oppError
    opportunityId = opportunity.id
  }
  
  // Update lead as converted
  await supabase
    .from('leads')
    .update({
      status: 'converted',
      converted_at: new Date().toISOString(),
      converted_to_contact_id: contact.id,
      converted_to_opportunity_id: opportunityId,
      updated_at: new Date().toISOString()
    })
    .eq('id', leadId)
  
  return { contactId: contact.id, opportunityId }
}

// =============================================================================
// PIPELINE STAGES
// =============================================================================

export async function getPipelineStages(organizationId: string): Promise<PipelineStage[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('sort_order')
  
  if (error) throw error
  
  // If no stages exist, create defaults
  if (!data || data.length === 0) {
    const defaultStages = [
      { name: 'Prospecting', probability: 10, color: '#6B7280', sort_order: 0 },
      { name: 'Qualification', probability: 20, color: '#3B82F6', sort_order: 1 },
      { name: 'Proposal', probability: 50, color: '#8B5CF6', sort_order: 2 },
      { name: 'Negotiation', probability: 75, color: '#F59E0B', sort_order: 3 },
      { name: 'Closed Won', probability: 100, color: '#10B981', sort_order: 4, is_won: true },
      { name: 'Closed Lost', probability: 0, color: '#EF4444', sort_order: 5, is_lost: true }
    ]
    
    const { data: created, error: createError } = await supabase
      .from('pipeline_stages')
      .insert(defaultStages.map(s => ({
        organization_id: organizationId,
        ...s
      })))
      .select()
    
    if (createError) throw createError
    return created || []
  }
  
  return data
}

// =============================================================================
// OPPORTUNITIES
// =============================================================================

export async function getOpportunities(organizationId: string): Promise<Opportunity[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('opportunities')
    .select(`
      *,
      stage:pipeline_stages!stage_id (*),
      contact:contacts!contact_id (
        id,
        display_name,
        email
      ),
      assigned_user:users!assigned_to (
        id,
        full_name
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getOpportunity(id: string): Promise<Opportunity | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('opportunities')
    .select(`
      *,
      stage:pipeline_stages!stage_id (*),
      contact:contacts!contact_id (
        id,
        display_name,
        email,
        phone
      ),
      assigned_user:users!assigned_to (
        id,
        full_name
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function createOpportunity(
  organizationId: string,
  input: CreateOpportunityInput
): Promise<Opportunity> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // Calculate expected revenue
  const stages = await getPipelineStages(organizationId)
  const stage = stages.find(s => s.id === input.stage_id)
  const probability = stage?.probability || 10
  const expectedRevenue = input.amount ? input.amount * (probability / 100) : 0
  
  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      organization_id: organizationId,
      ...input,
      status: 'open',
      probability,
      expected_revenue: expectedRevenue,
      created_by: user.id
    })
    .select()
    .single()
  
  if (error) throw error
  return getOpportunity(data.id) as Promise<Opportunity>
}

export async function updateOpportunity(
  id: string,
  input: UpdateOpportunityInput
): Promise<Opportunity> {
  const supabase = createClient()
  
  // If stage changed, update probability
  let updateData: Record<string, unknown> = {
    ...input,
    last_activity_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  if (input.stage_id) {
    const { data: stage } = await supabase
      .from('pipeline_stages')
      .select('probability, is_won, is_lost')
      .eq('id', input.stage_id)
      .single()
    
    if (stage) {
      updateData.probability = stage.probability
      if (input.amount) {
        updateData.expected_revenue = input.amount * (stage.probability / 100)
      }
      if (stage.is_won) {
        updateData.status = 'won'
        updateData.actual_close = new Date().toISOString().split('T')[0]
      } else if (stage.is_lost) {
        updateData.status = 'lost'
        updateData.actual_close = new Date().toISOString().split('T')[0]
      }
    }
  }
  
  const { error } = await supabase
    .from('opportunities')
    .update(updateData)
    .eq('id', id)
  
  if (error) throw error
  return getOpportunity(id) as Promise<Opportunity>
}

export async function deleteOpportunity(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// =============================================================================
// ACTIVITIES
// =============================================================================

export async function getActivities(
  organizationId: string,
  entityType?: string,
  entityId?: string
): Promise<Activity[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('activities')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  
  if (entityType && entityId) {
    query = query.eq('entity_type', entityType).eq('entity_id', entityId)
  }
  
  const { data, error } = await query.limit(50)
  
  if (error) throw error
  return data || []
}

export async function createActivity(
  organizationId: string,
  input: Partial<Activity>
): Promise<Activity> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('activities')
    .insert({
      organization_id: organizationId,
      ...input,
      created_by: user.id
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// =============================================================================
// SUMMARY
// =============================================================================

export async function getCRMSummary(organizationId: string): Promise<CRMSummary> {
  const supabase = createClient()
  
  // Get leads
  const { data: leads } = await supabase
    .from('leads')
    .select('status')
    .eq('organization_id', organizationId)
  
  // Get opportunities
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('status, amount, actual_close')
    .eq('organization_id', organizationId)
  
  const leadsList = leads || []
  const oppList = opportunities || []
  
  const totalLeads = leadsList.length
  const newLeads = leadsList.filter(l => l.status === 'new').length
  const qualifiedLeads = leadsList.filter(l => l.status === 'qualified').length
  const convertedLeads = leadsList.filter(l => l.status === 'converted').length
  
  const openOpps = oppList.filter(o => o.status === 'open')
  const pipelineValue = openOpps.reduce((sum, o) => sum + (o.amount || 0), 0)
  
  // Won this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const wonThisMonth = oppList
    .filter(o => 
      o.status === 'won' && 
      o.actual_close && 
      new Date(o.actual_close) >= startOfMonth
    )
    .reduce((sum, o) => sum + (o.amount || 0), 0)
  
  const conversionRate = totalLeads > 0 
    ? Math.round((convertedLeads / totalLeads) * 100) 
    : 0
  
  return {
    total_leads: totalLeads,
    new_leads: newLeads,
    qualified_leads: qualifiedLeads,
    total_opportunities: oppList.length,
    open_opportunities: openOpps.length,
    pipeline_value: pipelineValue,
    won_this_month: wonThisMonth,
    conversion_rate: conversionRate
  }
}
