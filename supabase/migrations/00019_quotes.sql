-- =============================================================================
-- QUOTES/ESTIMATES MODULE
-- =============================================================================
-- Professional quotes that can be converted to invoices

CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    quote_number VARCHAR(50) NOT NULL,
    
    -- Customer
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    
    -- Dates
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    
    -- Content
    title VARCHAR(255),
    summary TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    
    -- Totals
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    discount_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'CAD',
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted')),
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Conversion
    converted_to_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    
    -- Extra
    terms TEXT,
    notes TEXT,
    
    -- Metadata
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quotes_org ON quotes(organization_id);
CREATE INDEX idx_quotes_contact ON quotes(contact_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_date ON quotes(quote_date DESC);
CREATE INDEX idx_quotes_valid_until ON quotes(valid_until);
CREATE UNIQUE INDEX idx_quotes_number_org ON quotes(organization_id, quote_number);

-- RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quotes in their organization" ON quotes
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create quotes in their organization" ON quotes
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update quotes in their organization" ON quotes
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete quotes in their organization" ON quotes
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

-- Add quote reference to invoices (for converted quotes)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS from_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;

-- =============================================================================
-- QUOTE TEMPLATES (Save common quotes as templates)
-- =============================================================================

CREATE TABLE IF NOT EXISTS quote_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    title VARCHAR(255),
    summary TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    terms TEXT,
    notes TEXT,
    valid_days INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quote_templates_org ON quote_templates(organization_id);

ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage quote templates in their organization" ON quote_templates
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- COMMENT
-- =============================================================================
COMMENT ON TABLE quotes IS 'Professional quotes/estimates that can be sent to customers and converted to invoices';
COMMENT ON TABLE quote_templates IS 'Reusable quote templates for common services/products';
