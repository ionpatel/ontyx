// Surveys Service
import { createClient } from '@/lib/supabase/client';
import type { Survey, SurveyResponse, CreateSurveyInput, SubmitSurveyResponseInput } from '@/types/surveys';

const supabase = createClient();

export async function getSurveys(
  organizationId: string,
  options?: { status?: string }
): Promise<Survey[]> {
  let query = supabase
    .from('surveys')
    .select(`
      *,
      responses:survey_responses(count)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(s => ({
    ...s,
    response_count: s.responses?.[0]?.count || 0
  }));
}

export async function getSurvey(surveyId: string): Promise<Survey | null> {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', surveyId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createSurvey(
  organizationId: string,
  input: CreateSurveyInput
): Promise<Survey> {
  const questions = input.questions.map((q, idx) => ({
    ...q,
    id: crypto.randomUUID()
  }));

  const { data, error } = await supabase
    .from('surveys')
    .insert({
      organization_id: organizationId,
      title: input.title,
      description: input.description,
      questions,
      is_anonymous: input.is_anonymous || false,
      allow_multiple_responses: input.allow_multiple_responses || false,
      status: 'draft',
      starts_at: input.starts_at,
      ends_at: input.ends_at,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSurvey(
  surveyId: string,
  updates: Partial<Survey>
): Promise<Survey> {
  const { data, error } = await supabase
    .from('surveys')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', surveyId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function publishSurvey(surveyId: string): Promise<Survey> {
  return updateSurvey(surveyId, { status: 'active' });
}

export async function closeSurvey(surveyId: string): Promise<Survey> {
  return updateSurvey(surveyId, { status: 'closed' });
}

export async function deleteSurvey(surveyId: string): Promise<void> {
  const { error } = await supabase.from('surveys').delete().eq('id', surveyId);
  if (error) throw error;
}

// Responses
export async function getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('*')
    .eq('survey_id', surveyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function submitSurveyResponse(
  surveyId: string,
  respondentId: string | null,
  respondentEmail: string | null,
  input: SubmitSurveyResponseInput
): Promise<SurveyResponse> {
  const survey = await getSurvey(surveyId);
  if (!survey) throw new Error('Survey not found');
  if (survey.status !== 'active') throw new Error('Survey is not active');

  // Check if already responded (if not anonymous and not allowing multiple)
  if (!survey.is_anonymous && !survey.allow_multiple_responses && respondentId) {
    const { data: existing } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('survey_id', surveyId)
      .eq('respondent_id', respondentId)
      .single();
    
    if (existing) throw new Error('You have already responded to this survey');
  }

  const { data, error } = await supabase
    .from('survey_responses')
    .insert({
      survey_id: surveyId,
      respondent_id: survey.is_anonymous ? null : respondentId,
      respondent_email: survey.is_anonymous ? null : respondentEmail,
      answers: input.answers,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Analytics
export async function getSurveyResults(surveyId: string): Promise<{
  total_responses: number;
  completion_rate: number;
  question_stats: Record<string, any>;
}> {
  const survey = await getSurvey(surveyId);
  if (!survey) throw new Error('Survey not found');

  const responses = await getSurveyResponses(surveyId);
  
  const question_stats: Record<string, any> = {};
  
  survey.questions.forEach(q => {
    const answers = responses
      .map(r => r.answers[q.id])
      .filter(a => a !== undefined && a !== null && a !== '');
    
    if (q.type === 'single_choice' || q.type === 'multiple_choice') {
      const counts: Record<string, number> = {};
      answers.forEach(a => {
        const values = Array.isArray(a) ? a : [a];
        values.forEach(v => {
          counts[v] = (counts[v] || 0) + 1;
        });
      });
      question_stats[q.id] = {
        type: q.type,
        text: q.text,
        total_answers: answers.length,
        distribution: counts
      };
    } else if (q.type === 'rating') {
      const numericAnswers = answers.map(Number).filter(n => !isNaN(n));
      const avg = numericAnswers.length > 0 
        ? numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length 
        : 0;
      question_stats[q.id] = {
        type: 'rating',
        text: q.text,
        total_answers: numericAnswers.length,
        average: avg,
        min: Math.min(...numericAnswers),
        max: Math.max(...numericAnswers)
      };
    } else {
      question_stats[q.id] = {
        type: q.type,
        text: q.text,
        total_answers: answers.length,
        answers: answers.slice(0, 50) // First 50 for text answers
      };
    }
  });

  const completedResponses = responses.filter(r => r.completed_at).length;

  return {
    total_responses: responses.length,
    completion_rate: responses.length > 0 ? (completedResponses / responses.length) * 100 : 0,
    question_stats
  };
}
