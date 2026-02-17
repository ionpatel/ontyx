import { createClient } from '@/lib/supabase/client';

export interface Vehicle {
  id: string;
  organization_id: string;
  customer_id?: string;
  vin?: string;
  license_plate?: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  mileage?: number;
  last_service_date?: string;
  last_service_mileage?: number;
  notes?: string;
  customer?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
}

export interface AutoService {
  id: string;
  organization_id: string;
  name: string;
  category?: string;
  description?: string;
  labor_hours?: number;
  labor_rate?: number;
  is_active: boolean;
}

export interface AutoWorkOrder {
  id: string;
  organization_id: string;
  wo_number: string;
  vehicle_id: string;
  customer_id?: string;
  status: 'estimate' | 'approved' | 'in_progress' | 'completed' | 'invoiced' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  technician_id?: string;
  odometer_in?: number;
  odometer_out?: number;
  customer_concern?: string;
  diagnosis?: string;
  recommendations?: string;
  promised_date?: string;
  completed_date?: string;
  labor_total: number;
  parts_total: number;
  supplies_total: number;
  subtotal: number;
  tax: number;
  total: number;
  invoice_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  vehicle?: Vehicle;
  customer?: { id: string; name: string; phone?: string };
  technician?: { id: string; first_name: string; last_name: string };
  services?: AutoWorkOrderService[];
  parts?: AutoWorkOrderPart[];
}

export interface AutoWorkOrderService {
  id: string;
  work_order_id: string;
  service_id?: string;
  service_name: string;
  labor_hours?: number;
  labor_rate?: number;
  labor_total?: number;
  technician_id?: string;
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
}

export interface AutoWorkOrderPart {
  id: string;
  work_order_id: string;
  work_order_service_id?: string;
  product_id?: string;
  part_number?: string;
  description: string;
  quantity: number;
  unit_cost?: number;
  unit_price?: number;
  total?: number;
}

export interface VehicleServiceHistory {
  id: string;
  vehicle_id: string;
  work_order_id?: string;
  service_date: string;
  mileage?: number;
  service_type: string;
  description?: string;
  cost?: number;
  performed_by?: string;
  notes?: string;
}

class AutoShopService {
  private supabase = createClient();

  // ==================== VEHICLES ====================

