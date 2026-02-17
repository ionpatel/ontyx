import { createClient } from '@/lib/supabase/client';

export interface SalonService {
  id: string;
  organization_id: string;
  name: string;
  category?: string;
  description?: string;
  duration: number;
  price: number;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  color?: string;
  is_active: boolean;
}

export interface SalonStaff {
  id: string;
  organization_id: string;
  employee_id?: string;
  display_name: string;
  role?: string;
  bio?: string;
  photo_url?: string;
  color?: string;
  services: string[];
  is_active: boolean;
}

export interface SalonClient {
  id: string;
  organization_id: string;
  contact_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  preferences?: string;
  allergies?: string;
  notes?: string;
  membership_type?: string;
  membership_expires?: string;
  total_visits: number;
  total_spent: number;
  last_visit?: string;
  referred_by?: string;
}

export interface SalonAppointment {
  id: string;
  organization_id: string;
  client_id?: string;
  staff_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'booked' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  price: number;
  deposit_paid: number;
  notes?: string;
  reminder_sent: boolean;
  // Joined data
  client?: SalonClient;
  staff?: SalonStaff;
  service?: SalonService;
}

export interface SalonPackage {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  services: string[];
  original_price: number;
  package_price: number;
  valid_days: number;
  is_active: boolean;
}

class SalonServiceManager {
  private supabase = createClient();

  // ==================== SERVICES ====================

  async getServices(organizationId: string) {
    const { data, error } = await this.supabase
      .from('salon_services')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data as SalonService[];
  }

  async createService(service: Omit<SalonService, 'id'>) {
    const { data, error } = await this.supabase
      .from('salon_services')
      .insert(service)
      .select()
      .single();

    if (error) throw error;
    return data as SalonService;
  }

