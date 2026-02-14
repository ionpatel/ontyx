-- Ontyx ERP - Finance Schema Migration
-- Invoices, Bills, Banking, Accounting

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'void', 'cancelled');
CREATE TYPE bill_status AS ENUM ('draft', 'pending', 'approved', 'partial', 'paid', 'overdue', 'void');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'check', 'bank_transfer', 'credit_card', 'debit_card', 'paypal', 'stripe', 'other');
CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');
CREATE TYPE journal_status AS ENUM ('draft', 'posted', 'void');
CREATE TYPE transaction_type AS ENUM ('debit', 'credit');
CREATE TYPE bank_account_type AS ENUM ('checking', 'savings', 'credit_card', 'loan', 'other');

-- =============================================================================
-- CHART OF ACCOUNTS
-- =============================================================================

CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    account_type account_type NOT NULL,
    
    parent_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Running balance (updated by triggers)
    balance DECIMAL(19, 4) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_coa_org ON chart_of_accounts(organization_id);
CREATE INDEX idx_coa_type ON chart_of_accounts(account_type);
CREATE INDEX idx_coa_parent ON chart_of_accounts(parent_id);

-- =============================================================================
-- BANK ACCOUNTS
-- =============================================================================

CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    account_type bank_account_type DEFAULT 'checking',
    account_number VARCHAR(50), -- Last 4 digits only
    routing_number VARCHAR(20),
    bank_name VARCHAR(255),
    
    currency currency_code DEFAULT 'USD',
    current_balance DECIMAL(19, 4) DEFAULT 0,
    available_balance DECIMAL(19, 4) DEFAULT 0,
    
    -- Linked GL account
    gl_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    
    -- Bank feed connection
    plaid_account_id VARCHAR(255),
    plaid_item_id VARCHAR(255),
    last_sync_at TIMESTAMPTZ,
    
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bank_accounts_org ON bank_accounts(organization_id);

-- =============================================================================
-- BANK TRANSACTIONS
-- =============================================================================

CREATE TABLE bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    
    transaction_date DATE NOT NULL,
    posted_date DATE,
    description TEXT NOT NULL,
    
    amount DECIMAL(19, 4) NOT NULL,
    transaction_type transaction_type NOT NULL,
    running_balance DECIMAL(19, 4),
    
    -- External reference
    external_id VARCHAR(255), -- From bank feed
    check_number VARCHAR(20),
    
    -- Categorization
    category VARCHAR(100),
    gl_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    
    -- Matching
    is_reconciled BOOLEAN DEFAULT false,
    reconciled_at TIMESTAMPTZ,
    matched_entity_type VARCHAR(50), -- invoice, bill, payment
    matched_entity_id UUID,
    
    -- Manual vs imported
    is_manual BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bank_txns_org ON bank_transactions(organization_id);
CREATE INDEX idx_bank_txns_account ON bank_transactions(bank_account_id);
CREATE INDEX idx_bank_txns_date ON bank_transactions(transaction_date DESC);
CREATE INDEX idx_bank_txns_reconciled ON bank_transactions(is_reconciled);

-- =============================================================================
-- CONTACTS (Customers & Vendors)
-- =============================================================================

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Type
    is_customer BOOLEAN DEFAULT true,
    is_vendor BOOLEAN DEFAULT false,
    
    -- Basic info
    type VARCHAR(20) DEFAULT 'company', -- company, individual
    company_name VARCHAR(255),
    display_name VARCHAR(255) NOT NULL,
    
    -- Contact person
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    website VARCHAR(255),
    
    -- Billing address
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(2) DEFAULT 'US',
    
    -- Shipping address
    shipping_address_line1 VARCHAR(255),
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(2) DEFAULT 'US',
    
    -- Financial
    currency currency_code DEFAULT 'USD',
    tax_id VARCHAR(50),
    payment_terms INTEGER DEFAULT 30, -- Net days
    credit_limit DECIMAL(19, 4),
    
    -- Linked accounts
    ar_account_id UUID REFERENCES chart_of_accounts(id),
    ap_account_id UUID REFERENCES chart_of_accounts(id),
    
    -- Balances (computed)
    outstanding_receivable DECIMAL(19, 4) DEFAULT 0,
    outstanding_payable DECIMAL(19, 4) DEFAULT 0,
    
    -- Metadata
    tags TEXT[],
    notes TEXT,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_contacts_type ON contacts(is_customer, is_vendor);
CREATE INDEX idx_contacts_name ON contacts(display_name);
CREATE INDEX idx_contacts_email ON contacts(email);

