-- POS (Point of Sale) Schema
-- Supports retail checkout, payment processing, receipts, and shift management

-- POS Sessions (shifts)
CREATE TABLE IF NOT EXISTS pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Session info
  session_number TEXT NOT NULL,
  register_name TEXT DEFAULT 'Register 1',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  
  -- Cash tracking
  opening_cash DECIMAL(12,2) NOT NULL DEFAULT 0,
  closing_cash DECIMAL(12,2),
  expected_cash DECIMAL(12,2),
  cash_difference DECIMAL(12,2),
  
  -- Timestamps
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  
  -- Notes
  opening_notes TEXT,
  closing_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POS Transactions (sales)
CREATE TABLE IF NOT EXISTS pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id UUID REFERENCES pos_sessions(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  
  -- Transaction info
  transaction_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'voided', 'refunded')),
  
  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Tax breakdown (Canadian)
  gst_amount DECIMAL(12,2) DEFAULT 0,
  pst_amount DECIMAL(12,2) DEFAULT 0,
  hst_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Payment info
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  change_given DECIMAL(12,2) DEFAULT 0,
  
  -- Reference
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POS Transaction Items
CREATE TABLE IF NOT EXISTS pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Item details
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  
  -- Pricing
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POS Payments (multiple payment methods per transaction)
CREATE TABLE IF NOT EXISTS pos_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  
  -- Payment details
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'debit', 'credit', 'interac', 'gift_card', 'store_credit', 'other')),
  amount DECIMAL(12,2) NOT NULL,
  
  -- Card info (masked)
  card_type TEXT, -- visa, mastercard, amex, etc.
  card_last_four TEXT,
  authorization_code TEXT,
  
  -- Reference
  reference_number TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POS Cash Movements (cash in/out during session)
CREATE TABLE IF NOT EXISTS pos_cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Movement details
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out')),
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pos_sessions_org ON pos_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_status ON pos_sessions(status);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_org ON pos_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_session ON pos_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_number ON pos_transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_pos_transaction_items_tx ON pos_transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pos_payments_tx ON pos_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pos_cash_movements_session ON pos_cash_movements(session_id);

-- RLS Policies
ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_cash_movements ENABLE ROW LEVEL SECURITY;

-- POS Sessions policies
CREATE POLICY "Users can view their org's POS sessions"
  ON pos_sessions FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create POS sessions for their org"
  ON pos_sessions FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their org's POS sessions"
  ON pos_sessions FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

-- POS Transactions policies
CREATE POLICY "Users can view their org's POS transactions"
  ON pos_transactions FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create POS transactions for their org"
  ON pos_transactions FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their org's POS transactions"
  ON pos_transactions FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

-- POS Transaction Items policies
CREATE POLICY "Users can view transaction items"
  ON pos_transaction_items FOR SELECT
  USING (transaction_id IN (
    SELECT id FROM pos_transactions WHERE organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can create transaction items"
  ON pos_transaction_items FOR INSERT
  WITH CHECK (transaction_id IN (
    SELECT id FROM pos_transactions WHERE organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  ));

-- POS Payments policies
CREATE POLICY "Users can view payments"
  ON pos_payments FOR SELECT
  USING (transaction_id IN (
    SELECT id FROM pos_transactions WHERE organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can create payments"
  ON pos_payments FOR INSERT
  WITH CHECK (transaction_id IN (
    SELECT id FROM pos_transactions WHERE organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  ));

-- POS Cash Movements policies
CREATE POLICY "Users can view cash movements"
  ON pos_cash_movements FOR SELECT
  USING (session_id IN (
    SELECT id FROM pos_sessions WHERE organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can create cash movements"
  ON pos_cash_movements FOR INSERT
  WITH CHECK (session_id IN (
    SELECT id FROM pos_sessions WHERE organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  ));

-- Functions
CREATE OR REPLACE FUNCTION generate_pos_transaction_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(transaction_number FROM 'POS-[0-9]{2}-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM pos_transactions
  WHERE organization_id = org_id
    AND transaction_number LIKE 'POS-' || year_prefix || '-%';
  
  RETURN 'POS-' || year_prefix || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_pos_session_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  date_prefix TEXT;
BEGIN
  date_prefix := TO_CHAR(NOW(), 'YYMMDD');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(session_number FROM 'SES-[0-9]{6}-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM pos_sessions
  WHERE organization_id = org_id
    AND session_number LIKE 'SES-' || date_prefix || '-%';
  
  RETURN 'SES-' || date_prefix || '-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
