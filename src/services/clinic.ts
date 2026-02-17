import { createClient } from '@/lib/supabase/client';

export interface Patient {
  id: string;
  organization_id: string;
  health_card_number?: string;
  health_card_version?: string;
  health_card_expiry?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  family_doctor?: string;
  referring_doctor?: string;
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
  blood_type?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  organization_id: string;
  employee_id?: string;
  billing_number?: string;
  license_number?: string;
  specialty?: string;
  title?: string;
  first_name: string;
  last_name: string;
  credentials?: string;
  color?: string;
  is_active: boolean;
}

export interface BillingCode {
  id: string;
  organization_id: string;
  code: string;
  description: string;
  fee: number;
  province: string;
  category?: string;
  duration_minutes?: number;
  is_active: boolean;
  effective_date?: string;
  end_date?: string;
}

export interface ClinicAppointment {
  id: string;
  organization_id: string;
  patient_id: string;
  provider_id: string;
  billing_code_id?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  appointment_type?: string;
  reason_for_visit?: string;
  chief_complaint?: string;
  diagnosis_codes?: string[];
  notes?: string;
  is_walk_in: boolean;
  reminder_sent: boolean;
  // Joined data
  patient?: Patient;
  provider?: Provider;
  billing_code?: BillingCode;
}

export interface ClinicEncounter {
  id: string;
  organization_id: string;
  patient_id: string;
  provider_id: string;
  appointment_id?: string;
  encounter_date: string;
  chief_complaint?: string;
  history_of_present_illness?: string;
  review_of_systems?: Record<string, any>;
  physical_examination?: Record<string, any>;
  assessment?: string;
  plan?: string;
  diagnosis_codes?: string[];
  procedure_codes?: string[];
  prescriptions?: Record<string, any>;
  referrals?: Record<string, any>;
  follow_up_instructions?: string;
  signed_by?: string;
  signed_at?: string;
}

export interface ClinicBilling {
  id: string;
  organization_id: string;
  patient_id: string;
  provider_id: string;
  encounter_id?: string;
  appointment_id?: string;
  billing_code: string;
  diagnosis_code?: string;
  service_date: string;
  units: number;
  fee: number;
  status: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'paid';
  submission_date?: string;
  payment_date?: string;
  payment_amount?: number;
  rejection_reason?: string;
  claim_number?: string;
  notes?: string;
}

// Ontario OHIP billing codes (commonly used)
export const OHIP_CODES: Omit<BillingCode, 'id' | 'organization_id' | 'is_active'>[] = [
  { code: 'A001A', description: 'Minor Assessment', fee: 33.70, province: 'ON', category: 'Assessment', duration_minutes: 10 },
  { code: 'A003A', description: 'General Assessment', fee: 77.20, province: 'ON', category: 'Assessment', duration_minutes: 30 },
  { code: 'A004A', description: 'General Re-Assessment', fee: 38.35, province: 'ON', category: 'Assessment', duration_minutes: 15 },
  { code: 'A007A', description: 'Intermediate Assessment', fee: 33.70, province: 'ON', category: 'Assessment', duration_minutes: 15 },
  { code: 'A008A', description: 'Mini Assessment', fee: 22.25, province: 'ON', category: 'Assessment', duration_minutes: 5 },
  { code: 'A901A', description: 'House Call Assessment', fee: 107.45, province: 'ON', category: 'Assessment', duration_minutes: 45 },
  { code: 'A005A', description: 'Consultation', fee: 145.70, province: 'ON', category: 'Consultation', duration_minutes: 45 },
  { code: 'A006A', description: 'Repeat Consultation', fee: 70.60, province: 'ON', category: 'Consultation', duration_minutes: 30 },
  { code: 'K130A', description: 'Counselling - Mental Health (to 30 min)', fee: 61.30, province: 'ON', category: 'Counselling', duration_minutes: 30 },
  { code: 'K131A', description: 'Counselling - Other (to 15 min)', fee: 25.00, province: 'ON', category: 'Counselling', duration_minutes: 15 },
  { code: 'K132A', description: 'Counselling - Addiction (to 30 min)', fee: 61.30, province: 'ON', category: 'Counselling', duration_minutes: 30 },
  { code: 'G372A', description: 'ECG - Interpretation', fee: 15.00, province: 'ON', category: 'Diagnostic', duration_minutes: 5 },
  { code: 'G489A', description: 'Injection IM/SC', fee: 6.65, province: 'ON', category: 'Procedure', duration_minutes: 5 },
  { code: 'G590A', description: 'Papanicolaou Smear', fee: 6.65, province: 'ON', category: 'Procedure', duration_minutes: 10 },
  { code: 'E078A', description: 'Annual Health Examination', fee: 127.15, province: 'ON', category: 'Preventive', duration_minutes: 60 },
];

