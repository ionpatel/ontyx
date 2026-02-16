-- ============================================================================
-- Migration: 00006_recurring_invoices.sql
-- Description: Add recurring invoices table for automatic invoice generation
-- ============================================================================

-- Recurring Invoices Table
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Customer Reference
  customer_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  
  -- Invoice Template
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_province TEXT DEFAULT 'ON',
  notes TEXT,
  terms TEXT,
  
  -- Schedule
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  next_date DATE NOT NULL,
  end_date DATE,
  days_until_due INTEGER NOT NULL DEFAULT 30,
  
  -- Status & Tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_at TIMESTAMPTZ,
  invoices_generated INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_recurring_invoices_org ON recurring_invoices(organization_id);
CREATE INDEX idx_recurring_invoices_customer ON recurring_invoices(customer_id);
CREATE INDEX idx_recurring_invoices_next_date ON recurring_invoices(next_date) WHERE is_active = true;
CREATE INDEX idx_recurring_invoices_active ON recurring_invoices(is_active);

-- RLS
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage recurring invoices in their organization
CREATE POLICY recurring_invoices_org_policy ON recurring_invoices
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Trigger for updated_at
CREATE TRIGGER set_recurring_invoices_updated_at
  BEFORE UPDATE ON recurring_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Add sent_at column to invoices table (for email tracking)
-- ============================================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_to TEXT;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE recurring_invoices IS 'Templates for automatically generated invoices';
COMMENT ON COLUMN recurring_invoices.frequency IS 'How often to generate: weekly, biweekly, monthly, quarterly, yearly';
COMMENT ON COLUMN recurring_invoices.next_date IS 'Next scheduled invoice generation date';
COMMENT ON COLUMN recurring_invoices.days_until_due IS 'Payment terms: days from invoice date until due';
COMMENT ON COLUMN recurring_invoices.items IS 'JSON array of line items: [{description, quantity, unitPrice, amount}]';
