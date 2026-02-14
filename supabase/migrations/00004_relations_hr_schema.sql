-- Ontyx ERP - Relations & HR Schema Migration
-- CRM, Projects, Tasks, Employees, Payroll, Attendance

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'unqualified', 'converted');
CREATE TYPE opportunity_status AS ENUM ('open', 'won', 'lost');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'intern', 'freelance');
CREATE TYPE employment_status AS ENUM ('active', 'on_leave', 'terminated', 'resigned');
CREATE TYPE pay_frequency AS ENUM ('weekly', 'biweekly', 'semimonthly', 'monthly');
CREATE TYPE payroll_status AS ENUM ('draft', 'processing', 'approved', 'paid', 'cancelled');
CREATE TYPE attendance_type AS ENUM ('clock_in', 'clock_out', 'break_start', 'break_end');

-- =============================================================================
-- CRM - PIPELINE STAGES
-- =============================================================================

CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    probability INTEGER DEFAULT 0, -- 0-100%
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    color VARCHAR(20) DEFAULT '#6B7280',
    
    is_won BOOLEAN DEFAULT false,
    is_lost BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pipeline_stages_org ON pipeline_stages(organization_id);

-- =============================================================================
-- CRM - LEADS
-- =============================================================================

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Source
    source VARCHAR(100), -- website, referral, ad, cold, etc.
    campaign VARCHAR(255),
    
    -- Lead info
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    company_name VARCHAR(255),
    job_title VARCHAR(100),
    website VARCHAR(255),
    
    -- Address
    address_line1 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'US',
    
    -- Status
    status lead_status DEFAULT 'new',
    score INTEGER DEFAULT 0, -- Lead scoring
    
    -- Assignment
    assigned_to UUID REFERENCES users(id),
    
    -- Notes
    notes TEXT,
    
    -- Conversion
    converted_at TIMESTAMPTZ,
    converted_to_contact_id UUID REFERENCES contacts(id),
    converted_to_opportunity_id UUID,
    
    -- Tracking
    last_activity_at TIMESTAMPTZ,
    next_follow_up DATE,
    
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_org ON leads(organization_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_email ON leads(email);

-- =============================================================================
-- CRM - OPPORTUNITIES
-- =============================================================================

CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    
    -- Related
    contact_id UUID REFERENCES contacts(id),
    lead_id UUID REFERENCES leads(id),
    
    -- Pipeline
    stage_id UUID REFERENCES pipeline_stages(id),
    probability INTEGER DEFAULT 0,
    
    -- Value
    currency currency_code DEFAULT 'USD',
    amount DECIMAL(19, 4),
    expected_revenue DECIMAL(19, 4), -- amount * probability
    
    -- Dates
    expected_close DATE,
    actual_close DATE,
    
    -- Status
    status opportunity_status DEFAULT 'open',
    lost_reason TEXT,
    
    -- Assignment
    assigned_to UUID REFERENCES users(id),
    
    -- Notes
    description TEXT,
    next_step TEXT,
    
    -- Tracking
    last_activity_at TIMESTAMPTZ,
    
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opportunities_org ON opportunities(organization_id);
CREATE INDEX idx_opportunities_contact ON opportunities(contact_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_assigned ON opportunities(assigned_to);

-- Now add the foreign key constraint for lead conversion
ALTER TABLE leads ADD CONSTRAINT fk_leads_converted_opp 
    FOREIGN KEY (converted_to_opportunity_id) REFERENCES opportunities(id);

-- =============================================================================
-- CRM - ACTIVITIES
-- =============================================================================

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    activity_type VARCHAR(50) NOT NULL, -- call, email, meeting, task, note
    
    -- Related entity
    entity_type VARCHAR(50), -- lead, opportunity, contact
    entity_id UUID,
    
    -- Details
    subject VARCHAR(255),
    description TEXT,
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    
    -- Assignment
    assigned_to UUID REFERENCES users(id),
    
    -- Outcome
    outcome VARCHAR(100),
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_org ON activities(organization_id);
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_activities_scheduled ON activities(scheduled_at);

-- =============================================================================
-- PROJECTS
-- =============================================================================

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    code VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Related
    contact_id UUID REFERENCES contacts(id), -- Client
    opportunity_id UUID REFERENCES opportunities(id),
    
    -- Status
    status project_status DEFAULT 'planning',
    
    -- Dates
    start_date DATE,
    end_date DATE,
    actual_start DATE,
    actual_end DATE,
    
    -- Budget
    currency currency_code DEFAULT 'USD',
    budget_amount DECIMAL(19, 4),
    actual_amount DECIMAL(19, 4) DEFAULT 0,
    
    -- Hours
    estimated_hours DECIMAL(10, 2),
    actual_hours DECIMAL(10, 2) DEFAULT 0,
    
    -- Billing
    is_billable BOOLEAN DEFAULT true,
    billing_method VARCHAR(50) DEFAULT 'fixed', -- fixed, hourly, milestone
    hourly_rate DECIMAL(10, 2),
    
    -- Team
    project_manager_id UUID REFERENCES users(id),
    
    -- Completion
    progress_percent INTEGER DEFAULT 0,
    
    color VARCHAR(20) DEFAULT '#3B82F6',
    tags TEXT[],
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_projects_contact ON projects(contact_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_manager ON projects(project_manager_id);

-- =============================================================================
-- PROJECT MILESTONES
-- =============================================================================

CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    due_date DATE,
    completed_at TIMESTAMPTZ,
    
    -- Billing
    is_billable BOOLEAN DEFAULT false,
    amount DECIMAL(19, 4),
    invoice_id UUID REFERENCES invoices(id),
    
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_milestones_project ON project_milestones(project_id);

-- =============================================================================
-- TASKS
-- =============================================================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- Subtasks
    
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Status
    status task_status DEFAULT 'todo',
    priority task_priority DEFAULT 'medium',
    
    -- Dates
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    
    -- Time
    estimated_hours DECIMAL(10, 2),
    actual_hours DECIMAL(10, 2) DEFAULT 0,
    
    -- Assignment
    assigned_to UUID REFERENCES users(id),
    
    -- Progress
    progress_percent INTEGER DEFAULT 0,
    
    -- Tags
    tags TEXT[],
    
    sort_order INTEGER DEFAULT 0,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_org ON tasks(organization_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due ON tasks(due_date);

-- =============================================================================
-- TIME ENTRIES
-- =============================================================================

CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    
    -- Time
    entry_date DATE NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER NOT NULL,
    
    -- Description
    description TEXT,
    
    -- Billing
    is_billable BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(10, 2),
    total_amount DECIMAL(19, 4),
    
    -- Invoice
    is_invoiced BOOLEAN DEFAULT false,
    invoice_id UUID REFERENCES invoices(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_entries_org ON time_entries(organization_id);
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_task ON time_entries(task_id);
CREATE INDEX idx_time_entries_date ON time_entries(entry_date);

-- =============================================================================
-- DEPARTMENTS
-- =============================================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    code VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES users(id),
    
    -- GL Account for cost allocation
    expense_account_id UUID REFERENCES chart_of_accounts(id),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_departments_org ON departments(organization_id);
CREATE INDEX idx_departments_parent ON departments(parent_id);

-- =============================================================================
-- EMPLOYEES
-- =============================================================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Link to user (if they have system access)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Employee number
    employee_number VARCHAR(50),
    
    -- Personal info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    
    -- Profile
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(100),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'US',
    
    -- Emergency contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),
    
    -- Employment
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    job_title VARCHAR(255),
    employment_type employment_type DEFAULT 'full_time',
    employment_status employment_status DEFAULT 'active',
    
    manager_id UUID REFERENCES employees(id),
    
    -- Dates
    hire_date DATE NOT NULL,
    probation_end_date DATE,
    termination_date DATE,
    
    -- Work schedule
    work_hours_per_week DECIMAL(5, 2) DEFAULT 40,
    
    -- Bank details (for payroll)
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(50), -- Encrypted in practice
    bank_routing_number VARCHAR(20),
    
    -- Tax
    tax_id VARCHAR(50), -- SSN, SIN, etc.
    tax_filing_status VARCHAR(50),
    tax_withholding_allowances INTEGER DEFAULT 0,
    
    -- Profile
    avatar_url TEXT,
    bio TEXT,
    
    -- Metadata
    custom_fields JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, employee_number)
);

CREATE INDEX idx_employees_org ON employees(organization_id);
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(employment_status);

-- =============================================================================
-- EMPLOYEE COMPENSATION
-- =============================================================================

CREATE TABLE employee_compensation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    effective_date DATE NOT NULL,
    end_date DATE,
    
    -- Pay
    pay_type VARCHAR(20) NOT NULL, -- salary, hourly
    pay_frequency pay_frequency DEFAULT 'biweekly',
    currency currency_code DEFAULT 'USD',
    amount DECIMAL(19, 4) NOT NULL, -- Annual salary or hourly rate
    
    -- Overtime
    overtime_eligible BOOLEAN DEFAULT false,
    overtime_rate DECIMAL(5, 2) DEFAULT 1.5,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employee_compensation_employee ON employee_compensation(employee_id);
CREATE INDEX idx_employee_compensation_date ON employee_compensation(effective_date);

-- =============================================================================
-- PAYROLL RUNS
-- =============================================================================

CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    run_number VARCHAR(50) NOT NULL,
    
    -- Period
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    
    -- Status
    status payroll_status DEFAULT 'draft',
    
    -- Totals
    currency currency_code DEFAULT 'USD',
    total_gross DECIMAL(19, 4) DEFAULT 0,
    total_deductions DECIMAL(19, 4) DEFAULT 0,
    total_employer_taxes DECIMAL(19, 4) DEFAULT 0,
    total_net DECIMAL(19, 4) DEFAULT 0,
    
    -- Approval
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    -- Processing
    processed_at TIMESTAMPTZ,
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, run_number)
);

