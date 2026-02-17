-- Full ERP Schema Extension
-- Covers: Documents, Time Off, Helpdesk, Appointments, Subscriptions, 
-- Maintenance, Quality, Recruitment, Appraisals, Marketing, Approvals, Knowledge

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- DOCUMENTS MODULE
-- ============================================================

-- Document folders MUST be created before documents (FK dependency)
CREATE TABLE IF NOT EXISTS document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- File info
  name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase storage path
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  
  -- Organization
  folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  
  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  parent_version_id UUID REFERENCES documents(id),
  
  -- Access control
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Metadata
  description TEXT,
  checksum TEXT, -- SHA-256 for integrity
  
  -- Encryption
  is_encrypted BOOLEAN DEFAULT false,
  encryption_key_id TEXT, -- Reference to key management
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id),
  shared_with_email TEXT, -- External share
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  expires_at TIMESTAMPTZ,
  access_token TEXT UNIQUE, -- For external links
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TIME OFF / LEAVE MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Vacation, Sick, Personal, etc.
  color TEXT DEFAULT '#3B82F6',
  paid BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true,
  max_days_per_year DECIMAL(5,2),
  carryover_allowed BOOLEAN DEFAULT false,
  max_carryover_days DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  allocated_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  used_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  carried_over_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested DECIMAL(5,2) NOT NULL,
  half_day BOOLEAN DEFAULT false,
  half_day_period TEXT CHECK (half_day_period IN ('morning', 'afternoon')),
  
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HELPDESK / SUPPORT TICKETS
-- ============================================================

CREATE TABLE IF NOT EXISTS ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  sla_hours INTEGER, -- Response SLA
  parent_id UUID REFERENCES ticket_categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,
  
  -- Ticket info
  subject TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES ticket_categories(id),
  
  -- Priority & Status
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  team_id UUID,
  
  -- Contact
  contact_id UUID REFERENCES contacts(id),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- SLA
  sla_deadline TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Source
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'email', 'phone', 'chat', 'api')),
  
  -- Encryption for sensitive tickets
  is_sensitive BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal notes vs customer visible
  
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPOINTMENTS / SCHEDULING
-- ============================================================

CREATE TABLE IF NOT EXISTS appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  color TEXT DEFAULT '#10B981',
  price DECIMAL(12,2),
  buffer_before_minutes INTEGER DEFAULT 0,
  buffer_after_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  appointment_type_id UUID REFERENCES appointment_types(id),
  
  -- Scheduling
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'America/Toronto',
  
  -- Participants
  staff_id UUID REFERENCES employees(id),
  contact_id UUID REFERENCES contacts(id),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  
  -- Details
  title TEXT,
  notes TEXT,
  location TEXT,
  meeting_link TEXT, -- Video call link
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT false,
  
  -- Booking
  booked_online BOOLEAN DEFAULT false,
  confirmation_token TEXT UNIQUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  UNIQUE(employee_id, day_of_week)
);

-- ============================================================
-- SUBSCRIPTIONS / RECURRING BILLING
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  price DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'CAD',
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  
  -- Trial
  trial_days INTEGER DEFAULT 0,
  
  -- Features (JSON for flexibility)
  features JSONB DEFAULT '[]',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  
  -- Dates
  start_date DATE NOT NULL,
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  trial_end DATE,
  cancelled_at TIMESTAMPTZ,
  
  -- Billing
  next_billing_date DATE,
  last_billing_date DATE,
  
  -- Stripe integration
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  
  -- Auto-renew
  auto_renew BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MAINTENANCE / EQUIPMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  code TEXT, -- Asset code
  category TEXT,
  
  -- Details
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  
  -- Location
  location TEXT,
  warehouse_id UUID REFERENCES warehouses(id),
  
  -- Status
  status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'repair', 'retired')),
  
  -- Dates
  purchase_date DATE,
  warranty_expiry DATE,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  
  -- Value
  purchase_price DECIMAL(12,2),
  current_value DECIMAL(12,2),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  
  request_number TEXT NOT NULL,
  
  -- Type
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'emergency')),
  
  -- Details
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  
  -- Assignment
  assigned_to UUID REFERENCES employees(id),
  
  -- Scheduling
  scheduled_date DATE,
  completed_date DATE,
  
  -- Costs
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- QUALITY CONTROL
-- ============================================================

