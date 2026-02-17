// Subscriptions / Recurring Billing Service
import { createClient } from '@/lib/supabase/client';
import type { SubscriptionPlan, Subscription, CreateSubscriptionInput } from '@/types/subscriptions';
import { addDays, addWeeks, addMonths, addQuarters, addYears, format } from 'date-fns';

const supabase = createClient();

// Plans
export async function getSubscriptionPlans(organizationId: string): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('price');
  if (error) throw error;
  return data || [];
}

export async function createSubscriptionPlan(
  organizationId: string,
  input: Partial<SubscriptionPlan>
): Promise<SubscriptionPlan> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .insert({ organization_id: organizationId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSubscriptionPlan(
  planId: string,
  updates: Partial<SubscriptionPlan>
): Promise<SubscriptionPlan> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .update(updates)
    .eq('id', planId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Subscriptions
function getNextBillingDate(startDate: Date, interval: string): Date {
  switch (interval) {
    case 'daily': return addDays(startDate, 1);
    case 'weekly': return addWeeks(startDate, 1);
    case 'monthly': return addMonths(startDate, 1);
    case 'quarterly': return addQuarters(startDate, 1);
    case 'yearly': return addYears(startDate, 1);
    default: return addMonths(startDate, 1);
  }
}

export async function getSubscriptions(
  organizationId: string,
  options?: { status?: string; contactId?: string }
): Promise<Subscription[]> {
  let query = supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(*),
      contact:contacts(id, name, email)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);
  if (options?.contactId) query = query.eq('contact_id', options.contactId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getSubscription(subscriptionId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(*),
      contact:contacts(id, name, email)
    `)
    .eq('id', subscriptionId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createSubscription(
  organizationId: string,
  input: CreateSubscriptionInput
): Promise<Subscription> {
  // Get plan details
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', input.plan_id)
    .single();
  
  if (!plan) throw new Error('Plan not found');

  const startDate = input.start_date ? new Date(input.start_date) : new Date();
  const trialDays = input.trial_days ?? plan.trial_days;
  const trialEnd = trialDays > 0 ? addDays(startDate, trialDays) : null;
  
  const periodStart = trialEnd || startDate;
  const periodEnd = getNextBillingDate(periodStart, plan.billing_interval);

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      organization_id: organizationId,
      plan_id: input.plan_id,
      contact_id: input.contact_id,
      status: trialDays > 0 ? 'trialing' : 'active',
      start_date: format(startDate, 'yyyy-MM-dd'),
      current_period_start: format(periodStart, 'yyyy-MM-dd'),
      current_period_end: format(periodEnd, 'yyyy-MM-dd'),
      trial_end: trialEnd ? format(trialEnd, 'yyyy-MM-dd') : null,
      next_billing_date: format(periodEnd, 'yyyy-MM-dd'),
      auto_renew: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelSubscription(
  subscriptionId: string,
  immediate: boolean = false
): Promise<Subscription> {
  const updates: Partial<Subscription> = {
    cancelled_at: new Date().toISOString(),
    auto_renew: false,
  };

  if (immediate) {
    updates.status = 'cancelled';
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function reactivateSubscription(subscriptionId: string): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      cancelled_at: null,
      auto_renew: true,
    })
    .eq('id', subscriptionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function changePlan(subscriptionId: string, newPlanId: string): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ plan_id: newPlanId })
    .eq('id', subscriptionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Revenue metrics
export async function getSubscriptionMetrics(organizationId: string): Promise<{
  mrr: number;
  arr: number;
  active_count: number;
  trialing_count: number;
  churn_rate: number;
}> {
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select(`
      status,
      plan:subscription_plans(price, billing_interval)
    `)
    .eq('organization_id', organizationId);

  let mrr = 0;
  let active_count = 0;
  let trialing_count = 0;

  subscriptions?.forEach(sub => {
    if (sub.status === 'active' && sub.plan) {
      active_count++;
      const monthlyPrice = calculateMonthlyPrice(sub.plan.price, sub.plan.billing_interval);
      mrr += monthlyPrice;
    }
    if (sub.status === 'trialing') trialing_count++;
  });

  return {
    mrr,
    arr: mrr * 12,
    active_count,
    trialing_count,
    churn_rate: 0, // TODO: Calculate from historical data
  };
}

function calculateMonthlyPrice(price: number, interval: string): number {
  switch (interval) {
    case 'daily': return price * 30;
    case 'weekly': return price * 4.33;
    case 'monthly': return price;
    case 'quarterly': return price / 3;
    case 'yearly': return price / 12;
    default: return price;
  }
}
