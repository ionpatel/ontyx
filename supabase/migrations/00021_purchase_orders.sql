-- =============================================================================
-- PURCHASE ORDERS MODULE
-- =============================================================================
-- Manage purchases from vendors/suppliers

-- Add missing columns to existing purchase_orders table
DO $$ 
BEGIN
    -- Add vendor columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'vendor_id') THEN
        ALTER TABLE purchase_orders ADD COLUMN vendor_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'vendor_name') THEN
        ALTER TABLE purchase_orders ADD COLUMN vendor_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'vendor_email') THEN
        ALTER TABLE purchase_orders ADD COLUMN vendor_email VARCHAR(255);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    po_number VARCHAR(50) NOT NULL,
    
    -- Vendor
    vendor_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_email VARCHAR(255),
    vendor_phone VARCHAR(50),
    vendor_address TEXT,
    
    -- Dates
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    received_date DATE,
    
    -- Items & Totals
    items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    shipping DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'CAD',
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'sent', 'confirmed', 'partial', 'received', 'billed', 'cancelled')),
    sent_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    
    -- Receiving
    receiving_notes TEXT,
    
    -- Billing
    bill_id UUID,
    billed_at TIMESTAMPTZ,
    
    -- Shipping
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(100),
    
    -- Extra
    notes TEXT,
    internal_notes TEXT,
    
    -- Metadata
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes (IF NOT EXISTS requires PostgreSQL 9.5+)
CREATE INDEX IF NOT EXISTS idx_po_org ON purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_po_vendor ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_date ON purchase_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_po_expected ON purchase_orders(expected_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_po_number_org ON purchase_orders(organization_id, po_number);

-- RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view POs in their organization" ON purchase_orders
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create POs in their organization" ON purchase_orders
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update POs in their organization" ON purchase_orders
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete POs in their organization" ON purchase_orders
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- BILLS (Vendor Invoices)
-- =============================================================================

CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    bill_number VARCHAR(50) NOT NULL,
    
    -- Vendor
    vendor_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    vendor_name VARCHAR(255) NOT NULL,
    
    -- Dates
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_date DATE,
    
    -- Items & Totals
    items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
    amount_due DECIMAL(15, 2) NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'CAD',
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
    
    -- Reference
    from_po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    reference_number VARCHAR(100),
    
    -- Extra
    notes TEXT,
    
    -- Metadata
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bills_org ON bills(organization_id);
CREATE INDEX idx_bills_vendor ON bills(vendor_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_due ON bills(due_date);
CREATE UNIQUE INDEX idx_bills_number_org ON bills(organization_id, bill_number);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage bills in their organization" ON bills
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

-- Link PO to bill
ALTER TABLE purchase_orders 
    ADD CONSTRAINT fk_po_bill 
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE SET NULL;

-- =============================================================================
-- INVENTORY INCREMENT FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION increment_inventory(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE inventory_levels 
    SET quantity_on_hand = quantity_on_hand + p_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id;
    
    -- If no inventory level exists, create one
    IF NOT FOUND THEN
        INSERT INTO inventory_levels (product_id, quantity_on_hand, updated_at)
        VALUES (p_product_id, p_quantity, NOW())
        ON CONFLICT (product_id) DO UPDATE
        SET quantity_on_hand = inventory_levels.quantity_on_hand + p_quantity;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE purchase_orders IS 'Purchase orders sent to vendors/suppliers';
COMMENT ON TABLE bills IS 'Vendor bills/invoices to be paid';
