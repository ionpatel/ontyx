-- =============================================
-- ONTYX INDUSTRY MODULES SCHEMA
-- Complete database for all industry verticals
-- =============================================

-- =============================================
-- PHARMACY MODULE
-- =============================================

CREATE TABLE IF NOT EXISTS drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  din VARCHAR(8) NOT NULL, -- Drug Identification Number
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  manufacturer VARCHAR(255),
  strength VARCHAR(100),
  form VARCHAR(100), -- Tablet, Capsule, Liquid, etc.
  category VARCHAR(50) NOT NULL DEFAULT 'otc', -- otc, prescription, controlled, narcotic
  schedule VARCHAR(10), -- U, II, III, N, C (NAPRA schedules)
  quantity_on_hand INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  retail_price DECIMAL(10,2) DEFAULT 0,
  expiry_date DATE,
  lot_number VARCHAR(100),
  location VARCHAR(100),
  supplier_id UUID REFERENCES contacts(id),
  barcode VARCHAR(100),
  requires_prescription BOOLEAN DEFAULT false,
  is_controlled BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, din, lot_number)
);

CREATE TABLE IF NOT EXISTS drug_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- received, dispensed, returned, expired, adjusted
  quantity INTEGER NOT NULL,
  lot_number VARCHAR(100),
  reference_number VARCHAR(100), -- PO number, prescription number, etc.
  performed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS narcotic_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  counted_by UUID NOT NULL REFERENCES users(id),
  witnessed_by UUID REFERENCES users(id),
  expected_quantity INTEGER NOT NULL,
  actual_quantity INTEGER NOT NULL,
  discrepancy INTEGER GENERATED ALWAYS AS (actual_quantity - expected_quantity) STORED,
  notes TEXT,
  counted_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SALON & SPA MODULE
-- =============================================

CREATE TABLE IF NOT EXISTS salon_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- Hair, Nails, Spa, Makeup, etc.
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 30, -- minutes
  price DECIMAL(10,2) NOT NULL,
  commission_type VARCHAR(20) DEFAULT 'percentage', -- percentage, fixed
  commission_value DECIMAL(10,2) DEFAULT 0,
  color VARCHAR(7), -- Hex color for calendar
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salon_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  display_name VARCHAR(255) NOT NULL,
  role VARCHAR(100), -- Stylist, Technician, Therapist, etc.
  bio TEXT,
  photo_url TEXT,
  color VARCHAR(7), -- Hex color for calendar
  services UUID[], -- Array of service IDs they can perform
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salon_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES salon_staff(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS salon_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  date_of_birth DATE,
  preferences TEXT,
  allergies TEXT,
  notes TEXT,
  membership_type VARCHAR(50), -- VIP, Gold, Regular
  membership_expires DATE,
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  last_visit DATE,
  referred_by UUID REFERENCES salon_clients(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salon_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES salon_clients(id),
  staff_id UUID NOT NULL REFERENCES salon_staff(id),
  service_id UUID NOT NULL REFERENCES salon_services(id),
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'booked', -- booked, confirmed, checked_in, in_progress, completed, cancelled, no_show
  price DECIMAL(10,2),
  deposit_paid DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salon_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  services UUID[], -- Array of service IDs included
  original_price DECIMAL(10,2),
  package_price DECIMAL(10,2) NOT NULL,
  valid_days INTEGER DEFAULT 365,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUTO SHOP MODULE
-- =============================================

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES contacts(id),
  vin VARCHAR(17),
  license_plate VARCHAR(20),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(50),
  engine VARCHAR(100),
  transmission VARCHAR(50),
  drivetrain VARCHAR(50),
  mileage INTEGER,
  last_service_date DATE,
  last_service_mileage INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, vin)
);

CREATE TABLE IF NOT EXISTS auto_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- Oil Change, Brakes, Tires, Engine, etc.
  description TEXT,
  labor_hours DECIMAL(5,2),
  labor_rate DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auto_work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wo_number VARCHAR(50) NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  customer_id UUID REFERENCES contacts(id),
  status VARCHAR(50) DEFAULT 'estimate', -- estimate, approved, in_progress, completed, invoiced, cancelled
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  technician_id UUID REFERENCES employees(id),
  odometer_in INTEGER,
  odometer_out INTEGER,
  customer_concern TEXT,
  diagnosis TEXT,
  recommendations TEXT,
  promised_date DATE,
  completed_date TIMESTAMPTZ,
  labor_total DECIMAL(12,2) DEFAULT 0,
  parts_total DECIMAL(12,2) DEFAULT 0,
  supplies_total DECIMAL(12,2) DEFAULT 0,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  invoice_id UUID REFERENCES invoices(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, wo_number)
);