  async getVehicles(organizationId: string) {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select(`
        *,
        customer:contacts(id, name, phone, email)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Vehicle[];
  }

  async getVehicle(id: string) {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select(`
        *,
        customer:contacts(id, name, phone, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Vehicle;
  }

  async getCustomerVehicles(customerId: string) {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId)
      .order('year', { ascending: false });

    if (error) throw error;
    return data as Vehicle[];
  }

  async searchVehicles(organizationId: string, query: string) {
    const { data, error } = await this.supabase
      .from('vehicles')
      .select(`
        *,
        customer:contacts(id, name, phone)
      `)
      .eq('organization_id', organizationId)
      .or(`vin.ilike.%${query}%,license_plate.ilike.%${query}%,make.ilike.%${query}%,model.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;
    return data as Vehicle[];
  }

  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'customer'>) {
    const { data, error } = await this.supabase
      .from('vehicles')
      .insert(vehicle)
      .select(`
        *,
        customer:contacts(id, name, phone, email)
      `)
      .single();

    if (error) throw error;
    return data as Vehicle;
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>) {
    const { data, error } = await this.supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        customer:contacts(id, name, phone, email)
      `)
      .single();

    if (error) throw error;
    return data as Vehicle;
  }

  async deleteVehicle(id: string) {
    const { error } = await this.supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== WORK ORDERS ====================

  async getWorkOrders(organizationId: string, status?: string) {
    let query = this.supabase
      .from('auto_work_orders')
      .select(`
        *,
        vehicle:vehicles(*),
        customer:contacts(id, name, phone),
        technician:employees(id, first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as AutoWorkOrder[];
  }

  async getWorkOrder(id: string) {
    const { data, error } = await this.supabase
      .from('auto_work_orders')
      .select(`
        *,
        vehicle:vehicles(*),
        customer:contacts(id, name, phone, email),
        technician:employees(id, first_name, last_name),
        services:auto_work_order_services(*),
        parts:auto_work_order_parts(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AutoWorkOrder;
  }

  async getVehicleWorkOrders(vehicleId: string) {
    const { data, error } = await this.supabase
      .from('auto_work_orders')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as AutoWorkOrder[];
  }

  async createWorkOrder(workOrder: Omit<AutoWorkOrder, 'id' | 'wo_number' | 'created_at' | 'updated_at' | 'vehicle' | 'customer' | 'technician' | 'services' | 'parts'>) {
    // Generate WO number
    const year = new Date().getFullYear();
    const { count } = await this.supabase
      .from('auto_work_orders')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', workOrder.organization_id);

    const woNumber = `WO-${year}-${String((count || 0) + 1).padStart(4, '0')}`;

    const { data, error } = await this.supabase
      .from('auto_work_orders')
      .insert({ ...workOrder, wo_number: woNumber })
      .select(`
        *,
        vehicle:vehicles(*),
        customer:contacts(id, name, phone)
      `)
      .single();

    if (error) throw error;
    return data as AutoWorkOrder;
  }

  async updateWorkOrder(id: string, updates: Partial<AutoWorkOrder>) {
    const { data, error } = await this.supabase
      .from('auto_work_orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AutoWorkOrder;
  }

  async updateWorkOrderStatus(id: string, status: AutoWorkOrder['status']) {
    const updates: Partial<AutoWorkOrder> = { status };
    if (status === 'completed') {
      updates.completed_date = new Date().toISOString();
    }
    return this.updateWorkOrder(id, updates);
  }

  async approveEstimate(id: string) {
    return this.updateWorkOrderStatus(id, 'approved');
  }

  async startWork(id: string) {
    return this.updateWorkOrderStatus(id, 'in_progress');
  }

  async completeWork(id: string) {
    return this.updateWorkOrderStatus(id, 'completed');
  }

  // ==================== WORK ORDER SERVICES ====================

  async addServiceToWorkOrder(service: Omit<AutoWorkOrderService, 'id'>) {
    const { data, error } = await this.supabase
      .from('auto_work_order_services')
      .insert(service)
      .select()
      .single();

    if (error) throw error;

    // Recalculate totals
    await this.recalculateWorkOrderTotals(service.work_order_id);

    return data as AutoWorkOrderService;
  }

  async removeServiceFromWorkOrder(id: string, workOrderId: string) {
    const { error } = await this.supabase
      .from('auto_work_order_services')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Recalculate totals
    await this.recalculateWorkOrderTotals(workOrderId);
  }

  // ==================== WORK ORDER PARTS ====================

  async addPartToWorkOrder(part: Omit<AutoWorkOrderPart, 'id'>) {
    const { data, error } = await this.supabase
      .from('auto_work_order_parts')
      .insert(part)
      .select()
      .single();

    if (error) throw error;

    // Recalculate totals
    await this.recalculateWorkOrderTotals(part.work_order_id);

    return data as AutoWorkOrderPart;
  }

  async removePartFromWorkOrder(id: string, workOrderId: string) {
    const { error } = await this.supabase
      .from('auto_work_order_parts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Recalculate totals
    await this.recalculateWorkOrderTotals(workOrderId);
  }

  async recalculateWorkOrderTotals(workOrderId: string) {
    const { data: services } = await this.supabase
      .from('auto_work_order_services')
      .select('labor_total')
      .eq('work_order_id', workOrderId);

    const { data: parts } = await this.supabase
      .from('auto_work_order_parts')
      .select('total')
      .eq('work_order_id', workOrderId);

    const laborTotal = services?.reduce((sum, s) => sum + (s.labor_total || 0), 0) || 0;
    const partsTotal = parts?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
    const subtotal = laborTotal + partsTotal;
    const tax = subtotal * 0.13; // HST
    const total = subtotal + tax;

    await this.supabase
      .from('auto_work_orders')
      .update({
        labor_total: laborTotal,
        parts_total: partsTotal,
        subtotal,
        tax,
        total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workOrderId);
  }

  // ==================== SERVICE HISTORY ====================

  async getVehicleServiceHistory(vehicleId: string) {
    const { data, error } = await this.supabase
      .from('vehicle_service_history')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('service_date', { ascending: false });

    if (error) throw error;
    return data as VehicleServiceHistory[];
  }

  async addServiceHistory(history: Omit<VehicleServiceHistory, 'id'>) {
    const { data, error } = await this.supabase
      .from('vehicle_service_history')
      .insert(history)
      .select()
      .single();

    if (error) throw error;
    return data as VehicleServiceHistory;
  }

  // ==================== STATS ====================

  async getStats(organizationId: string) {
    const today = new Date().toISOString().split('T')[0];

    const [workOrdersResult, vehiclesResult] = await Promise.all([
      this.supabase
        .from('auto_work_orders')
        .select('id, status, total, completed_date')
        .eq('organization_id', organizationId),
      this.supabase
        .from('vehicles')
        .select('id')
        .eq('organization_id', organizationId),
    ]);

    const workOrders = workOrdersResult.data || [];
    const vehicles = vehiclesResult.data || [];

    const completedToday = workOrders.filter(wo => 
      wo.status === 'completed' && wo.completed_date?.startsWith(today)
    );

    return {
      activeOrders: workOrders.filter(wo => ['approved', 'in_progress'].includes(wo.status)).length,
      pendingEstimates: workOrders.filter(wo => wo.status === 'estimate').length,
      completedToday: completedToday.length,
      totalVehicles: vehicles.length,
      todayRevenue: completedToday.reduce((sum, wo) => sum + (wo.total || 0), 0),
    };
  }
}

export const autoShopService = new AutoShopService();
