-- =============================================================================
-- ROE (Record of Employment) Records
-- Canadian compliance for Service Canada EI claims
-- =============================================================================

CREATE TABLE IF NOT EXISTS roe_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Employee Information (Block 10-14)
  employee_sin VARCHAR(11), -- XXX-XXX-XXX format
  employee_first_name VARCHAR(100) NOT NULL,
  employee_last_name VARCHAR(100) NOT NULL,
  employee_address TEXT,
  employee_city VARCHAR(100),
  employee_province VARCHAR(2) DEFAULT 'ON',
  employee_postal_code VARCHAR(10),
  
  -- Employer Information (Block 1-6)
  employer_business_number VARCHAR(20), -- CRA Business Number
  employer_name VARCHAR(255) NOT NULL,
  employer_address TEXT,
  employer_city VARCHAR(100),
  employer_province VARCHAR(2) DEFAULT 'ON',
  employer_postal_code VARCHAR(10),
  employer_phone VARCHAR(20),
  employer_contact_name VARCHAR(100),
  
  -- Employment Dates (Block 11-12)
  first_day_worked DATE NOT NULL,
  last_day_for_which_paid DATE NOT NULL,
  final_pay_period_end_date DATE,
  
  -- Reason for ROE (Block 16)
  reason_code VARCHAR(2) NOT NULL, -- A, B, C, D, E, F, G, H, J, K, M, N, P, Z
  expected_recall_date DATE,
  comments TEXT,
  
  -- Pay Period Type (Block 6)
  pay_period_type VARCHAR(20) DEFAULT 'biweekly', -- weekly, biweekly, semi-monthly, monthly
  
  -- Insurable Earnings (Block 15A-C)
  insurable_earnings_by_period JSONB DEFAULT '[]', -- Array of {periodNumber, periodEndDate, earnings}
  total_insurable_earnings DECIMAL(12, 2) DEFAULT 0,
  total_insurable_hours DECIMAL(10, 2) DEFAULT 0,
  
  -- Vacation Pay (Block 17A-B)
  vacation_pay DECIMAL(12, 2) DEFAULT 0,
  vacation_pay_included BOOLEAN DEFAULT false,
  
  -- Other Monies & Special Payments (Block 17C)
  other_monies JSONB DEFAULT '[]', -- Array of {type, amount, startDate, endDate}
  statutory_holiday_pay DECIMAL(12, 2) DEFAULT 0,
  other_payments DECIMAL(12, 2) DEFAULT 0,
  
  -- ROE Metadata
  serial_number VARCHAR(20), -- Unique ROE serial number
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'amended')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_roe_records_org ON roe_records(organization_id);
CREATE INDEX idx_roe_records_employee ON roe_records(employee_id);
CREATE INDEX idx_roe_records_status ON roe_records(status);
CREATE INDEX idx_roe_records_created ON roe_records(created_at DESC);

-- RLS
ALTER TABLE roe_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org ROE records"
  ON roe_records FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ROE records for own org"
  ON roe_records FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own org ROE records"
  ON roe_records FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own org ROE records"
  ON roe_records FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- Add employees table if not exists (for ROE generation)
-- =============================================================================

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Personal Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(2) DEFAULT 'ON',
  postal_code VARCHAR(10),
  
  -- Tax Info
  sin VARCHAR(11), -- Social Insurance Number (encrypted in production)
  date_of_birth DATE,
  
  -- Employment
  employee_number VARCHAR(50),
  department VARCHAR(100),
  job_title VARCHAR(100),
  hire_date DATE,
  start_date DATE,
  termination_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
  
  -- Compensation
  pay_type VARCHAR(20) DEFAULT 'hourly' CHECK (pay_type IN ('hourly', 'salary')),
  pay_rate DECIMAL(12, 2), -- Hourly rate or annual salary
  hours_per_week DECIMAL(5, 2) DEFAULT 40,
  
  -- Tax Forms
  td1_federal_claim DECIMAL(12, 2) DEFAULT 15000, -- Basic personal amount
  td1_provincial_claim DECIMAL(12, 2) DEFAULT 11865,
  
  -- Banking
  bank_account_number VARCHAR(20),
  bank_transit_number VARCHAR(10),
  bank_institution_number VARCHAR(5),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(last_name, first_name);

-- RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org employees"
  ON employees FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert employees for own org"
  ON employees FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own org employees"
  ON employees FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own org employees"
  ON employees FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );
