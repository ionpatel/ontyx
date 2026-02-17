// Maintenance / Equipment Service
import { createClient } from '@/lib/supabase/client';
import type { Equipment, MaintenanceRequest, CreateEquipmentInput, CreateMaintenanceRequestInput } from '@/types/maintenance';

const supabase = createClient();

// Equipment
export async function getEquipment(
  organizationId: string,
  options?: { status?: string; category?: string; search?: string }
): Promise<Equipment[]> {
  let query = supabase
    .from('equipment')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name');

  if (options?.status) query = query.eq('status', options.status);
  if (options?.category) query = query.eq('category', options.category);
  if (options?.search) query = query.ilike('name', `%${options.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getEquipmentItem(equipmentId: string): Promise<Equipment | null> {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', equipmentId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createEquipment(
  organizationId: string,
  input: CreateEquipmentInput
): Promise<Equipment> {
  const { data, error } = await supabase
    .from('equipment')
    .insert({
      organization_id: organizationId,
      ...input,
      status: 'operational',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEquipment(
  equipmentId: string,
  updates: Partial<Equipment>
): Promise<Equipment> {
  const { data, error } = await supabase
    .from('equipment')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', equipmentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEquipment(equipmentId: string): Promise<void> {
  const { error } = await supabase.from('equipment').delete().eq('id', equipmentId);
  if (error) throw error;
}

// Maintenance Requests
export async function getMaintenanceRequests(
  organizationId: string,
  options?: { equipmentId?: string; status?: string; priority?: string; assignedTo?: string }
): Promise<MaintenanceRequest[]> {
  let query = supabase
    .from('maintenance_requests')
    .select(`
      *,
      equipment:equipment(id, name, code),
      assignee:employees(id, first_name, last_name)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.equipmentId) query = query.eq('equipment_id', options.equipmentId);
  if (options?.status) query = query.eq('status', options.status);
  if (options?.priority) query = query.eq('priority', options.priority);
  if (options?.assignedTo) query = query.eq('assigned_to', options.assignedTo);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getMaintenanceRequest(requestId: string): Promise<MaintenanceRequest | null> {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      equipment:equipment(*),
      assignee:employees(id, first_name, last_name)
    `)
    .eq('id', requestId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createMaintenanceRequest(
  organizationId: string,
  input: CreateMaintenanceRequestInput
): Promise<MaintenanceRequest> {
  // Generate request number
  const { data: requestNum } = await supabase.rpc('generate_maintenance_number', { org_id: organizationId });

  const { data, error } = await supabase
    .from('maintenance_requests')
    .insert({
      organization_id: organizationId,
      request_number: requestNum || `MNT-${Date.now()}`,
      equipment_id: input.equipment_id,
      maintenance_type: input.maintenance_type,
      description: input.description,
      priority: input.priority || 'medium',
      assigned_to: input.assigned_to,
      scheduled_date: input.scheduled_date,
      estimated_cost: input.estimated_cost,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;

  // Update equipment status if emergency
  if (input.maintenance_type === 'emergency') {
    await updateEquipment(input.equipment_id, { status: 'repair' });
  }

  return data;
}

export async function updateMaintenanceRequest(
  requestId: string,
  updates: Partial<MaintenanceRequest>
): Promise<MaintenanceRequest> {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeMaintenanceRequest(
  requestId: string,
  actualCost?: number
): Promise<MaintenanceRequest> {
  const request = await getMaintenanceRequest(requestId);
  if (!request) throw new Error('Request not found');

  const updated = await updateMaintenanceRequest(requestId, {
    status: 'completed',
    completed_date: new Date().toISOString().split('T')[0],
    actual_cost: actualCost,
  });

  // Update equipment
  await updateEquipment(request.equipment_id, {
    status: 'operational',
    last_maintenance_date: new Date().toISOString().split('T')[0],
  });

  return updated;
}

// Schedule preventive maintenance
export async function schedulePreventiveMaintenance(
  organizationId: string,
  equipmentId: string,
  nextDate: string,
  description: string
): Promise<MaintenanceRequest> {
  // Update equipment next maintenance date
  await updateEquipment(equipmentId, { next_maintenance_date: nextDate });

  return createMaintenanceRequest(organizationId, {
    equipment_id: equipmentId,
    maintenance_type: 'preventive',
    description,
    priority: 'medium',
    scheduled_date: nextDate,
  });
}

// Get equipment due for maintenance
export async function getEquipmentDueForMaintenance(organizationId: string): Promise<Equipment[]> {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('organization_id', organizationId)
    .lte('next_maintenance_date', nextWeek)
    .order('next_maintenance_date');

  if (error) throw error;
  return data || [];
}
