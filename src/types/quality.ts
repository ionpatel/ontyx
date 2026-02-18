// Quality Control Types

export interface QualityCheck {
  id: string;
  organization_id: string;
  check_number: string;
  product_id: string | null;
  equipment_id: string | null;
  purchase_order_id: string | null;
  check_type: 'incoming' | 'in_process' | 'final' | 'random';
  status: 'pending' | 'passed' | 'failed' | 'conditional';
  inspector_id: string | null;
  inspection_date: string | null;
  criteria: QualityCriterion[];
  results: QualityResult[];
  corrective_action: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  product?: { id: string; name: string; sku: string };
  equipment?: { id: string; name: string };
  inspector?: { id: string; first_name: string; last_name: string };
}

export interface QualityCriterion {
  name: string;
  description?: string;
  required: boolean;
  type: 'pass_fail' | 'measurement' | 'visual';
  min_value?: number;
  max_value?: number;
  unit?: string;
}

export interface QualityResult {
  criterion_name: string;
  passed: boolean;
  value?: number | string;
  notes?: string;
}

export interface CreateQualityCheckInput {
  product_id?: string;
  equipment_id?: string;
  purchase_order_id?: string;
  check_type: 'incoming' | 'in_process' | 'final' | 'random';
  criteria?: QualityCriterion[];
  inspector_id?: string;
  status?: 'pending' | 'passed' | 'failed' | 'conditional';
  notes?: string;
  inspection_date?: string;
}
