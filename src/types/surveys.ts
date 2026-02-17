// Survey Types

export interface Survey {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  questions: SurveyQuestion[];
  is_anonymous: boolean;
  allow_multiple_responses: boolean;
  status: 'draft' | 'active' | 'closed';
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  response_count?: number;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'single_choice' | 'multiple_choice' | 'rating' | 'date';
  required: boolean;
  options?: string[]; // For choice types
  min_rating?: number;
  max_rating?: number;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  respondent_id: string | null;
  respondent_email: string | null;
  answers: Record<string, any>; // question_id -> answer
  completed_at: string | null;
  created_at: string;
}

export interface CreateSurveyInput {
  title: string;
  description?: string;
  questions: Omit<SurveyQuestion, 'id'>[];
  is_anonymous?: boolean;
  allow_multiple_responses?: boolean;
  starts_at?: string;
  ends_at?: string;
}

export interface SubmitSurveyResponseInput {
  answers: Record<string, any>;
}
