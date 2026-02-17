// Approval Workflows Service
import { createClient } from '@/lib/supabase/client';
import type { ApprovalWorkflow, ApprovalRequest, ApprovalAction, CreateApprovalWorkflowInput, SubmitApprovalInput } from '@/types/approvals';

const supabase = createClient();

// Workflows
export async function getApprovalWorkflows(organizationId: string): Promise<ApprovalWorkflow[]> {
  const { data, error } = await supabase
    .from('approval_workflows')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function getApprovalWorkflow(workflowId: string): Promise<ApprovalWorkflow | null> {
  const { data, error } = await supabase
    .from('approval_workflows')
    .select('*')
    .eq('id', workflowId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createApprovalWorkflow(
  organizationId: string,
  input: CreateApprovalWorkflowInput
): Promise<ApprovalWorkflow> {
  const steps = input.steps.map((step, index) => ({ ...step, order: index + 1 }));
  
  const { data, error } = await supabase
    .from('approval_workflows')
    .insert({
      organization_id: organizationId,
      name: input.name,
      description: input.description,
      entity_type: input.entity_type,
      conditions: input.conditions || {},
      steps,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Approval Requests
export async function getApprovalRequests(
  organizationId: string,
  options?: { status?: string; entityType?: string; requesterId?: string }
): Promise<ApprovalRequest[]> {
  let query = supabase
    .from('approval_requests')
    .select(`
      *,
      workflow:approval_workflows(id, name, steps),
      actions:approval_actions(*)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);
  if (options?.entityType) query = query.eq('entity_type', options.entityType);
  if (options?.requesterId) query = query.eq('requester_id', options.requesterId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getMyPendingApprovals(
  organizationId: string,
  userId: string
): Promise<ApprovalRequest[]> {
  // Get workflows where user is an approver
  const { data: workflows } = await supabase
    .from('approval_workflows')
    .select('id, steps')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  const workflowIds = workflows?.filter(w => 
    w.steps.some((s: any) => s.approver_type === 'user' && s.approver_id === userId)
  ).map(w => w.id) || [];

  if (workflowIds.length === 0) {
    // Check for requests without workflow (direct approval)
    const { data } = await supabase
      .from('approval_requests')
      .select('*, actions:approval_actions(*)')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .is('workflow_id', null);
    return data || [];
  }

  const { data, error } = await supabase
    .from('approval_requests')
    .select(`
      *,
      workflow:approval_workflows(id, name, steps),
      actions:approval_actions(*)
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .in('workflow_id', workflowIds);

  if (error) throw error;

  // Filter to only show requests at user's step
  return (data || []).filter(req => {
    if (!req.workflow) return true;
    const currentStep = req.workflow.steps.find((s: any) => s.order === req.current_step);
    return currentStep?.approver_type === 'user' && currentStep?.approver_id === userId;
  });
}

export async function getApprovalRequest(requestId: string): Promise<ApprovalRequest | null> {
  const { data, error } = await supabase
    .from('approval_requests')
    .select(`
      *,
      workflow:approval_workflows(*),
      actions:approval_actions(*)
    `)
    .eq('id', requestId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createApprovalRequest(
  organizationId: string,
  requesterId: string,
  entityType: string,
  entityId: string,
  requestData: Record<string, any> = {}
): Promise<ApprovalRequest> {
  // Find matching workflow
  const { data: workflows } = await supabase
    .from('approval_workflows')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', entityType)
    .eq('is_active', true);

  // Find first matching workflow based on conditions
  let selectedWorkflow = workflows?.find(w => {
    const conditions = w.conditions || {};
    // Check amount conditions
    if (conditions.amount_greater_than && requestData.amount <= conditions.amount_greater_than) return false;
    if (conditions.amount_less_than && requestData.amount >= conditions.amount_less_than) return false;
    return true;
  });

  const { data, error } = await supabase
    .from('approval_requests')
    .insert({
      organization_id: organizationId,
      workflow_id: selectedWorkflow?.id,
      entity_type: entityType,
      entity_id: entityId,
      requester_id: requesterId,
      request_data: requestData,
      status: 'pending',
      current_step: 1,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function submitApproval(
  requestId: string,
  approverId: string,
  input: SubmitApprovalInput
): Promise<ApprovalRequest> {
  const request = await getApprovalRequest(requestId);
  if (!request) throw new Error('Request not found');
  if (request.status !== 'pending') throw new Error('Request is not pending');

  // Record the action
  const { error: actionError } = await supabase
    .from('approval_actions')
    .insert({
      request_id: requestId,
      step: request.current_step,
      approver_id: approverId,
      action: input.action,
      comments: input.comments,
      delegated_to: input.delegated_to,
    });
  if (actionError) throw actionError;

  // Determine next status
  let newStatus = request.status;
  let newStep = request.current_step;

  if (input.action === 'rejected') {
    newStatus = 'rejected';
  } else if (input.action === 'approved') {
    const workflow = request.workflow;
    if (workflow && workflow.steps.length > request.current_step) {
      newStep = request.current_step + 1;
    } else {
      newStatus = 'approved';
    }
  } else if (input.action === 'delegated' && input.delegated_to) {
    // Keep pending, same step
  }

  const { data, error } = await supabase
    .from('approval_requests')
    .update({
      status: newStatus,
      current_step: newStep,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelApprovalRequest(requestId: string): Promise<ApprovalRequest> {
  const { data, error } = await supabase
    .from('approval_requests')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