CREATE INDEX idx_payroll_runs_org ON payroll_runs(organization_id);
CREATE INDEX idx_payroll_runs_status ON payroll_runs(status);
CREATE INDEX idx_payroll_runs_period ON payroll_runs(pay_period_start, pay_period_end);

-- =============================================================================
-- PAYSLIPS
-- =============================================================================

CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    
    -- Earnings breakdown
    regular_hours DECIMAL(10, 2) DEFAULT 0,
    regular_pay DECIMAL(19, 4) DEFAULT 0,
    overtime_hours DECIMAL(10, 2) DEFAULT 0,
    overtime_pay DECIMAL(19, 4) DEFAULT 0,
    
    -- Other earnings
    bonus DECIMAL(19, 4) DEFAULT 0,
    commission DECIMAL(19, 4) DEFAULT 0,
    other_earnings DECIMAL(19, 4) DEFAULT 0,
    
    -- Gross
    gross_pay DECIMAL(19, 4) NOT NULL,
    
    -- Deductions (detailed)
    deductions JSONB DEFAULT '[]', -- [{name, amount, type}]
    total_deductions DECIMAL(19, 4) DEFAULT 0,
    
    -- Taxes
    taxes JSONB DEFAULT '[]', -- [{name, amount, type}]
    total_taxes DECIMAL(19, 4) DEFAULT 0,
    
    -- Employer contributions
    employer_contributions JSONB DEFAULT '[]',
    total_employer_contributions DECIMAL(19, 4) DEFAULT 0,
    
    -- Net
    net_pay DECIMAL(19, 4) NOT NULL,
    
    -- Payment
    payment_method payment_method DEFAULT 'bank_transfer',
    bank_account_last4 VARCHAR(4),
    
    -- YTD totals (at time of payslip)
    ytd_gross DECIMAL(19, 4),
    ytd_taxes DECIMAL(19, 4),
    ytd_deductions DECIMAL(19, 4),
    ytd_net DECIMAL(19, 4),
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payslips_payroll ON payslips(payroll_run_id);
CREATE INDEX idx_payslips_employee ON payslips(employee_id);

-- =============================================================================
-- ATTENDANCE RECORDS
-- =============================================================================

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    record_date DATE NOT NULL,
    
    -- Clock times
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    
    -- Break times
    break_start TIMESTAMPTZ,
    break_end TIMESTAMPTZ,
    
    -- Calculated
    work_hours DECIMAL(5, 2),
    break_hours DECIMAL(5, 2),
    overtime_hours DECIMAL(5, 2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'present', -- present, absent, late, leave, holiday
    
    -- Notes
    notes TEXT,
    
    -- Approval
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(employee_id, record_date)
);

CREATE INDEX idx_attendance_org ON attendance_records(organization_id);
CREATE INDEX idx_attendance_employee ON attendance_records(employee_id);
CREATE INDEX idx_attendance_date ON attendance_records(record_date);

-- =============================================================================
-- LEAVE TYPES
-- =============================================================================

CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    description TEXT,
    
    -- Accrual
    is_paid BOOLEAN DEFAULT true,
    accrual_days_per_year DECIMAL(5, 2),
    max_carry_forward DECIMAL(5, 2),
    
    color VARCHAR(20) DEFAULT '#6B7280',
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leave_types_org ON leave_types(organization_id);

-- =============================================================================
-- LEAVE REQUESTS
-- =============================================================================

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    leave_type_id UUID NOT NULL REFERENCES leave_types(id),
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Half days
    start_half_day BOOLEAN DEFAULT false,
    end_half_day BOOLEAN DEFAULT false,
    
    total_days DECIMAL(5, 2) NOT NULL,
    
    reason TEXT,
    
    -- Approval
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leave_requests_org ON leave_requests(organization_id);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