  async updateService(id: string, updates: Partial<SalonService>) {
    const { data, error } = await this.supabase
      .from('salon_services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SalonService;
  }

  async deleteService(id: string) {
    const { error } = await this.supabase
      .from('salon_services')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== STAFF ====================

  async getStaff(organizationId: string) {
    const { data, error } = await this.supabase
      .from('salon_staff')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('display_name');

    if (error) throw error;
    return data as SalonStaff[];
  }

  async getStaffAvailability(staffId: string) {
    const { data, error } = await this.supabase
      .from('salon_availability')
      .select('*')
      .eq('staff_id', staffId)
      .eq('is_available', true)
      .order('day_of_week');

    if (error) throw error;
    return data;
  }

  async createStaff(staff: Omit<SalonStaff, 'id'>) {
    const { data, error } = await this.supabase
      .from('salon_staff')
      .insert(staff)
      .select()
      .single();

    if (error) throw error;
    return data as SalonStaff;
  }

  async updateStaff(id: string, updates: Partial<SalonStaff>) {
    const { data, error } = await this.supabase
      .from('salon_staff')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SalonStaff;
  }

  // ==================== CLIENTS ====================

  async getClients(organizationId: string) {
    const { data, error } = await this.supabase
      .from('salon_clients')
      .select('*')
      .eq('organization_id', organizationId)
      .order('last_name', { ascending: true });

    if (error) throw error;
    return data as SalonClient[];
  }

  async getClient(id: string) {
    const { data, error } = await this.supabase
      .from('salon_clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as SalonClient;
  }

  async searchClients(organizationId: string, query: string) {
    const { data, error } = await this.supabase
      .from('salon_clients')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;
    return data as SalonClient[];
  }

  async createClient(client: Omit<SalonClient, 'id' | 'total_visits' | 'total_spent'>) {
    const { data, error } = await this.supabase
      .from('salon_clients')
      .insert({ ...client, total_visits: 0, total_spent: 0 })
      .select()
      .single();

    if (error) throw error;
    return data as SalonClient;
  }

  async updateClient(id: string, updates: Partial<SalonClient>) {
    const { data, error } = await this.supabase
      .from('salon_clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SalonClient;
  }

  async getVIPClients(organizationId: string) {
    const { data, error } = await this.supabase
      .from('salon_clients')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('membership_type', 'VIP')
      .order('total_spent', { ascending: false });

    if (error) throw error;
    return data as SalonClient[];
  }

  // ==================== APPOINTMENTS ====================

  async getAppointments(organizationId: string, date?: string) {
    let query = this.supabase
      .from('salon_appointments')
      .select(`
        *,
        client:salon_clients(*),
        staff:salon_staff(*),
        service:salon_services(*)
      `)
      .eq('organization_id', organizationId)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (date) {
      query = query.eq('appointment_date', date);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as SalonAppointment[];
  }

  async getAppointmentsByStaff(staffId: string, date: string) {
    const { data, error } = await this.supabase
      .from('salon_appointments')
      .select(`
        *,
        client:salon_clients(*),
        service:salon_services(*)
      `)
      .eq('staff_id', staffId)
      .eq('appointment_date', date)
      .order('start_time');

    if (error) throw error;
    return data as SalonAppointment[];
  }

  async getClientAppointments(clientId: string) {
    const { data, error } = await this.supabase
      .from('salon_appointments')
      .select(`
        *,
        staff:salon_staff(*),
        service:salon_services(*)
      `)
      .eq('client_id', clientId)
      .order('appointment_date', { ascending: false });

    if (error) throw error;
    return data as SalonAppointment[];
  }

  async createAppointment(appointment: Omit<SalonAppointment, 'id' | 'client' | 'staff' | 'service'>) {
    const { data, error } = await this.supabase
      .from('salon_appointments')
      .insert(appointment)
      .select(`
        *,
        client:salon_clients(*),
        staff:salon_staff(*),
        service:salon_services(*)
      `)
      .single();

    if (error) throw error;
    return data as SalonAppointment;
  }

  async updateAppointment(id: string, updates: Partial<SalonAppointment>) {
    const { data, error } = await this.supabase
      .from('salon_appointments')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        client:salon_clients(*),
        staff:salon_staff(*),
        service:salon_services(*)
      `)
      .single();

    if (error) throw error;
    return data as SalonAppointment;
  }

  async updateAppointmentStatus(id: string, status: SalonAppointment['status']) {
    return this.updateAppointment(id, { status });
  }

  async completeAppointment(id: string) {
    // Get appointment details
    const { data: apt, error: fetchError } = await this.supabase
      .from('salon_appointments')
      .select('client_id, price')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Update appointment status
    await this.updateAppointmentStatus(id, 'completed');

    // Update client stats
    if (apt.client_id) {
      const { data: client, error: clientError } = await this.supabase
        .from('salon_clients')
        .select('total_visits, total_spent')
        .eq('id', apt.client_id)
        .single();

      if (!clientError && client) {
        await this.supabase
          .from('salon_clients')
          .update({
            total_visits: client.total_visits + 1,
            total_spent: client.total_spent + apt.price,
            last_visit: new Date().toISOString().split('T')[0],
          })
          .eq('id', apt.client_id);
      }
    }
  }

  async cancelAppointment(id: string) {
    return this.updateAppointmentStatus(id, 'cancelled');
  }

  // ==================== PACKAGES ====================

  async getPackages(organizationId: string) {
    const { data, error } = await this.supabase
      .from('salon_packages')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) throw error;
    return data as SalonPackage[];
  }

  async createPackage(pkg: Omit<SalonPackage, 'id'>) {
    const { data, error } = await this.supabase
      .from('salon_packages')
      .insert(pkg)
      .select()
      .single();

    if (error) throw error;
    return data as SalonPackage;
  }

  // ==================== STATS ====================

  async getStats(organizationId: string, date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [appointmentsResult, clientsResult] = await Promise.all([
      this.supabase
        .from('salon_appointments')
        .select('id, status, price')
        .eq('organization_id', organizationId)
        .eq('appointment_date', targetDate),
      this.supabase
        .from('salon_clients')
        .select('id, membership_type, total_spent, total_visits')
        .eq('organization_id', organizationId),
    ]);

    const appointments = appointmentsResult.data || [];
    const clients = clientsResult.data || [];

    const completed = appointments.filter(a => a.status === 'completed');
    
    return {
      todayAppointments: appointments.length,
      checkedIn: appointments.filter(a => a.status === 'checked_in').length,
      inProgress: appointments.filter(a => a.status === 'in_progress').length,
      completed: completed.length,
      todayRevenue: completed.reduce((sum, a) => sum + (a.price || 0), 0),
      totalClients: clients.length,
      vipClients: clients.filter(c => c.membership_type === 'VIP').length,
      avgTicket: clients.length > 0 
        ? clients.reduce((sum, c) => sum + c.total_spent, 0) / clients.reduce((sum, c) => sum + c.total_visits, 0)
        : 0,
    };
  }
}

export const salonService = new SalonServiceManager();