-- =============================================================================
-- INVOICES
-- =============================================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Invoice details
    invoice_number VARCHAR(50) NOT NULL,
    reference VARCHAR(100),
    
    -- Customer
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    
    -- Dates
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    
    -- Amounts
    currency currency_code DEFAULT 'USD',
    subtotal DECIMAL(19, 4) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(19, 4) DEFAULT 0,
    discount_percent DECIMAL(5, 2),
    tax_amount DECIMAL(19, 4) DEFAULT 0,
    total DECIMAL(19, 4) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(19, 4) DEFAULT 0,
    amount_due DECIMAL(19, 4) NOT NULL DEFAULT 0,
    
    -- Status
    status invoice_status DEFAULT 'draft',
    
    -- Billing/Shipping addresses (snapshot)
    billing_address JSONB,
    shipping_address JSONB,
    
    -- Additional
    notes TEXT,
    terms TEXT,
    footer TEXT,
    
    -- GL Account
    revenue_account_id UUID REFERENCES chart_of_accounts(id),
    ar_account_id UUID REFERENCES chart_of_accounts(id),
    
    -- Tracking
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, invoice_number)
);

CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_contact ON invoices(contact_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- =============================================================================
-- INVOICE LINE ITEMS
-- =============================================================================

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    line_number INTEGER NOT NULL,
    
    -- Product reference (optional)
    product_id UUID, -- Will reference products table
    
    -- Item details
    description TEXT NOT NULL,
    quantity DECIMAL(19, 4) NOT NULL DEFAULT 1,
    unit_price DECIMAL(19, 4) NOT NULL,
    
    -- Discount
    discount_amount DECIMAL(19, 4) DEFAULT 0,
    discount_percent DECIMAL(5, 2),
    
    -- Tax
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(19, 4) DEFAULT 0,
    
    -- Total
    line_total DECIMAL(19, 4) NOT NULL,
    
    -- GL Account
    account_id UUID REFERENCES chart_of_accounts(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- =============================================================================
-- BILLS (Vendor invoices)
-- =============================================================================

CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Bill details
    bill_number VARCHAR(50) NOT NULL,
    vendor_ref VARCHAR(100), -- Vendor's invoice number
    
    -- Vendor
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    
    -- Dates
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    
    -- Amounts
    currency currency_code DEFAULT 'USD',
    subtotal DECIMAL(19, 4) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(19, 4) DEFAULT 0,
    tax_amount DECIMAL(19, 4) DEFAULT 0,
    total DECIMAL(19, 4) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(19, 4) DEFAULT 0,
    amount_due DECIMAL(19, 4) NOT NULL DEFAULT 0,
    
    -- Status
    status bill_status DEFAULT 'draft',
    
    -- Approvals
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    -- Additional
    notes TEXT,
    
    -- GL Account
    expense_account_id UUID REFERENCES chart_of_accounts(id),
    ap_account_id UUID REFERENCES chart_of_accounts(id),
    
    -- Tracking
    paid_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, bill_number)
);

CREATE INDEX idx_bills_org ON bills(organization_id);
CREATE INDEX idx_bills_contact ON bills(contact_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_due_date ON bills(due_date);

-- =============================================================================
-- BILL LINE ITEMS
-- =============================================================================

CREATE TABLE bill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    
    line_number INTEGER NOT NULL,
    
    -- Product reference (optional)
    product_id UUID,
    
    -- Item details
    description TEXT NOT NULL,
    quantity DECIMAL(19, 4) NOT NULL DEFAULT 1,
    unit_price DECIMAL(19, 4) NOT NULL,
    
    -- Tax
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(19, 4) DEFAULT 0,
    
    -- Total
    line_total DECIMAL(19, 4) NOT NULL,
    
    -- GL Account
    account_id UUID REFERENCES chart_of_accounts(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bill_items_bill ON bill_items(bill_id);

-- =============================================================================
-- PAYMENTS
-- =============================================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    payment_number VARCHAR(50) NOT NULL,
    
    -- Type
    payment_type VARCHAR(20) NOT NULL, -- received, made
    payment_method payment_method DEFAULT 'bank_transfer',
    
    -- Contact
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    
    -- Bank account
    bank_account_id UUID REFERENCES bank_accounts(id),
    
    -- Amount
    currency currency_code DEFAULT 'USD',
    amount DECIMAL(19, 4) NOT NULL,
    
    -- Dates
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Status
    status payment_status DEFAULT 'completed',
    
    -- Reference
    reference VARCHAR(100),
    notes TEXT,
    
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, payment_number)
);

CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_contact ON payments(contact_id);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);

-- =============================================================================
-- PAYMENT ALLOCATIONS (Links payments to invoices/bills)
-- =============================================================================

CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    
    entity_type VARCHAR(20) NOT NULL, -- invoice, bill
    entity_id UUID NOT NULL,
    
    amount DECIMAL(19, 4) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_alloc_payment ON payment_allocations(payment_id);
CREATE INDEX idx_payment_alloc_entity ON payment_allocations(entity_type, entity_id);

-- =============================================================================
-- JOURNAL ENTRIES
-- =============================================================================

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    description TEXT NOT NULL,
    reference VARCHAR(100),
    
    -- Source document
    source_type VARCHAR(50), -- invoice, bill, payment, manual
    source_id UUID,
    
    -- Totals
    total_debit DECIMAL(19, 4) NOT NULL DEFAULT 0,
    total_credit DECIMAL(19, 4) NOT NULL DEFAULT 0,
    
    status journal_status DEFAULT 'draft',
    
    posted_at TIMESTAMPTZ,
    posted_by UUID REFERENCES users(id),
    
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, entry_number)
);

CREATE INDEX idx_journal_entries_org ON journal_entries(organization_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date DESC);
CREATE INDEX idx_journal_entries_status ON journal_entries(status);

-- =============================================================================
-- JOURNAL ENTRY LINES
-- =============================================================================

CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    
    line_number INTEGER NOT NULL,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    
    description TEXT,
    
    debit DECIMAL(19, 4) DEFAULT 0,
    credit DECIMAL(19, 4) DEFAULT 0,
    
    -- Optional: contact for AR/AP tracking
    contact_id UUID REFERENCES contacts(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journal_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_entry_lines(account_id);

-- =============================================================================
-- TAX RATES
-- =============================================================================

CREATE TABLE tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    rate DECIMAL(5, 2) NOT NULL,
    
    -- Components (for compound taxes)
    is_compound BOOLEAN DEFAULT false,
    components JSONB DEFAULT '[]',
    
    -- GL Accounts
    sales_tax_account_id UUID REFERENCES chart_of_accounts(id),
    purchase_tax_account_id UUID REFERENCES chart_of_accounts(id),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tax_rates_org ON tax_rates(organization_id);

-- =============================================================================
-- RECURRING INVOICES
-- =============================================================================

CREATE TABLE recurring_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    
    -- Schedule
    frequency VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
    interval INTEGER DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    next_date DATE,
    
    -- Invoice template
    invoice_template JSONB NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_generated_at TIMESTAMPTZ,
    total_generated INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recurring_invoices_org ON recurring_invoices(organization_id);
CREATE INDEX idx_recurring_invoices_next ON recurring_invoices(next_date);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

-- Helper function for org membership check
CREATE OR REPLACE FUNCTION user_has_org_access(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for all finance tables
CREATE POLICY "Org access for chart_of_accounts" ON chart_of_accounts
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for bank_accounts" ON bank_accounts
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for bank_transactions" ON bank_transactions
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for contacts" ON contacts
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for invoices" ON invoices
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for invoice_items" ON invoice_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND user_has_org_access(invoices.organization_id)
        )
    );

CREATE POLICY "Org access for bills" ON bills
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for bill_items" ON bill_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bills
            WHERE bills.id = bill_items.bill_id
            AND user_has_org_access(bills.organization_id)
        )
    );

CREATE POLICY "Org access for payments" ON payments
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for payment_allocations" ON payment_allocations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM payments
            WHERE payments.id = payment_allocations.payment_id
            AND user_has_org_access(payments.organization_id)
        )
    );

CREATE POLICY "Org access for journal_entries" ON journal_entries
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for journal_entry_lines" ON journal_entry_lines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM journal_entries
            WHERE journal_entries.id = journal_entry_lines.journal_entry_id
            AND user_has_org_access(journal_entries.organization_id)
        )
    );

CREATE POLICY "Org access for tax_rates" ON tax_rates
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for recurring_invoices" ON recurring_invoices
    FOR ALL USING (user_has_org_access(organization_id));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER set_updated_at_chart_of_accounts BEFORE UPDATE ON chart_of_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_bank_accounts BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_bank_transactions BEFORE UPDATE ON bank_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_contacts BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_invoices BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_bills BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_payments BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_journal_entries BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_tax_rates BEFORE UPDATE ON tax_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_recurring_invoices BEFORE UPDATE ON recurring_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