class ClinicService {
  private supabase = createClient();

  // ==================== PATIENTS ====================

  async getPatients(organizationId: string) {
    const { data, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('last_name');

    if (error) throw error;
    return data as Patient[];
  }

  async getPatient(id: string) {
    const { data, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Patient;
  }

  async searchPatients(organizationId: string, query: string) {
    const { data, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,health_card_number.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;
    return data as Patient[];
  }

  async createPatient(patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('patients')
      .insert(patient)
      .select()
      .single();

    if (error) throw error;
    return data as Patient;
  }

  async updatePatient(id: string, updates: Partial<Patient>) {
    const { data, error } = await this.supabase
      .from('patients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Patient;
  }

  async deactivatePatient(id: string) {
    return this.updatePatient(id, { is_active: false });
  }

  // ==================== PROVIDERS ====================

  async getProviders(organizationId: string) {
    const { data, error } = await this.supabase
      .from('providers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('last_name');

    if (error) throw error;
    return data as Provider[];
  }

  async getProvider(id: string) {
    const { data, error } = await this.supabase
      .from('providers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Provider;
  }

  async createProvider(provider: Omit<Provider, 'id'>) {
    const { data, error } = await this.supabase
      .from('providers')
      .insert(provider)
      .select()
      .single();

    if (error) throw error;
    return data as Provider;
  }

  async updateProvider(id: string, updates: Partial<Provider>) {
    const { data, error } = await this.supabase
      .from('providers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Provider;
  }

  // ==================== BILLING CODES ====================

  async getBillingCodes(organizationId: string) {
    const { data, error } = await this.supabase
      .from('billing_codes')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('code');

    if (error) throw error;
    return data as BillingCode[];
  }

  async initializeOHIPCodes(organizationId: string) {
    const codesToInsert = OHIP_CODES.map(code => ({
      ...code,
      organization_id: organizationId,
      is_active: true,
    }));

    const { data, error } = await this.supabase
      .from('billing_codes')
      .upsert(codesToInsert, { onConflict: 'organization_id,code,province' })
      .select();

    if (error) throw error;
    return data as BillingCode[];
  }

  // ==================== APPOINTMENTS ====================

  async getAppointments(organizationId: string, date?: string, providerId?: string) {
    let query = this.supabase
      .from('clinic_appointments')
      .select(`
        *,
        patient:patients(*),
        provider:providers(*),
        billing_code:billing_codes(*)
      `)
      .eq('organization_id', organizationId)
      .order('appointment_date')
      .order('start_time');

    if (date) {
      query = query.eq('appointment_date', date);
    }
    if (providerId) {
      query = query.eq('provider_id', providerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as ClinicAppointment[];
  }

  async getAppointment(id: string) {
    const { data, error } = await this.supabase
      .from('clinic_appointments')
      .select(`
        *,
        patient:patients(*),
        provider:providers(*),
        billing_code:billing_codes(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ClinicAppointment;
  }

  async getPatientAppointments(patientId: string) {
    const { data, error } = await this.supabase
      .from('clinic_appointments')
      .select(`
        *,
        provider:providers(*),
        billing_code:billing_codes(*)
      `)
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });

    if (error) throw error;
    return data as ClinicAppointment[];
  }

  async createAppointment(appointment: Omit<ClinicAppointment, 'id' | 'patient' | 'provider' | 'billing_code'>) {
    const { data, error } = await this.supabase
      .from('clinic_appointments')
      .insert(appointment)
      .select(`
        *,
        patient:patients(*),
        provider:providers(*),
        billing_code:billing_codes(*)
      `)
      .single();

    if (error) throw error;
    return data as ClinicAppointment;
  }

  async updateAppointment(id: string, updates: Partial<ClinicAppointment>) {
    const { data, error } = await this.supabase
      .from('clinic_appointments')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        patient:patients(*),
        provider:providers(*),
        billing_code:billing_codes(*)
      `)
      .single();

    if (error) throw error;
    return data as ClinicAppointment;
  }

  async updateAppointmentStatus(id: string, status: ClinicAppointment['status']) {
    return this.updateAppointment(id, { status });
  }

  async checkInPatient(id: string) {
    return this.updateAppointmentStatus(id, 'checked_in');
  }

  async startAppointment(id: string) {
    return this.updateAppointmentStatus(id, 'in_progress');
  }

  async completeAppointment(id: string) {
    return this.updateAppointmentStatus(id, 'completed');
  }

  async cancelAppointment(id: string) {
    return this.updateAppointmentStatus(id, 'cancelled');
  }

  // ==================== ENCOUNTERS ====================

  async getPatientEncounters(patientId: string) {
    const { data, error } = await this.supabase
      .from('clinic_encounters')
      .select(`
        *,
        provider:providers(*)
      `)
      .eq('patient_id', patientId)
      .order('encounter_date', { ascending: false });

    if (error) throw error;
    return data as ClinicEncounter[];
  }

  async getEncounter(id: string) {
    const { data, error } = await this.supabase
      .from('clinic_encounters')
      .select(`
        *,
        patient:patients(*),
        provider:providers(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ClinicEncounter;
  }

  async createEncounter(encounter: Omit<ClinicEncounter, 'id'>) {
    const { data, error } = await this.supabase
      .from('clinic_encounters')
      .insert(encounter)
      .select()
      .single();

    if (error) throw error;
    return data as ClinicEncounter;
  }

  async updateEncounter(id: string, updates: Partial<ClinicEncounter>) {
    const { data, error } = await this.supabase
      .from('clinic_encounters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ClinicEncounter;
  }

  async signEncounter(id: string, providerId: string) {
    return this.updateEncounter(id, {
      signed_by: providerId,
      signed_at: new Date().toISOString(),
    });
  }

  // ==================== BILLING ====================

  async getBillings(organizationId: string, status?: string) {
    let query = this.supabase
      .from('clinic_billings')
      .select(`
        *,
        patient:patients(*),
        provider:providers(*)
      `)
      .eq('organization_id', organizationId)
      .order('service_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as ClinicBilling[];
  }

  async createBilling(billing: Omit<ClinicBilling, 'id'>) {
    const { data, error } = await this.supabase
      .from('clinic_billings')
      .insert(billing)
      .select()
      .single();

    if (error) throw error;
    return data as ClinicBilling;
  }

  async submitBilling(id: string) {
    const { data, error } = await this.supabase
      .from('clinic_billings')
      .update({
        status: 'submitted',
        submission_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ClinicBilling;
  }

  async createBillingFromAppointment(appointmentId: string) {
    const appointment = await this.getAppointment(appointmentId);
    if (!appointment || !appointment.billing_code) return null;

    return this.createBilling({
      organization_id: appointment.organization_id,
      patient_id: appointment.patient_id,
      provider_id: appointment.provider_id,
      appointment_id: appointmentId,
      billing_code: appointment.billing_code.code,
      service_date: appointment.appointment_date,
      units: 1,
      fee: appointment.billing_code.fee,
      status: 'pending',
    });
  }

  // ==================== STATS ====================

  async getStats(organizationId: string, date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [appointmentsResult, patientsResult, billingsResult] = await Promise.all([
      this.supabase
        .from('clinic_appointments')
        .select('id, status')
        .eq('organization_id', organizationId)
        .eq('appointment_date', targetDate),
      this.supabase
        .from('patients')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('is_active', true),
      this.supabase
        .from('clinic_billings')
        .select('id, fee, status, service_date')
        .eq('organization_id', organizationId)
        .eq('service_date', targetDate)
        .eq('status', 'pending'),
    ]);

    const appointments = appointmentsResult.data || [];
    const patients = patientsResult.data || [];
    const billings = billingsResult.data || [];

    return {
      todayAppointments: appointments.length,
      checkedIn: appointments.filter(a => a.status === 'checked_in').length,
      inProgress: appointments.filter(a => a.status === 'in_progress').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      noShow: appointments.filter(a => a.status === 'no_show').length,
      totalPatients: patients.length,
      pendingBillings: billings.length,
      pendingBillingsTotal: billings.reduce((sum, b) => sum + b.fee, 0),
    };
  }
}

export const clinicService = new ClinicService();
