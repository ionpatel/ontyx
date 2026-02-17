import { createClient } from '@/lib/supabase/client';

export interface MarketingCampaign {
  id: string;
  organization_id: string;
  name: string;
  type: 'email' | 'sms' | 'social';
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed';
  subject?: string;
  content?: string;
  html_content?: string;
  template_id?: string;
  audience_list_id?: string;
  audience_size: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  unsubscribed_count: number;
  bounced_count: number;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Computed
  open_rate?: number;
  click_rate?: number;
}

export interface MarketingList {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  type: 'static' | 'dynamic';
  filter_criteria?: any;
  contact_count: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface MarketingListMember {
  id: string;
  list_id: string;
  contact_id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  subscribed_at: string;
  unsubscribed_at?: string;
  is_active: boolean;
}

export interface MarketingAutomation {
  id: string;
  organization_id: string;
  name: string;
  trigger_type: string;
  trigger_config?: any;
  status: 'draft' | 'active' | 'paused';
  steps?: any;
  emails_sent: number;
  conversions: number;
  created_at: string;
  updated_at: string;
}

const AUTOMATION_TRIGGERS = [
  { value: 'new_subscriber', label: 'New Subscriber' },
  { value: 'abandoned_cart', label: 'Abandoned Cart' },
  { value: 'purchase', label: 'After Purchase' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'no_activity', label: 'No Activity (Win-back)' },
  { value: 'welcome', label: 'Welcome Series' },
];

class MarketingService {
  private supabase = createClient();

  // ==================== CAMPAIGNS ====================

  async getCampaigns(organizationId: string, status?: string) {
    let query = this.supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(c => ({
      ...c,
      open_rate: c.delivered_count > 0 ? (c.opened_count / c.delivered_count) * 100 : 0,
      click_rate: c.opened_count > 0 ? (c.clicked_count / c.opened_count) * 100 : 0,
    })) as MarketingCampaign[];
  }

  async getCampaign(id: string) {
    const { data, error } = await this.supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return {
      ...data,
      open_rate: data.delivered_count > 0 ? (data.opened_count / data.delivered_count) * 100 : 0,
      click_rate: data.opened_count > 0 ? (data.clicked_count / data.opened_count) * 100 : 0,
    } as MarketingCampaign;
  }

  async createCampaign(campaign: Omit<MarketingCampaign, 'id' | 'created_at' | 'updated_at' | 'open_rate' | 'click_rate'>) {
    const { data, error } = await this.supabase
      .from('marketing_campaigns')
      .insert(campaign)
      .select()
      .single();

    if (error) throw error;
    return data as MarketingCampaign;
  }

  async updateCampaign(id: string, updates: Partial<MarketingCampaign>) {
    const { data, error } = await this.supabase
      .from('marketing_campaigns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MarketingCampaign;
  }

  async scheduleCampaign(id: string, scheduledAt: string) {
    return this.updateCampaign(id, { status: 'scheduled', scheduled_at: scheduledAt });
  }

  async startCampaign(id: string) {
    return this.updateCampaign(id, { status: 'running', started_at: new Date().toISOString() });
  }

  async pauseCampaign(id: string) {
    return this.updateCampaign(id, { status: 'paused' });
  }

  async completeCampaign(id: string) {
    return this.updateCampaign(id, { status: 'completed', completed_at: new Date().toISOString() });
  }

  async deleteCampaign(id: string) {
    const { error } = await this.supabase
      .from('marketing_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== LISTS ====================

  async getLists(organizationId: string) {
    const { data, error } = await this.supabase
      .from('marketing_lists')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) throw error;
    return data as MarketingList[];
  }

  async getList(id: string) {
    const { data, error } = await this.supabase
      .from('marketing_lists')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as MarketingList;
  }

  async createList(list: Omit<MarketingList, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('marketing_lists')
      .insert(list)
      .select()
      .single();

    if (error) throw error;
    return data as MarketingList;
  }

  async updateList(id: string, updates: Partial<MarketingList>) {
    const { data, error } = await this.supabase
      .from('marketing_lists')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MarketingList;
  }

  async deleteList(id: string) {
    const { error } = await this.supabase
      .from('marketing_lists')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== LIST MEMBERS ====================

  async getListMembers(listId: string) {
    const { data, error } = await this.supabase
      .from('marketing_list_members')
      .select('*')
      .eq('list_id', listId)
      .eq('is_active', true)
      .order('subscribed_at', { ascending: false });

    if (error) throw error;
    return data as MarketingListMember[];
  }

  async addMemberToList(member: Omit<MarketingListMember, 'id' | 'subscribed_at'>) {
    const { data, error } = await this.supabase
      .from('marketing_list_members')
      .insert({ ...member, subscribed_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;

    // Update list count
    await this.updateListCount(member.list_id);

    return data as MarketingListMember;
  }

  async removeMemberFromList(id: string, listId: string) {
    const { error } = await this.supabase
      .from('marketing_list_members')
      .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    await this.updateListCount(listId);
  }

  async updateListCount(listId: string) {
    const { count } = await this.supabase
      .from('marketing_list_members')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', listId)
      .eq('is_active', true);

    await this.supabase
      .from('marketing_lists')
      .update({ contact_count: count || 0 })
      .eq('id', listId);
  }

  // ==================== AUTOMATIONS ====================

  async getAutomations(organizationId: string) {
    const { data, error } = await this.supabase
      .from('marketing_automations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) throw error;
    return data as MarketingAutomation[];
  }

  async getAutomation(id: string) {
    const { data, error } = await this.supabase
      .from('marketing_automations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as MarketingAutomation;
  }

  async createAutomation(automation: Omit<MarketingAutomation, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('marketing_automations')
      .insert(automation)
      .select()
      .single();

    if (error) throw error;
    return data as MarketingAutomation;
  }

  async updateAutomation(id: string, updates: Partial<MarketingAutomation>) {
    const { data, error } = await this.supabase
      .from('marketing_automations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MarketingAutomation;
  }

  async activateAutomation(id: string) {
    return this.updateAutomation(id, { status: 'active' });
  }

  async pauseAutomation(id: string) {
    return this.updateAutomation(id, { status: 'paused' });
  }

  // ==================== STATS ====================

  async getStats(organizationId: string) {
    const [campaignsResult, listsResult, automationsResult] = await Promise.all([
      this.supabase
        .from('marketing_campaigns')
        .select('id, status, sent_count, opened_count, clicked_count')
        .eq('organization_id', organizationId),
      this.supabase
        .from('marketing_lists')
        .select('id, contact_count')
        .eq('organization_id', organizationId),
      this.supabase
        .from('marketing_automations')
        .select('id, status, emails_sent')
        .eq('organization_id', organizationId),
    ]);

    const campaigns = campaignsResult.data || [];
    const lists = listsResult.data || [];
    const automations = automationsResult.data || [];

    const totalSent = campaigns.reduce((sum, c) => sum + c.sent_count, 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + c.opened_count, 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + c.clicked_count, 0);

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'running').length,
      totalLists: lists.length,
      totalContacts: lists.reduce((sum, l) => sum + l.contact_count, 0),
      totalAutomations: automations.length,
      activeAutomations: automations.filter(a => a.status === 'active').length,
      emailsSent: totalSent,
      avgOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      avgClickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
    };
  }
}

export const marketingService = new MarketingService();
export { AUTOMATION_TRIGGERS };
