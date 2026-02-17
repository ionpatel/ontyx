// Approval Workflows Types

export interface ApprovalWorkflow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  entity_type: string; // 'expense', 'leave_request', 'purchase_order', etc.
  conditions: ApprovalCondition;
  steps: ApprovalStep[];
  is_active: boolean;
  created_at: string;
}

export interface ApprovalCondition {
  amount_greater_than?: number;
  amount_less_than?: number;
  department_ids?: string[];
  [key: string]: any;
}

export interface ApprovalStep {
  order: number;
  approver_type: 'user' | 'role' | 'manager';
  approver_id?: string; // User ID if type is 'user'
  approver_role?: string; // Role name if type is 'role'
  required: boolean;
}

export interface ApprovalRequest {
  id: string;
  organization_id: string;
  workflow_id: string | null;
  entity_type: string;
  entity_id: string;
  requester_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  current_step: number;
  request_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined
  workflow?: ApprovalWorkflow;
  requester?: { email: string; full_name?: string };
  actions?: ApprovalAction[];
}

export interface ApprovalAction {
  id: string;
  request_id: string;
  step: number;
  approver_id: string;
  action: 'approved' | 'rejected' | 'delegated';
  comments: string | null;
  delegated_to: string | null;
  created_at: string;
  // Joined
  approver?: { email: string; full_name?: string };
}

export interface CreateApprovalWorkflowInput {
  name: string;
  description?: string;
  entity_type: string;
  conditions?: ApprovalCondition;
  steps: Omit<ApprovalStep, 'order'>[];
}

export interface SubmitApprovalInput {
  action: 'approved' | 'rejected' | 'delegated';
  comments?: string;
  delegated_to?: string;
}