CREATE TABLE IF NOT EXISTS auto_work_order_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES auto_work_orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES auto_services(id),
  service_name VARCHAR(255) NOT NULL,
  labor_hours DECIMAL(5,2),
  labor_rate DECIMAL(10,2),
  labor_total DECIMAL(12,2),
  technician_id UUID REFERENCES employees(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auto_work_order_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES auto_work_orders(id) ON DELETE CASCADE,
  work_order_service_id UUID REFERENCES auto_work_order_services(id),
  product_id UUID REFERENCES products(id),
  part_number VARCHAR(100),
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  unit_price DECIMAL(10,2),
  total DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_service_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES auto_work_orders(id),
  service_date DATE NOT NULL,
  mileage INTEGER,
  service_type VARCHAR(255) NOT NULL,
  description TEXT,
  cost DECIMAL(12,2),
  performed_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CLINIC MODULE
-- =============================================

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  health_card_number VARCHAR(50),
  health_card_version VARCHAR(10),
  health_card_expiry DATE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(50),
  postal_code VARCHAR(20),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  emergency_contact_relation VARCHAR(100),
  family_doctor VARCHAR(255),
  referring_doctor VARCHAR(255),
  allergies TEXT[],
  medications TEXT[],
  conditions TEXT[],
  blood_type VARCHAR(10),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  billing_number VARCHAR(50), -- OHIP billing number
  license_number VARCHAR(50),
  specialty VARCHAR(100),
  title VARCHAR(50), -- Dr., NP, RN, etc.
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  credentials VARCHAR(100), -- MD, DO, NP, etc.
  color VARCHAR(7), -- Hex color for calendar
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  description VARCHAR(255) NOT NULL,
  fee DECIMAL(10,2) NOT NULL,
  province VARCHAR(10) DEFAULT 'ON',
  category VARCHAR(100),
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  effective_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, code, province)
);

CREATE TABLE IF NOT EXISTS clinic_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  billing_code_id UUID REFERENCES billing_codes(id),
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, checked_in, in_progress, completed, cancelled, no_show
  appointment_type VARCHAR(100), -- New Patient, Follow-up, Annual Physical, etc.
  reason_for_visit TEXT,
  chief_complaint TEXT,
  diagnosis_codes TEXT[], -- ICD-10 codes
  notes TEXT,
  is_walk_in BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  appointment_id UUID REFERENCES clinic_appointments(id),
  encounter_date DATE NOT NULL,
  chief_complaint TEXT,
  history_of_present_illness TEXT,
  review_of_systems JSONB,
  physical_examination JSONB,
  assessment TEXT,
  plan TEXT,
  diagnosis_codes TEXT[],
  procedure_codes TEXT[],
  prescriptions JSONB,
  referrals JSONB,
  follow_up_instructions TEXT,
  signed_by UUID REFERENCES providers(id),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_billings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  encounter_id UUID REFERENCES clinic_encounters(id),
  appointment_id UUID REFERENCES clinic_appointments(id),
  billing_code VARCHAR(20) NOT NULL,
  diagnosis_code VARCHAR(20),
  service_date DATE NOT NULL,
  units INTEGER DEFAULT 1,
  fee DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, submitted, accepted, rejected, paid
  submission_date DATE,
  payment_date DATE,
  payment_amount DECIMAL(10,2),
  rejection_reason TEXT,
  claim_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FIELD SERVICE MODULE
-- =============================================