-- =============================================================================
-- LEAVE BALANCES
-- =============================================================================

CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    
    year INTEGER NOT NULL,
    
    entitled_days DECIMAL(5, 2) DEFAULT 0,
    carried_forward DECIMAL(5, 2) DEFAULT 0,
    taken_days DECIMAL(5, 2) DEFAULT 0,
    pending_days DECIMAL(5, 2) DEFAULT 0,
    balance_days DECIMAL(5, 2) DEFAULT 0, -- Computed: entitled + carried - taken
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(employee_id, leave_type_id, year)
);

CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX idx_leave_balances_year ON leave_balances(year);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_compensation ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org access for pipeline_stages" ON pipeline_stages FOR ALL USING (user_has_org_access(organization_id));
CREATE POLICY "Org access for leads" ON leads FOR ALL USING (user_has_org_access(organization_id));
CREATE POLICY "Org access for opportunities" ON opportunities FOR ALL USING (user_has_org_access(organization_id));
CREATE POLICY "Org access for activities" ON activities FOR ALL USING (user_has_org_access(organization_id));
CREATE POLICY "Org access for projects" ON projects FOR ALL USING (user_has_org_access(organization_id));
CREATE POLICY "Org access for project_milestones" ON project_milestones 
    FOR ALL USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_milestones.project_id AND user_has_org_access(projects.organization_id)));
CREATE POLICY "Org access for tasks" ON tasks FOR ALL USING (user_has_org_access(organization_id));
CREATE POLICY "Org access for time_entries" ON time_entries FOR ALL USING (user_has_org_access(organization_id));
CREATE POLICY "Org access for departments" ON departments FOR ALL USING (user_has_org_access(organization_id));
CREATE POLICY "Org access for employees" ON employees FOR ALL USING (user_has_org_access(organization_id));
CREATE POLICY "Org access for employee_compensation" ON employee_compensation 
    FOR ALL USING (EXISTS (SELECT 1 FROM employees WHERE employees.id = employee_compensation.employee_id AND user_has_org_access(employees.organization_id)));
CREATE POLICY "Org access for payroll_runs" ON payroll_runs FOR ALL USING (user_has_org_access(organization_id));
CREATE POLICY "Org access for payslips" ON payslips 
    FOR ALL USING (EXISTS (SELECT 1 FROM payroll_runs WHERE payroll_runs.id = payslips.payroll_run_id AND user_has_org_access(payroll_runs.organization_id)));
CREATE POLICY "Org access for attendance_records" ON attendance_records FOR ALL USING (user_has_org_access(organization_id));
CREATE POLICY "Org access for leave_types" ON leave_types FOR ALL USING (user_has_org_access(organization_id));
CREATE POLICY "Org access for leave_requests" ON leave_requests FOR ALL USING (user_has_org_access(organization_id));
CREATE POLICY "Org access for leave_balances" ON leave_balances 
    FOR ALL USING (EXISTS (SELECT 1 FROM employees WHERE employees.id = leave_balances.employee_id AND user_has_org_access(employees.organization_id)));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER set_updated_at_pipeline_stages BEFORE UPDATE ON pipeline_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_leads BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_opportunities BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_activities BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_projects BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_project_milestones BEFORE UPDATE ON project_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_tasks BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_time_entries BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_departments BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_employees BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_employee_compensation BEFORE UPDATE ON employee_compensation FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_payroll_runs BEFORE UPDATE ON payroll_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_attendance_records BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_leave_types BEFORE UPDATE ON leave_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_leave_requests BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
