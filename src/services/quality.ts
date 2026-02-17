// Quality Control Service
import { createClient } from '@/lib/supabase/client';
import type { QualityCheck, CreateQualityCheckInput } from '@/types/quality';

const supabase = createClient();

export async function getQualityChecks(
  organizationId: string,
  options?: { productId?: string; status?: string; checkType?: string }
): Promise<QualityCheck[]> {
  let query = supabase
    .from('quality_checks')
    .select(`
      *,
      product:products(id, name, sku),
      equipment:equipment(id, name),
      inspector:employees(id, first_name, last_name)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.productId) query = query.eq('product_id', options.productId);
  if (options?.status) query = query.eq('status', options.status);
  if (options?.checkType) query = query.eq('check_type', options.checkType);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getQualityCheck(checkId: string): Promise<QualityCheck | null> {
  const { data, error } = await supabase
    .from('quality_checks')
    .select(`
      *,
      product:products(id, name, sku),
      equipment:equipment(id, name),
      inspector:employees(id, first_name, last_name)
    `)
    .eq('id', checkId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createQualityCheck(
  organizationId: string,
  input: CreateQualityCheckInput
): Promise<QualityCheck> {
  const { data: checkNum } = await supabase.rpc('generate_quality_check_number', { org_id: organizationId });

  const { data, error } = await supabase
    .from('quality_checks')
    .insert({
      organization_id: organizationId,
      check_number: checkNum || `QC-${Date.now()}`,
      product_id: input.product_id,
      equipment_id: input.equipment_id,
      purchase_order_id: input.purchase_order_id,
      check_type: input.check_type,
      criteria: input.criteria,
      inspector_id: input.inspector_id,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function recordQualityResults(
  checkId: string,
  inspectorId: string,
  results: QualityCheck['results'],
  status: 'passed' | 'failed' | 'conditional',
  correctiveAction?: string
): Promise<QualityCheck> {
  const { data, error } = await supabase
    .from('quality_checks')
    .update({
      results,
      status,
      inspector_id: inspectorId,
      inspection_date: new Date().toISOString(),
      corrective_action: correctiveAction,
      updated_at: new Date().toISOString(),
    })
    .eq('id', checkId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateQualityCheck(
  checkId: string,
  updates: Partial<CreateQualityCheckInput> & { status?: string; notes?: string }
): Promise<QualityCheck> {
  const { data, error } = await supabase
    .from('quality_checks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', checkId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteQualityCheck(checkId: string): Promise<void> {
  const { error } = await supabase
    .from('quality_checks')
    .delete()
    .eq('id', checkId);
  if (error) throw error;
}

export async function getQualityStats(organizationId: string): Promise<{
  total: number;
  passed: number;
  failed: number;
  pending: number;
  pass_rate: number;
}> {
  const { data, error } = await supabase
    .from('quality_checks')
    .select('status')
    .eq('organization_id', organizationId);

  if (error) throw error;

  const stats = { total: 0, passed: 0, failed: 0, pending: 0, pass_rate: 0 };
  data?.forEach(qc => {
    stats.total++;
    if (qc.status === 'passed') stats.passed++;
    if (qc.status === 'failed') stats.failed++;
    if (qc.status === 'pending') stats.pending++;
  });

  stats.pass_rate = stats.total > 0 ? (stats.passed / (stats.passed + stats.failed)) * 100 : 0;
  return stats;
}
