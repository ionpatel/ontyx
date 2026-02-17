// Leave / Time Off Module Types

export interface LeaveType {
  id: string;
  organization_id: string;
  name: string;
  color: string;
  paid: boolean;
  requires_approval: boolean;
  max_days_per_year: number | null;
  carryover_allowed: boolean;
  max_carryover_days: number | null;
  created_at: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  allocated_days: number;
  used_days: number;
  carried_over_days: number;
  // Computed
  available_days?: number;
  // Joined
  leave_type?: LeaveType;
}

export interface LeaveRequest {
  id: string;
  organization_id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  half_day: boolean;
  half_day_period: 'morning' | 'afternoon' | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  employee?: { id: string; first_name: string; last_name: string };
  leave_type?: LeaveType;
  reviewer?: { email: string; full_name?: string };
}

export interface CreateLeaveRequestInput {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  half_day?: boolean;
  half_day_period?: 'morning' | 'afternoon';
  reason?: string;
}

export interface ReviewLeaveRequestInput {
  status: 'approved' | 'rejected';
  review_notes?: string;
}
