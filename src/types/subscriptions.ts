// Subscriptions / Recurring Billing Types

export interface SubscriptionPlan {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  trial_days: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string;
  contact_id: string;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
  start_date: string;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  cancelled_at: string | null;
  next_billing_date: string | null;
  last_billing_date: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  plan?: SubscriptionPlan;
  contact?: { id: string; name: string; email: string };
}

export interface CreateSubscriptionInput {
  plan_id: string;
  contact_id: string;
  start_date?: string;
  trial_days?: number;
}