CREATE TABLE IF NOT EXISTS quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  check_number TEXT NOT NULL,
  
  -- What's being checked
  product_id UUID REFERENCES products(id),
  equipment_id UUID REFERENCES equipment(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  
  -- Check details
  check_type TEXT NOT NULL CHECK (check_type IN ('incoming', 'in_process', 'final', 'random')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'conditional')),
  
  -- Results
  inspector_id UUID REFERENCES employees(id),
  inspection_date TIMESTAMPTZ,
  
  -- Criteria (JSON for flexibility)
  criteria JSONB DEFAULT '[]',
  results JSONB DEFAULT '[]',
  
  -- Actions
  corrective_action TEXT,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RECRUITMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  
  -- Details
  description TEXT,
  requirements TEXT,
  responsibilities TEXT,
  
  -- Compensation
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  salary_type TEXT DEFAULT 'yearly' CHECK (salary_type IN ('hourly', 'yearly')),
  
  -- Job type
  employment_type TEXT DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temporary', 'internship')),
  remote_option TEXT DEFAULT 'onsite' CHECK (remote_option IN ('onsite', 'remote', 'hybrid')),
  
  location TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'on_hold', 'closed', 'filled')),
  
  -- Dates
  published_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  
  -- Applicant info (encrypted for PII)
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  
  -- Resume
  resume_path TEXT,
  cover_letter TEXT,
  
  -- Pipeline
  stage TEXT DEFAULT 'new' CHECK (stage IN ('new', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected')),
  
  -- Rating
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  
  -- Assignment
  recruiter_id UUID REFERENCES employees(id),
  
  -- Interview
  interview_date TIMESTAMPTZ,
  interview_notes TEXT,
  
  -- Offer
  offered_salary DECIMAL(12,2),
  offer_date DATE,
  offer_status TEXT CHECK (offer_status IN ('pending', 'accepted', 'declined', 'negotiating')),
  
  source TEXT, -- Where they found the job
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPRAISALS / PERFORMANCE REVIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS appraisal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Questions/criteria (JSON)
  sections JSONB NOT NULL DEFAULT '[]',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appraisals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES employees(id),
  template_id UUID REFERENCES appraisal_templates(id),
  
  -- Period
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'self_review', 'manager_review', 'completed', 'acknowledged')),
  
  -- Responses (JSON)
  self_assessment JSONB DEFAULT '{}',
  manager_assessment JSONB DEFAULT '{}',
  
  -- Scores
  overall_rating DECIMAL(3,2),
  
  -- Goals
  goals_achieved TEXT,
  goals_next_period TEXT,
  
  -- Comments
  employee_comments TEXT,
  manager_comments TEXT,
  
  -- Signatures
  employee_signed_at TIMESTAMPTZ,
  manager_signed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPROVALS / WORKFLOWS
-- ============================================================

CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- What this workflow applies to
  entity_type TEXT NOT NULL, -- 'expense', 'leave_request', 'purchase_order', etc.
  
  -- Conditions (JSON)
  conditions JSONB DEFAULT '{}', -- e.g., {"amount_greater_than": 1000}
  
  -- Steps (JSON array of approvers)
  steps JSONB NOT NULL DEFAULT '[]',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES approval_workflows(id),
  
  -- What's being approved
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Requester
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  current_step INTEGER DEFAULT 1,
  
  -- Metadata
  request_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  
  step INTEGER NOT NULL,
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'delegated')),
  comments TEXT,
  
  delegated_to UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- KNOWLEDGE BASE / WIKI
-- ============================================================

CREATE TABLE IF NOT EXISTS knowledge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES knowledge_categories(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT, -- Markdown
  
  category_id UUID REFERENCES knowledge_categories(id),
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Author
  author_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Visibility
  visibility TEXT DEFAULT 'internal' CHECK (visibility IN ('internal', 'public')),
  
  -- Engagement
  views INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  
  -- SEO
  meta_description TEXT,
  
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(organization_id, slug)
);

-- ============================================================
-- SURVEYS
-- ============================================================

CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Questions (JSON)
  questions JSONB NOT NULL DEFAULT '[]',
  
  -- Settings
  is_anonymous BOOLEAN DEFAULT false,
  allow_multiple_responses BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  
  -- Dates
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  
  respondent_id UUID REFERENCES auth.users(id),
  respondent_email TEXT, -- For anonymous
  
  answers JSONB NOT NULL DEFAULT '{}',
  
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG (Security)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  -- Action
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view', 'export', 'login', etc.
  entity_type TEXT NOT NULL,
  entity_id UUID,
  
  -- Details
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);

