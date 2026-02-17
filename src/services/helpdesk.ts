// Helpdesk / Support Tickets Service
import { createClient } from '@/lib/supabase/client';
import type { Ticket, TicketCategory, TicketMessage, CreateTicketInput, CreateTicketMessageInput } from '@/types/helpdesk';

const supabase = createClient();

// Categories
export async function getTicketCategories(organizationId: string): Promise<TicketCategory[]> {
  const { data, error } = await supabase
    .from('ticket_categories')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function createTicketCategory(
  organizationId: string,
  input: Partial<TicketCategory>
): Promise<TicketCategory> {
  const { data, error } = await supabase
    .from('ticket_categories')
    .insert({ organization_id: organizationId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Tickets
export async function getTickets(
  organizationId: string,
  options?: { status?: string; priority?: string; assignedTo?: string; search?: string; limit?: number }
): Promise<{ tickets: Ticket[]; count: number }> {
  let query = supabase
    .from('tickets')
    .select(`
      *,
      category:ticket_categories(id, name, color),
      messages:ticket_messages(count)
    `, { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);
  if (options?.priority) query = query.eq('priority', options.priority);
  if (options?.assignedTo) query = query.eq('assigned_to', options.assignedTo);
  if (options?.search) {
    query = query.or(`subject.ilike.%${options.search}%,ticket_number.ilike.%${options.search}%`);
  }
  if (options?.limit) query = query.limit(options.limit);

  const { data, error, count } = await query;
  if (error) throw error;
  return { tickets: data || [], count: count || 0 };
}

export async function getTicket(ticketId: string): Promise<Ticket | null> {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      category:ticket_categories(id, name, color),
      messages:ticket_messages(*, user:auth.users(email))
    `)
    .eq('id', ticketId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createTicket(organizationId: string, input: CreateTicketInput): Promise<Ticket> {
  // Generate ticket number
  const { data: ticketNum } = await supabase.rpc('generate_ticket_number', { org_id: organizationId });

  // Get SLA if category specified
  let slaDeadline = null;
  if (input.category_id) {
    const { data: category } = await supabase
      .from('ticket_categories')
      .select('sla_hours')
      .eq('id', input.category_id)
      .single();
    if (category?.sla_hours) {
      slaDeadline = new Date(Date.now() + category.sla_hours * 60 * 60 * 1000).toISOString();
    }
  }

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      organization_id: organizationId,
      ticket_number: ticketNum || `TKT-${Date.now()}`,
      subject: input.subject,
      description: input.description,
      category_id: input.category_id,
      priority: input.priority || 'medium',
      contact_id: input.contact_id,
      contact_name: input.contact_name,
      contact_email: input.contact_email,
      contact_phone: input.contact_phone,
      assigned_to: input.assigned_to,
      sla_deadline: slaDeadline,
      status: 'open',
      source: 'web',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket> {
  const { data, error } = await supabase
    .from('tickets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function assignTicket(ticketId: string, userId: string): Promise<Ticket> {
  return updateTicket(ticketId, { assigned_to: userId, status: 'in_progress' });
}

export async function resolveTicket(ticketId: string): Promise<Ticket> {
  return updateTicket(ticketId, { status: 'resolved', resolved_at: new Date().toISOString() });
}

export async function closeTicket(ticketId: string): Promise<Ticket> {
  return updateTicket(ticketId, { status: 'closed' });
}

// Messages
export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const { data, error } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addTicketMessage(
  ticketId: string,
  userId: string,
  input: CreateTicketMessageInput
): Promise<TicketMessage> {
  // Handle attachments
  let attachments: { name: string; url: string; size: number }[] = [];
  if (input.attachments?.length) {
    for (const file of input.attachments) {
      const filePath = `tickets/${ticketId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      if (!uploadError) {
        const { data: urlData } = await supabase.storage.from('documents').getPublicUrl(filePath);
        attachments.push({ name: file.name, url: urlData.publicUrl, size: file.size });
      }
    }
  }

  const { data, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      user_id: userId,
      message: input.message,
      is_internal: input.is_internal || false,
      attachments,
    })
    .select()
    .single();
  if (error) throw error;

  // Update first response time if this is first agent response
  const ticket = await getTicket(ticketId);
  if (ticket && !ticket.first_response_at && !input.is_internal) {
    await updateTicket(ticketId, { first_response_at: new Date().toISOString() });
  }

  return data;
}

// Dashboard stats
export async function getTicketStats(organizationId: string): Promise<{
  open: number;
  in_progress: number;
  waiting: number;
  resolved_today: number;
  overdue: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('tickets')
    .select('status, sla_deadline, resolved_at')
    .eq('organization_id', organizationId);
  
  if (error) throw error;
  
  const stats = {
    open: 0,
    in_progress: 0,
    waiting: 0,
    resolved_today: 0,
    overdue: 0,
  };

  const now = new Date();
  data?.forEach(t => {
    if (t.status === 'open') stats.open++;
    if (t.status === 'in_progress') stats.in_progress++;
    if (t.status === 'waiting') stats.waiting++;
    if (t.resolved_at?.startsWith(today)) stats.resolved_today++;
    if (t.sla_deadline && new Date(t.sla_deadline) < now && !['resolved', 'closed'].includes(t.status)) {
      stats.overdue++;
    }
  });

  return stats;
}