CREATE TABLE IF NOT EXISTS technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  skills TEXT[],
  certifications TEXT[],
  service_areas TEXT[], -- Postal code prefixes or regions
  status VARCHAR(50) DEFAULT 'available', -- available, on_job, break, offline
  current_latitude DECIMAL(10,7),
  current_longitude DECIMAL(10,7),
  last_location_update TIMESTAMPTZ,
  color VARCHAR(7),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wo_number VARCHAR(50) NOT NULL,
  customer_id UUID REFERENCES contacts(id),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  service_address TEXT NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  work_type VARCHAR(100), -- installation, repair, maintenance, inspection
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'unassigned', -- unassigned, assigned, en_route, in_progress, completed, cancelled
  technician_id UUID REFERENCES technicians(id),
  scheduled_date DATE,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  estimated_duration INTEGER, -- minutes
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  description TEXT,
  work_performed TEXT,
  parts_used JSONB,
  labor_hours DECIMAL(5,2),
  labor_total DECIMAL(12,2),
  parts_total DECIMAL(12,2),
  total DECIMAL(12,2),
  customer_signature TEXT, -- Base64 encoded
  photos TEXT[], -- URLs
  notes TEXT,
  invoice_id UUID REFERENCES invoices(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, wo_number)
);

-- =============================================
-- MARKETING MODULE
-- =============================================

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- email, sms, social
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, running, paused, completed
  subject VARCHAR(255),
  content TEXT,
  html_content TEXT,
  template_id UUID,
  audience_list_id UUID,
  audience_size INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'static', -- static, dynamic
  filter_criteria JSONB, -- For dynamic lists
  contact_count INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES marketing_lists(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS marketing_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(100) NOT NULL, -- new_subscriber, abandoned_cart, birthday, no_activity, etc.
  trigger_config JSONB,
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused
  steps JSONB, -- Array of automation steps
  emails_sent INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDUSTRY TEMPLATES
-- =============================================

CREATE TABLE IF NOT EXISTS industry_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry VARCHAR(100) NOT NULL, -- pharmacy, salon, auto_shop, clinic, restaurant, retail, contractor, wholesaler
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB NOT NULL, -- Contains all template data
  -- config structure:
  -- {
  --   "chart_of_accounts": [...],
  --   "products": [...],
  --   "services": [...],
  --   "tax_rates": [...],
  --   "email_templates": [...],
  --   "invoice_templates": [...],
  --   "workflows": [...],
  --   "settings": {...}
  -- }
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_drugs_org ON drugs(organization_id);
CREATE INDEX IF NOT EXISTS idx_drugs_din ON drugs(din);
CREATE INDEX IF NOT EXISTS idx_drugs_expiry ON drugs(expiry_date);
CREATE INDEX IF NOT EXISTS idx_drugs_category ON drugs(category);

CREATE INDEX IF NOT EXISTS idx_salon_appointments_date ON salon_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_salon_appointments_staff ON salon_appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_salon_appointments_client ON salon_appointments(client_id);

CREATE INDEX IF NOT EXISTS idx_vehicles_org ON vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_auto_work_orders_status ON auto_work_orders(status);
CREATE INDEX IF NOT EXISTS idx_auto_work_orders_vehicle ON auto_work_orders(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_patients_org ON patients(organization_id);
CREATE INDEX IF NOT EXISTS idx_patients_health_card ON patients(health_card_number);
CREATE INDEX IF NOT EXISTS idx_clinic_appointments_date ON clinic_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_clinic_appointments_patient ON clinic_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinic_appointments_provider ON clinic_appointments(provider_id);

CREATE INDEX IF NOT EXISTS idx_field_work_orders_status ON field_work_orders(status);
CREATE INDEX IF NOT EXISTS idx_field_work_orders_technician ON field_work_orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_field_work_orders_date ON field_work_orders(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_org ON marketing_campaigns(organization_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE narcotic_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies (organization-based access)
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'drugs', 'drug_transactions', 'narcotic_counts',
    'salon_services', 'salon_staff', 'salon_clients', 'salon_appointments',
    'vehicles', 'auto_work_orders',
    'patients', 'providers', 'clinic_appointments', 'clinic_encounters', 'clinic_billings',
    'technicians', 'field_work_orders',
    'marketing_campaigns', 'marketing_lists'
  ];
  t TEXT;
  policy_name TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    policy_name := t || '_org_policy';
    -- Drop if exists, then create
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, t);
    EXECUTE format('
      CREATE POLICY %I ON %I
        FOR ALL
        USING (organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = true
        ))
        WITH CHECK (organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = true
        ))
    ', policy_name, t);
  END LOOP;
END $$;
