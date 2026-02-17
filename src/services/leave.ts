// Leave / Time Off Service
import { createClient } from '@/lib/supabase/client';
import type { LeaveType, LeaveBalance, LeaveRequest, CreateLeaveRequestInput, ReviewLeaveRequestInput } from '@/types/leave';
import { differenceInBusinessDays } from 'date-fns';

const supabase = createClient();

// Leave Types
export async function getLeaveTypes(organizationId: string): Promise<LeaveType[]> {
  const { data, error } = await supabase
    .from('leave_types')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function createLeaveType(organizationId: string, input: Partial<LeaveType>): Promise<LeaveType> {
  const { data, error } = await supabase
    .from('leave_types')
    .insert({ organization_id: organizationId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Leave Balances
export async function getLeaveBalances(employeeId: string, year?: number): Promise<LeaveBalance[]> {
  const currentYear = year || new Date().getFullYear();
  const { data, error } = await supabase
    .from('leave_balances')
    .select('*, leave_type:leave_types(*)')
    .eq('employee_id', employeeId)
    .eq('year', currentYear);
  if (error) throw error;
  
  return (data || []).map(b => ({
    ...b,
    available_days: b.allocated_days + b.carried_over_days - b.used_days
  }));
}

export async function allocateLeave(
  employeeId: string,
  leaveTypeId: string,
  year: number,
  days: number
): Promise<LeaveBalance> {
  const { data, error } = await supabase
    .from('leave_balances')
    .upsert({
      employee_id: employeeId,
      leave_type_id: leaveTypeId,
      year,
      allocated_days: days,
    }, { onConflict: 'employee_id,leave_type_id,year' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Leave Requests
export async function getLeaveRequests(
  organizationId: string,
  options?: { employeeId?: string; status?: string; startDate?: string; endDate?: string }
): Promise<LeaveRequest[]> {
  let query = supabase
    .from('leave_requests')
    .select(`
      *,
      employee:employees(id, first_name, last_name),
      leave_type:leave_types(*)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.employeeId) query = query.eq('employee_id', options.employeeId);
  if (options?.status) query = query.eq('status', options.status);
  if (options?.startDate) query = query.gte('start_date', options.startDate);
  if (options?.endDate) query = query.lte('end_date', options.endDate);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getLeaveRequest(requestId: string): Promise<LeaveRequest | null> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      employee:employees(id, first_name, last_name),
      leave_type:leave_types(*)
    `)
    .eq('id', requestId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createLeaveRequest(
  organizationId: string,
  employeeId: string,
  input: CreateLeaveRequestInput
): Promise<LeaveRequest> {
  // Calculate days
  const startDate = new Date(input.start_date);
  const endDate = new Date(input.end_date);
  let daysRequested = differenceInBusinessDays(endDate, startDate) + 1;
  
  if (input.half_day) {
    daysRequested = 0.5;
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      organization_id: organizationId,
      employee_id: employeeId,
      leave_type_id: input.leave_type_id,
      start_date: input.start_date,
      end_date: input.end_date,
      days_requested: daysRequested,
      half_day: input.half_day || false,
      half_day_period: input.half_day_period,
      reason: input.reason,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function reviewLeaveRequest(
  requestId: string,
  reviewerId: string,
  input: ReviewLeaveRequestInput
): Promise<LeaveRequest> {
  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status: input.status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: input.review_notes,
    })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw error;

  // If approved, update balance
  if (input.status === 'approved') {
    const request = await getLeaveRequest(requestId);
    if (request) {
      const year = new Date(request.start_date).getFullYear();
      await supabase.rpc('update_leave_balance', {
        p_employee_id: request.employee_id,
        p_leave_type_id: request.leave_type_id,
        p_year: year,
        p_days: request.days_requested,
      });
    }
  }

  return data;
}

export async function cancelLeaveRequest(requestId: string): Promise<LeaveRequest> {
  const { data, error } = await supabase
    .from('leave_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Calendar view
export async function getLeaveCalendar(
  organizationId: string,
  startDate: string,
  endDate: string
): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      employee:employees(id, first_name, last_name),
      leave_type:leave_types(id, name, color)
    `)
    .eq('organization_id', organizationId)
    .in('status', ['approved', 'pending'])
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);
  if (error) throw error;
  return data || [];
}
