// Performance Appraisals Types

export interface AppraisalTemplate {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  sections: AppraisalSection[];
  is_active: boolean;
  created_at: string;
}

export interface AppraisalSection {
  name: string;
  description?: string;
  weight: number; // Percentage weight for overall score
  questions: AppraisalQuestion[];
}

export interface AppraisalQuestion {
  id: string;
  text: string;
  type: 'rating' | 'text' | 'yes_no';
  required: boolean;
  max_rating?: number; // For rating type
}

export interface Appraisal {
  id: string;
  organization_id: string;
  employee_id: string;
  reviewer_id: string;
  template_id: string | null;
  review_period_start: string;
  review_period_end: string;
  status: 'draft' | 'self_review' | 'manager_review' | 'completed' | 'acknowledged';
  self_assessment: Record<string, any>;
  manager_assessment: Record<string, any>;
  overall_rating: number | null;
  goals_achieved: string | null;
  goals_next_period: string | null;
  employee_comments: string | null;
  manager_comments: string | null;
  employee_signed_at: string | null;
  manager_signed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  employee?: { id: string; first_name: string; last_name: string };
  reviewer?: { id: string; first_name: string; last_name: string };
  template?: AppraisalTemplate;
}

export interface CreateAppraisalInput {
  employee_id: string;
  reviewer_id: string;
  template_id?: string;
  review_period_start: string;
  review_period_end: string;
}
