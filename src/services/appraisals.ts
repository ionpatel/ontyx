// Performance Appraisals Service
import { createClient } from '@/lib/supabase/client';
import type { AppraisalTemplate, Appraisal, CreateAppraisalInput } from '@/types/appraisals';

const supabase = createClient();

// Templates
export async function getAppraisalTemplates(organizationId: string): Promise<AppraisalTemplate[]> {
  const { data, error } = await supabase
    .from('appraisal_templates')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function createAppraisalTemplate(
  organizationId: string,
  input: Partial<AppraisalTemplate>
): Promise<AppraisalTemplate> {
  const { data, error } = await supabase
    .from('appraisal_templates')
    .insert({ organization_id: organizationId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Appraisals
export async function getAppraisals(
  organizationId: string,
  options?: { employeeId?: string; reviewerId?: string; status?: string; year?: number }
): Promise<Appraisal[]> {
  let query = supabase
    .from('appraisals')
    .select(`
      *,
      employee:employees(id, first_name, last_name),
      reviewer:employees!appraisals_reviewer_id_fkey(id, first_name, last_name),
      template:appraisal_templates(id, name)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.employeeId) query = query.eq('employee_id', options.employeeId);
  if (options?.reviewerId) query = query.eq('reviewer_id', options.reviewerId);
  if (options?.status) query = query.eq('status', options.status);
  if (options?.year) {
    const yearStart = `${options.year}-01-01`;
    const yearEnd = `${options.year}-12-31`;
    query = query.gte('review_period_start', yearStart).lte('review_period_end', yearEnd);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getAppraisal(appraisalId: string): Promise<Appraisal | null> {
  const { data, error } = await supabase
    .from('appraisals')
    .select(`
      *,
      employee:employees(id, first_name, last_name),
      reviewer:employees!appraisals_reviewer_id_fkey(id, first_name, last_name),
      template:appraisal_templates(*)
    `)
    .eq('id', appraisalId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createAppraisal(
  organizationId: string,
  input: CreateAppraisalInput
): Promise<Appraisal> {
  const { data, error } = await supabase
    .from('appraisals')
    .insert({
      organization_id: organizationId,
      employee_id: input.employee_id,
      reviewer_id: input.reviewer_id,
      template_id: input.template_id,
      review_period_start: input.review_period_start,
      review_period_end: input.review_period_end,
      status: 'draft',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAppraisal(
  appraisalId: string,
  updates: Partial<Appraisal>
): Promise<Appraisal> {
  const { data, error } = await supabase
    .from('appraisals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', appraisalId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function startSelfReview(appraisalId: string): Promise<Appraisal> {
  return updateAppraisal(appraisalId, { status: 'self_review' });
}

export async function submitSelfAssessment(
  appraisalId: string,
  assessment: Record<string, any>
): Promise<Appraisal> {
  return updateAppraisal(appraisalId, {
    self_assessment: assessment,
    status: 'manager_review',
  });
}

export async function submitManagerAssessment(
  appraisalId: string,
  assessment: Record<string, any>,
  overallRating: number,
  comments?: string
): Promise<Appraisal> {
  return updateAppraisal(appraisalId, {
    manager_assessment: assessment,
    overall_rating: overallRating,
    manager_comments: comments,
    manager_signed_at: new Date().toISOString(),
    status: 'completed',
  });
}

export async function employeeAcknowledge(
  appraisalId: string,
  comments?: string
): Promise<Appraisal> {
  return updateAppraisal(appraisalId, {
    employee_comments: comments,
    employee_signed_at: new Date().toISOString(),
    status: 'acknowledged',
  });
}

export async function setGoals(
  appraisalId: string,
  goalsAchieved: string,
  goalsNextPeriod: string
): Promise<Appraisal> {
  return updateAppraisal(appraisalId, {
    goals_achieved: goalsAchieved,
    goals_next_period: goalsNextPeriod,
  });
}

// Analytics
export async function getAppraisalStats(organizationId: string, year?: number): Promise<{
  total: number;
  completed: number;
  pending: number;
  avg_rating: number;
}> {
  const targetYear = year || new Date().getFullYear();
  const yearStart = `${targetYear}-01-01`;
  const yearEnd = `${targetYear}-12-31`;

  const { data, error } = await supabase
    .from('appraisals')
    .select('status, overall_rating')
    .eq('organization_id', organizationId)
    .gte('review_period_start', yearStart)
    .lte('review_period_end', yearEnd);

  if (error) throw error;

  const stats = { total: 0, completed: 0, pending: 0, avg_rating: 0 };
  let ratingSum = 0;
  let ratingCount = 0;

  data?.forEach(a => {
    stats.total++;
    if (['completed', 'acknowledged'].includes(a.status)) stats.completed++;
    else stats.pending++;
    if (a.overall_rating) {
      ratingSum += a.overall_rating;
      ratingCount++;
    }
  });

  stats.avg_rating = ratingCount > 0 ? ratingSum / ratingCount : 0;
  return stats;
}
