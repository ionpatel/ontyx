import { createClient } from '@/lib/supabase/client';

export interface Technician {
  id: string;
  organization_id: string;
  employee_id?: string;
  name: string;
  phone?: string;
  email?: string;
  skills?: string[];
  certifications?: string[];
  service_areas?: string[];
  status: 'available' | 'on_job' | 'break' | 'offline';
  current_latitude?: number;
  current_longitude?: number;
  last_location_update?: string;
  color?: string;
  is_active: boolean;
}

export interface FieldWorkOrder {
  id: string;
  organization_id: string;
  wo_number: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  service_address: string;
  latitude?: number;
  longitude?: number;
  work_type?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'unassigned' | 'assigned' | 'en_route' | 'in_progress' | 'completed' | 'cancelled';
  technician_id?: string;
  scheduled_date?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  estimated_duration?: number;
  actual_start_time?: string;
  actual_end_time?: string;
  description?: string;
  work_performed?: string;
  parts_used?: any;
  labor_hours?: number;
  labor_total?: number;
  parts_total?: number;
  total?: number;
  customer_signature?: string;
  photos?: string[];
  notes?: string;
  invoice_id?: string;
  created_at: string;
  updated_at: string;
  // Joined
  technician?: Technician;
  customer?: { id: string; name: string; phone?: string };
}

const WORK_TYPES = ['Installation', 'Repair', 'Maintenance', 'Inspection', 'Consultation', 'Emergency'];

class FieldServiceManager {
  private supabase = createClient();

  // ==================== TECHNICIANS ====================

  async getTechnicians(organizationId: string) {
    const { data, error } = await this.supabase
      .from('technicians')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data as Technician[];
  }

  async getTechnician(id: string) {
    const { data, error } = await this.supabase
      .from('technicians')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Technician;
  }

  async createTechnician(technician: Omit<Technician, 'id'>) {
    const { data, error } = await this.supabase
      .from('technicians')
      .insert(technician)
      .select()
      .single();

    if (error) throw error;
    return data as Technician;
  }

  async updateTechnician(id: string, updates: Partial<Technician>) {
    const { data, error } = await this.supabase
      .from('technicians')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Technician;
  }

  async updateTechnicianStatus(id: string, status: Technician['status']) {
    return this.updateTechnician(id, { status });
  }

  async updateTechnicianLocation(id: string, latitude: number, longitude: number) {
    return this.updateTechnician(id, {
      current_latitude: latitude,
      current_longitude: longitude,
      last_location_update: new Date().toISOString(),
    });
  }

  // ==================== WORK ORDERS ====================

  async getWorkOrders(organizationId: string, status?: string) {
    let query = this.supabase
      .from('field_work_orders')
      .select(`
        *,
        technician:technicians(*),
        customer:contacts(id, name, phone)
      `)
      .eq('organization_id', organizationId)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_start_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as FieldWorkOrder[];
  }

  async getWorkOrder(id: string) {
    const { data, error } = await this.supabase
      .from('field_work_orders')
      .select(`
        *,
        technician:technicians(*),
        customer:contacts(id, name, phone, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as FieldWorkOrder;
  }

  async getTechnicianWorkOrders(technicianId: string, date?: string) {
    let query = this.supabase
      .from('field_work_orders')
      .select('*')
      .eq('technician_id', technicianId)
      .not('status', 'in', '("completed","cancelled")')
      .order('scheduled_date')
      .order('scheduled_start_time');

    if (date) {
      query = query.eq('scheduled_date', date);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as FieldWorkOrder[];
  }

  async createWorkOrder(workOrder: Omit<FieldWorkOrder, 'id' | 'wo_number' | 'created_at' | 'updated_at' | 'technician' | 'customer'>) {
    // Generate WO number
    const year = new Date().getFullYear();
    const { count } = await this.supabase
      .from('field_work_orders')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', workOrder.organization_id);

    const woNumber = `FS-${year}-${String((count || 0) + 1).padStart(4, '0')}`;

    const { data, error } = await this.supabase
      .from('field_work_orders')
      .insert({ ...workOrder, wo_number: woNumber })
      .select()
      .single();

    if (error) throw error;
    return data as FieldWorkOrder;
  }

  async updateWorkOrder(id: string, updates: Partial<FieldWorkOrder>) {
    const { data, error } = await this.supabase
      .from('field_work_orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FieldWorkOrder;
  }

  async assignWorkOrder(id: string, technicianId: string) {
    return this.updateWorkOrder(id, { technician_id: technicianId, status: 'assigned' });
  }

  async startEnRoute(id: string) {
    return this.updateWorkOrder(id, { status: 'en_route' });
  }

  async startWork(id: string) {
    return this.updateWorkOrder(id, { 
      status: 'in_progress',
      actual_start_time: new Date().toISOString(),
    });
  }

  async completeWork(id: string, workPerformed: string, laborHours: number) {
    const laborRate = 85; // $85/hr standard rate
    const laborTotal = laborHours * laborRate;
    
    return this.updateWorkOrder(id, {
      status: 'completed',
      actual_end_time: new Date().toISOString(),
      work_performed: workPerformed,
      labor_hours: laborHours,
      labor_total: laborTotal,
      total: laborTotal,
    });
  }

  async cancelWorkOrder(id: string) {
    return this.updateWorkOrder(id, { status: 'cancelled' });
  }

  // ==================== DISPATCH ====================

  async getUnassignedWorkOrders(organizationId: string) {
    const { data, error } = await this.supabase
      .from('field_work_orders')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'unassigned')
      .order('priority', { ascending: false })
      .order('scheduled_date');

    if (error) throw error;
    return data as FieldWorkOrder[];
  }

  async getAvailableTechnicians(organizationId: string) {
    const { data, error } = await this.supabase
      .from('technicians')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('status', 'available');

    if (error) throw error;
    return data as Technician[];
  }

  // ==================== STATS ====================

  async getStats(organizationId: string) {
    const today = new Date().toISOString().split('T')[0];

    const [workOrdersResult, techniciansResult] = await Promise.all([
      this.supabase
        .from('field_work_orders')
        .select('id, status, total, scheduled_date')
        .eq('organization_id', organizationId),
      this.supabase
        .from('technicians')
        .select('id, status')
        .eq('organization_id', organizationId)
        .eq('is_active', true),
    ]);

    const workOrders = workOrdersResult.data || [];
    const technicians = techniciansResult.data || [];

    const todayOrders = workOrders.filter(wo => wo.scheduled_date === today);
    const completedToday = todayOrders.filter(wo => wo.status === 'completed');

    return {
      unassigned: workOrders.filter(wo => wo.status === 'unassigned').length,
      inProgress: workOrders.filter(wo => ['assigned', 'en_route', 'in_progress'].includes(wo.status)).length,
      todayScheduled: todayOrders.length,
      completedToday: completedToday.length,
      totalTechnicians: technicians.length,
      availableTechnicians: technicians.filter(t => t.status === 'available').length,
      todayRevenue: completedToday.reduce((sum, wo) => sum + (wo.total || 0), 0),
    };
  }
}

export const fieldServiceManager = new FieldServiceManager();
export { WORK_TYPES };
