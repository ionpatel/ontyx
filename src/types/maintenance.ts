// Maintenance / Equipment Types

export interface Equipment {
  id: string;
  organization_id: string;
  name: string;
  code: string | null;
  category: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  location: string | null;
  warehouse_id: string | null;
  status: 'operational' | 'maintenance' | 'repair' | 'retired';
  purchase_date: string | null;
  warranty_expiry: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  purchase_price: number | null;
  current_value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRequest {
  id: string;
  organization_id: string;
  equipment_id: string;
  request_number: string;
  maintenance_type: 'preventive' | 'corrective' | 'emergency';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  equipment?: Equipment;
  assignee?: { id: string; first_name: string; last_name: string };
}

export interface CreateEquipmentInput {
  name: string;
  code?: string;
  category?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  location?: string;
  warehouse_id?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  purchase_price?: number;
}

export interface CreateMaintenanceRequestInput {
  equipment_id: string;
  maintenance_type: 'preventive' | 'corrective' | 'emergency';
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  scheduled_date?: string;
  estimated_cost?: number;
}
