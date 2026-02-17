// Helpdesk / Support Tickets Types

export interface TicketCategory {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  color: string;
  sla_hours: number | null;
  parent_id: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  organization_id: string;
  ticket_number: string;
  subject: string;
  description: string | null;
  category_id: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  assigned_to: string | null;
  team_id: string | null;
  contact_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  sla_deadline: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  source: 'web' | 'email' | 'phone' | 'chat' | 'api';
  is_sensitive: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  category?: TicketCategory;
  assignee?: { email: string; full_name?: string };
  contact?: { id: string; name: string };
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string | null;
  message: string;
  is_internal: boolean;
  attachments: { name: string; url: string; size: number }[];
  created_at: string;
  // Joined
  user?: { email: string; full_name?: string };
}

export interface CreateTicketInput {
  subject: string;
  description?: string;
  category_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  contact_id?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  assigned_to?: string;
}

export interface CreateTicketMessageInput {
  message: string;
  is_internal?: boolean;
  attachments?: File[];
}
