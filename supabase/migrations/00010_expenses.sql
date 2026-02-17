-- =============================================================================
-- Expenses Module
-- Employee expense tracking with receipt uploads and approval workflow
-- =============================================================================

-- Expense Categories
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  description TEXT,
  
  -- GL Account for expense posting
  expense_account_id UUID REFERENCES chart_of_accounts(id),
  
  -- Limits
  requires_receipt_above DECIMAL(10, 2) DEFAULT 25.00,
  max_amount DECIMAL(10, 2),
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, code)
);

-- Default categories will be seeded

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Who submitted
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES users(id),
  
  -- Expense details
  expense_number VARCHAR(50),
  category_id UUID REFERENCES expense_categories(id),
  
  description TEXT NOT NULL,
  merchant VARCHAR(255),
  
  -- Date & Location
  expense_date DATE NOT NULL,
  location VARCHAR(255),
  
  -- Amount breakdown (Canadian tax compliance)
  currency VARCHAR(3) DEFAULT 'CAD',
  subtotal DECIMAL(12, 2) NOT NULL,
  gst_hst_amount DECIMAL(12, 2) DEFAULT 0,
  pst_amount DECIMAL(12, 2) DEFAULT 0,
  tip_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  
  -- Tax registration (for ITC claims)
  vendor_tax_number VARCHAR(20),
  
  -- Payment
  payment_method VARCHAR(50) DEFAULT 'personal', -- personal, company_card, cash, etc.
  is_billable BOOLEAN DEFAULT false,
  project_id UUID REFERENCES projects(id),
  contact_id UUID REFERENCES contacts(id), -- Bill to client
  
  -- Receipt
  receipt_url TEXT,
  receipt_verified BOOLEAN DEFAULT false,
  
  -- Approval workflow
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'reimbursed', 'cancelled')),
  
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Reimbursement
  reimbursed_at TIMESTAMPTZ,
  reimbursement_method VARCHAR(50), -- payroll, direct_deposit, cheque
  reimbursement_reference VARCHAR(100),
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expenses_org ON expenses(organization_id);
CREATE INDEX idx_expenses_employee ON expenses(employee_id);
CREATE INDEX idx_expenses_submitted_by ON expenses(submitted_by);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category_id);

-- Expense Reports (group expenses for batch approval)
CREATE TABLE expense_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  report_number VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Who submitted
  employee_id UUID REFERENCES employees(id),
  submitted_by UUID NOT NULL REFERENCES users(id),
  
  -- Period
  period_start DATE,
  period_end DATE,
  
  -- Totals (computed)
  total_amount DECIMAL(12, 2) DEFAULT 0,
  total_gst_hst DECIMAL(12, 2) DEFAULT 0,
  expense_count INTEGER DEFAULT 0,
  
  -- Workflow
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'reimbursed')),
  
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  reimbursed_at TIMESTAMPTZ,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link expenses to reports
ALTER TABLE expenses ADD COLUMN report_id UUID REFERENCES expense_reports(id) ON DELETE SET NULL;
CREATE INDEX idx_expenses_report ON expenses(report_id);

-- Indexes for expense reports
CREATE INDEX idx_expense_reports_org ON expense_reports(organization_id);
CREATE INDEX idx_expense_reports_employee ON expense_reports(employee_id);
CREATE INDEX idx_expense_reports_status ON expense_reports(status);

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_reports ENABLE ROW LEVEL SECURITY;

-- Expense Categories - org members can view/manage
CREATE POLICY "Org members can view expense categories"
  ON expense_categories FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can manage expense categories"
  ON expense_categories FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Expenses - users can view their own or all if admin
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (
    submitted_by = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (
    submitted_by = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete expenses"
  ON expenses FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Expense Reports
CREATE POLICY "Users can view own expense reports"
  ON expense_reports FOR SELECT
  USING (
    submitted_by = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage expense reports"
  ON expense_reports FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- Triggers
-- =============================================================================

CREATE TRIGGER set_updated_at_expense_categories 
  BEFORE UPDATE ON expense_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_expenses 
  BEFORE UPDATE ON expenses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_expense_reports 
  BEFORE UPDATE ON expense_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- Seed default expense categories
-- =============================================================================

-- These will be inserted per-organization during onboarding
-- Categories: Travel, Meals & Entertainment, Office Supplies, Software & Subscriptions,
-- Professional Services, Marketing & Advertising, Utilities, Equipment, Other