-- Time Off
CREATE INDEX IF NOT EXISTS idx_leave_requests_org ON leave_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON leave_balances(employee_id);

-- Helpdesk
CREATE INDEX IF NOT EXISTS idx_tickets_org ON tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_org ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_contact ON subscriptions(contact_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Maintenance
CREATE INDEX IF NOT EXISTS idx_equipment_org ON equipment(organization_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment ON maintenance_requests(equipment_id);

-- Quality
CREATE INDEX IF NOT EXISTS idx_quality_checks_org ON quality_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_product ON quality_checks(product_id);

-- Recruitment
CREATE INDEX IF NOT EXISTS idx_job_postings_org ON job_postings(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_posting ON job_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_stage ON job_applications(stage);

-- Appraisals
CREATE INDEX IF NOT EXISTS idx_appraisals_employee ON appraisals(employee_id);
CREATE INDEX IF NOT EXISTS idx_appraisals_status ON appraisals(status);

-- Approvals
CREATE INDEX IF NOT EXISTS idx_approval_requests_org ON approval_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_request ON approval_actions(request_id);

-- Knowledge
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_org ON knowledge_articles(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category ON knowledge_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_slug ON knowledge_articles(slug);

-- Surveys
CREATE INDEX IF NOT EXISTS idx_surveys_org ON surveys(organization_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);

-- Audit
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraisal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Universal org-based RLS policy function
CREATE OR REPLACE FUNCTION user_org_ids() RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Apply standard RLS policies to all org-based tables
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'documents', 'document_folders', 'leave_types', 'leave_requests',
    'ticket_categories', 'tickets', 'appointment_types', 'appointments',
    'subscription_plans', 'subscriptions', 'equipment', 'maintenance_requests',
    'quality_checks', 'job_postings', 'job_applications', 'appraisal_templates',
    'appraisals', 'approval_workflows', 'approval_requests', 'knowledge_categories',
    'knowledge_articles', 'surveys', 'audit_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('
      CREATE POLICY "Users can access their org data" ON %I
        FOR ALL USING (organization_id IN (SELECT user_org_ids()))
    ', tbl);
  END LOOP;
END $$;

-- Special policies for nested tables
CREATE POLICY "Users can access leave balances" ON leave_balances
  FOR ALL USING (employee_id IN (
    SELECT id FROM employees WHERE organization_id IN (SELECT user_org_ids())
  ));

CREATE POLICY "Users can access ticket messages" ON ticket_messages
  FOR ALL USING (ticket_id IN (
    SELECT id FROM tickets WHERE organization_id IN (SELECT user_org_ids())
  ));

CREATE POLICY "Users can access document shares" ON document_shares
  FOR ALL USING (document_id IN (
    SELECT id FROM documents WHERE organization_id IN (SELECT user_org_ids())
  ));

CREATE POLICY "Users can access staff availability" ON staff_availability
  FOR ALL USING (employee_id IN (
    SELECT id FROM employees WHERE organization_id IN (SELECT user_org_ids())
  ));

CREATE POLICY "Users can access approval actions" ON approval_actions
  FOR ALL USING (request_id IN (
    SELECT id FROM approval_requests WHERE organization_id IN (SELECT user_org_ids())
  ));

CREATE POLICY "Users can access survey responses" ON survey_responses
  FOR ALL USING (survey_id IN (
    SELECT id FROM surveys WHERE organization_id IN (SELECT user_org_ids())
  ));

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(ticket_number FROM 'TKT-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM tickets
  WHERE organization_id = org_id;
  
  RETURN 'TKT-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate maintenance request number
CREATE OR REPLACE FUNCTION generate_maintenance_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(request_number FROM 'MNT-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM maintenance_requests
  WHERE organization_id = org_id;
  
  RETURN 'MNT-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate quality check number
CREATE OR REPLACE FUNCTION generate_quality_check_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(check_number FROM 'QC-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM quality_checks
  WHERE organization_id = org_id;
  
  RETURN 'QC-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Audit log trigger function
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, new_values)
    VALUES (NEW.organization_id, auth.uid(), 'create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (NEW.organization_id, auth.uid(), 'update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, old_values)
    VALUES (OLD.organization_id, auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_documents AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_tickets AFTER INSERT OR UPDATE OR DELETE ON tickets
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_leave_requests AFTER INSERT OR UPDATE OR DELETE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_appraisals AFTER INSERT OR UPDATE OR DELETE ON appraisals
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_job_applications AFTER INSERT OR UPDATE OR DELETE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
