// Recruitment Types

export interface JobPosting {
  id: string;
  organization_id: string;
  title: string;
  department_id: string | null;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_type: 'hourly' | 'yearly';
  employment_type: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
  remote_option: 'onsite' | 'remote' | 'hybrid';
  location: string | null;
  status: 'draft' | 'open' | 'on_hold' | 'closed' | 'filled';
  published_at: string | null;
  closes_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  department?: { id: string; name: string };
  applications_count?: number;
}

export interface JobApplication {
  id: string;
  organization_id: string;
  job_posting_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  resume_path: string | null;
  cover_letter: string | null;
  stage: 'new' | 'screening' | 'interview' | 'assessment' | 'offer' | 'hired' | 'rejected';
  rating: number | null;
  recruiter_id: string | null;
  interview_date: string | null;
  interview_notes: string | null;
  offered_salary: number | null;
  offer_date: string | null;
  offer_status: 'pending' | 'accepted' | 'declined' | 'negotiating' | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  job_posting?: JobPosting;
  recruiter?: { id: string; first_name: string; last_name: string };
}

export interface CreateJobPostingInput {
  title: string;
  department_id?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  salary_min?: number;
  salary_max?: number;
  salary_type?: 'hourly' | 'yearly';
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
  remote_option?: 'onsite' | 'remote' | 'hybrid';
  location?: string;
}

export interface CreateJobApplicationInput {
  job_posting_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string;
  resume?: File;
  cover_letter?: string;
  source?: string;
}
