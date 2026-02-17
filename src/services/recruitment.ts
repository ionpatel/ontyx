// Recruitment Service
import { createClient } from '@/lib/supabase/client';
import type { JobPosting, JobApplication, CreateJobPostingInput, CreateJobApplicationInput } from '@/types/recruitment';

const supabase = createClient();

// Job Postings
export async function getJobPostings(
  organizationId: string,
  options?: { status?: string; departmentId?: string }
): Promise<JobPosting[]> {
  let query = supabase
    .from('job_postings')
    .select(`
      *,
      department:departments(id, name),
      applications:job_applications(count)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);
  if (options?.departmentId) query = query.eq('department_id', options.departmentId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(jp => ({
    ...jp,
    applications_count: jp.applications?.[0]?.count || 0
  }));
}

export async function getJobPosting(postingId: string): Promise<JobPosting | null> {
  const { data, error } = await supabase
    .from('job_postings')
    .select(`*, department:departments(id, name)`)
    .eq('id', postingId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createJobPosting(
  organizationId: string,
  input: CreateJobPostingInput
): Promise<JobPosting> {
  const { data, error } = await supabase
    .from('job_postings')
    .insert({
      organization_id: organizationId,
      ...input,
      status: 'draft',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateJobPosting(
  postingId: string,
  updates: Partial<JobPosting>
): Promise<JobPosting> {
  const { data, error } = await supabase
    .from('job_postings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', postingId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function publishJobPosting(postingId: string): Promise<JobPosting> {
  return updateJobPosting(postingId, { status: 'open', published_at: new Date().toISOString() });
}

export async function closeJobPosting(postingId: string): Promise<JobPosting> {
  return updateJobPosting(postingId, { status: 'closed' });
}

// Job Applications
export async function getJobApplications(
  organizationId: string,
  options?: { jobPostingId?: string; stage?: string; recruiterId?: string }
): Promise<JobApplication[]> {
  let query = supabase
    .from('job_applications')
    .select(`
      *,
      job_posting:job_postings(id, title),
      recruiter:employees(id, first_name, last_name)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.jobPostingId) query = query.eq('job_posting_id', options.jobPostingId);
  if (options?.stage) query = query.eq('stage', options.stage);
  if (options?.recruiterId) query = query.eq('recruiter_id', options.recruiterId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getJobApplication(applicationId: string): Promise<JobApplication | null> {
  const { data, error } = await supabase
    .from('job_applications')
    .select(`
      *,
      job_posting:job_postings(*),
      recruiter:employees(id, first_name, last_name)
    `)
    .eq('id', applicationId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createJobApplication(
  organizationId: string,
  input: CreateJobApplicationInput
): Promise<JobApplication> {
  let resumePath = null;
  if (input.resume) {
    const fileName = `${crypto.randomUUID()}-${input.resume.name}`;
    const filePath = `${organizationId}/resumes/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, input.resume);
    if (!uploadError) resumePath = filePath;
  }

  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      organization_id: organizationId,
      job_posting_id: input.job_posting_id,
      applicant_name: input.applicant_name,
      applicant_email: input.applicant_email,
      applicant_phone: input.applicant_phone,
      resume_path: resumePath,
      cover_letter: input.cover_letter,
      source: input.source,
      stage: 'new',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateJobApplication(
  applicationId: string,
  updates: Partial<JobApplication>
): Promise<JobApplication> {
  const { data, error } = await supabase
    .from('job_applications')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function moveToStage(
  applicationId: string,
  stage: JobApplication['stage']
): Promise<JobApplication> {
  return updateJobApplication(applicationId, { stage });
}

export async function assignRecruiter(
  applicationId: string,
  recruiterId: string
): Promise<JobApplication> {
  return updateJobApplication(applicationId, { recruiter_id: recruiterId });
}

export async function scheduleInterview(
  applicationId: string,
  interviewDate: string
): Promise<JobApplication> {
  return updateJobApplication(applicationId, { interview_date: interviewDate, stage: 'interview' });
}

export async function makeOffer(
  applicationId: string,
  offeredSalary: number
): Promise<JobApplication> {
  return updateJobApplication(applicationId, {
    offered_salary: offeredSalary,
    offer_date: new Date().toISOString().split('T')[0],
    offer_status: 'pending',
    stage: 'offer',
  });
}

export async function hireCandidate(applicationId: string): Promise<JobApplication> {
  const app = await updateJobApplication(applicationId, { stage: 'hired', offer_status: 'accepted' });
  
  // Mark job as filled
  if (app.job_posting_id) {
    await updateJobPosting(app.job_posting_id, { status: 'filled' });
  }
  
  return app;
}

// Pipeline stats
export async function getRecruitmentStats(organizationId: string): Promise<{
  open_positions: number;
  total_applications: number;
  by_stage: Record<string, number>;
  avg_time_to_hire: number;
}> {
  const { data: postings } = await supabase
    .from('job_postings')
    .select('status')
    .eq('organization_id', organizationId);

  const { data: applications } = await supabase
    .from('job_applications')
    .select('stage')
    .eq('organization_id', organizationId);

  const by_stage: Record<string, number> = {};
  applications?.forEach(app => {
    by_stage[app.stage] = (by_stage[app.stage] || 0) + 1;
  });

  return {
    open_positions: postings?.filter(p => p.status === 'open').length || 0,
    total_applications: applications?.length || 0,
    by_stage,
    avg_time_to_hire: 0, // TODO: Calculate
  };
}
