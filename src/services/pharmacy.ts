import { createClient } from '@/lib/supabase/client';

export interface Drug {
  id: string;
  organization_id: string;
  din: string;
  name: string;
  generic_name?: string;
  manufacturer?: string;
  strength?: string;
  form?: string;
  category: 'otc' | 'prescription' | 'controlled' | 'narcotic';
  schedule?: string;
  quantity_on_hand: number;
  reorder_level: number;
  unit_cost: number;
  retail_price: number;
  expiry_date?: string;
  lot_number?: string;
  location?: string;
  supplier_id?: string;
  barcode?: string;
  requires_prescription: boolean;
  is_controlled: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DrugTransaction {
  id: string;
  drug_id: string;
  transaction_type: 'received' | 'dispensed' | 'returned' | 'expired' | 'adjusted';
  quantity: number;
  lot_number?: string;
  reference_number?: string;
  performed_by?: string;
  notes?: string;
  created_at: string;
}

export interface NarcoticCount {
  id: string;
  drug_id: string;
  counted_by: string;
  witnessed_by?: string;
  expected_quantity: number;
  actual_quantity: number;
  discrepancy: number;
  notes?: string;
  counted_at: string;
}

export interface ExpiryAlert {
  id: string;
  drug_id: string;
  drug_name: string;
  din: string;
  quantity: number;
  expiry_date: string;
  days_until_expiry: number;
  lot_number?: string;
  status: 'warning' | 'critical' | 'expired';
}

class PharmacyService {
  private supabase = createClient();

  // ==================== DRUGS ====================

  async getDrugs(organizationId: string) {
    const { data, error } = await this.supabase
      .from('drugs')
      .select(`
        *,
        supplier:contacts(id, name)
      `)
      .eq('organization_id', organizationId)
      .order('name');

    if (error) throw error;
    return data as Drug[];
  }

  async getDrug(id: string) {
    const { data, error } = await this.supabase
      .from('drugs')
      .select(`
        *,
        supplier:contacts(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Drug;
  }

  async searchDrugs(organizationId: string, query: string) {
    const { data, error } = await this.supabase
      .from('drugs')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`name.ilike.%${query}%,din.ilike.%${query}%,generic_name.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;
    return data as Drug[];
  }

  async createDrug(drug: Omit<Drug, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('drugs')
      .insert(drug)
      .select()
      .single();

    if (error) throw error;
    return data as Drug;
  }

  async updateDrug(id: string, updates: Partial<Drug>) {
    const { data, error } = await this.supabase
      .from('drugs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Drug;
  }

  async deleteDrug(id: string) {
    const { error } = await this.supabase
      .from('drugs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== INVENTORY ====================

  async adjustInventory(
    drugId: string,
    quantity: number,
    type: DrugTransaction['transaction_type'],
    referenceNumber?: string,
    notes?: string
  ) {
    const { data: drug, error: fetchError } = await this.supabase
      .from('drugs')
      .select('quantity_on_hand')
      .eq('id', drugId)
      .single();

    if (fetchError) throw fetchError;

    const newQuantity = type === 'received' 
      ? drug.quantity_on_hand + quantity
      : drug.quantity_on_hand - quantity;

    // Update drug quantity
    const { error: updateError } = await this.supabase
      .from('drugs')
      .update({ quantity_on_hand: newQuantity, updated_at: new Date().toISOString() })
      .eq('id', drugId);

    if (updateError) throw updateError;

    // Record transaction
    const { error: transactionError } = await this.supabase
      .from('drug_transactions')
      .insert({
        drug_id: drugId,
        transaction_type: type,
        quantity,
        reference_number: referenceNumber,
        notes,
      });

    if (transactionError) throw transactionError;
  }

  async getTransactionHistory(drugId: string) {
    const { data, error } = await this.supabase
      .from('drug_transactions')
      .select('*')
      .eq('drug_id', drugId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as DrugTransaction[];
  }

  // ==================== EXPIRY MANAGEMENT ====================

  async getExpiryAlerts(organizationId: string, daysThreshold: number = 90): Promise<ExpiryAlert[]> {
    const { data, error } = await this.supabase
      .from('drugs')
      .select('id, name, din, quantity_on_hand, expiry_date, lot_number')
      .eq('organization_id', organizationId)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000).toISOString())
      .order('expiry_date');

    if (error) throw error;

    const today = new Date();
    return (data || []).map(drug => {
      const expiryDate = new Date(drug.expiry_date);
      const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let status: ExpiryAlert['status'] = 'warning';
      if (daysUntil < 0) status = 'expired';
      else if (daysUntil <= 30) status = 'critical';

      return {
        id: drug.id,
        drug_id: drug.id,
        drug_name: drug.name,
        din: drug.din,
        quantity: drug.quantity_on_hand,
        expiry_date: drug.expiry_date,
        days_until_expiry: daysUntil,
        lot_number: drug.lot_number,
        status,
      };
    });
  }

  async getLowStockDrugs(organizationId: string) {
    const { data, error } = await this.supabase
      .from('drugs')
      .select('*')
      .eq('organization_id', organizationId)
      .filter('quantity_on_hand', 'lte', 'reorder_level');

    if (error) throw error;
    return data as Drug[];
  }

  // ==================== CONTROLLED SUBSTANCES ====================

  async getControlledSubstances(organizationId: string) {
    const { data, error } = await this.supabase
      .from('drugs')
      .select('*')
      .eq('organization_id', organizationId)
      .in('category', ['controlled', 'narcotic'])
      .order('name');

    if (error) throw error;
    return data as Drug[];
  }

  async recordNarcoticCount(count: Omit<NarcoticCount, 'id' | 'discrepancy' | 'counted_at'>) {
    const { data, error } = await this.supabase
      .from('narcotic_counts')
      .insert({
        ...count,
        counted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as NarcoticCount;
  }

  async getNarcoticCountHistory(drugId: string) {
    const { data, error } = await this.supabase
      .from('narcotic_counts')
      .select('*')
      .eq('drug_id', drugId)
      .order('counted_at', { ascending: false });

    if (error) throw error;
    return data as NarcoticCount[];
  }

  // ==================== STATS ====================

  async getStats(organizationId: string) {
    const { data: drugs, error } = await this.supabase
      .from('drugs')
      .select('id, category, quantity_on_hand, reorder_level, unit_cost, expiry_date')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const today = new Date();
    const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    return {
      totalProducts: drugs?.length || 0,
      lowStock: drugs?.filter(d => d.quantity_on_hand <= d.reorder_level).length || 0,
      expiringSoon: drugs?.filter(d => d.expiry_date && new Date(d.expiry_date) <= ninetyDaysFromNow && new Date(d.expiry_date) > today).length || 0,
      expired: drugs?.filter(d => d.expiry_date && new Date(d.expiry_date) <= today).length || 0,
      narcotics: drugs?.filter(d => d.category === 'narcotic').length || 0,
      controlled: drugs?.filter(d => d.category === 'controlled').length || 0,
      totalValue: drugs?.reduce((sum, d) => sum + (d.quantity_on_hand * d.unit_cost), 0) || 0,
    };
  }
}

export const pharmacyService = new PharmacyService();
