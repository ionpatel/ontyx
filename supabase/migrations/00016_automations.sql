-- Automation Rules Table
-- Stores user-defined workflow automations

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Rule definition
  name TEXT NOT NULL,
  description TEXT,
  
  -- Trigger (when to run)
  trigger TEXT NOT NULL, -- invoice_created, stock_low, etc.
  trigger_conditions JSONB DEFAULT '{}', -- Additional conditions
  
  -- Actions (what to do)
  actions JSONB NOT NULL DEFAULT '[]', -- Array of {type, config}
  
  -- State
  enabled BOOLEAN DEFAULT true,
  
  -- Stats
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Logs (audit trail)
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Execution details
  trigger_event TEXT NOT NULL,
  trigger_data JSONB,
  actions_executed JSONB,
  
  -- Result
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- Email Templates (for send_email action)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Template info
  name TEXT NOT NULL,
  slug TEXT NOT NULL, -- invoice_reminder, welcome_customer, etc.
  description TEXT,
  
  -- Content
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  
  -- Variables
  variables JSONB DEFAULT '[]', -- [{name, description, default}]
  
  -- Settings
  is_system BOOLEAN DEFAULT false, -- System templates can't be deleted
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_org ON automation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON automation_rules(trigger);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation ON automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_org ON automation_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_org ON email_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON email_templates(slug);

-- RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own org automation rules"
  ON automation_rules FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org automation rules"
  ON automation_rules FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view own org automation logs"
  ON automation_logs FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org email templates"
  ON email_templates FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Insert default email templates
INSERT INTO email_templates (organization_id, name, slug, subject, body_html, is_system) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Invoice Reminder', 'invoice_reminder', 
   'Reminder: Invoice {{invoice_number}} is overdue',
   '<h2>Payment Reminder</h2><p>Dear {{customer_name}},</p><p>This is a friendly reminder that invoice <strong>{{invoice_number}}</strong> for <strong>{{amount}}</strong> was due on {{due_date}}.</p><p>Please arrange payment at your earliest convenience.</p><p>Thank you,<br>{{company_name}}</p>',
   true),
  ('00000000-0000-0000-0000-000000000000', 'Welcome Customer', 'welcome_customer',
   'Welcome to {{company_name}}!',
   '<h2>Welcome!</h2><p>Dear {{customer_name}},</p><p>Thank you for choosing {{company_name}}. We''re excited to have you as a customer!</p><p>If you have any questions, please don''t hesitate to reach out.</p><p>Best regards,<br>{{company_name}}</p>',
   true),
  ('00000000-0000-0000-0000-000000000000', 'Subscription Renewal', 'subscription_renewal',
   'Your subscription expires soon',
   '<h2>Subscription Reminder</h2><p>Dear {{customer_name}},</p><p>Your subscription to <strong>{{plan_name}}</strong> will expire on {{expiry_date}}.</p><p>To continue enjoying our services, please renew your subscription.</p><p>Thank you,<br>{{company_name}}</p>',
   true)
ON CONFLICT DO NOTHING;
