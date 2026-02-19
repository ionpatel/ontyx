-- =============================================================================
-- BANKING INTEGRATION TABLES
-- Store connected bank accounts and imported transactions
-- =============================================================================

-- Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Account Info
    account_name VARCHAR(255) NOT NULL,
    institution_name VARCHAR(255),
    institution_id VARCHAR(50), -- Flinks/Plaid institution ID
    account_number_last4 VARCHAR(4),
    account_type VARCHAR(20) DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings', 'credit', 'loan')),
    
    -- Balance & Currency
    balance BIGINT DEFAULT 0, -- In cents
    currency VARCHAR(3) DEFAULT 'CAD',
    
    -- Connection Status
    status VARCHAR(20) DEFAULT 'connected' CHECK (status IN ('connected', 'error', 'disconnected', 'pending')),
    connection_id VARCHAR(255), -- External provider connection ID
    access_token_encrypted TEXT, -- Encrypted access token for refreshing
    
    -- Sync Info
    last_synced_at TIMESTAMPTZ,
    sync_cursor VARCHAR(255), -- For incremental sync
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    
    -- Transaction Info
    external_id VARCHAR(255), -- ID from bank/provider
    transaction_date DATE NOT NULL,
    posted_date DATE,
    description TEXT NOT NULL,
    amount BIGINT NOT NULL, -- In cents, negative for debits
    
    -- Categorization
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    -- Matching
    matched_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    matched_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
    matched_bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
    matched_reference VARCHAR(100), -- Human-readable reference (invoice #, expense title, etc.)
    
    -- Raw Data
    raw_data JSONB, -- Original transaction data from bank
    
    -- Metadata
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add matched_transaction_id to expenses for reverse lookup
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS matched_transaction_id UUID REFERENCES bank_transactions(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bank_accounts_org ON bank_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_status ON bank_accounts(status);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account ON bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_unmatched ON bank_transactions(bank_account_id) 
    WHERE matched_invoice_id IS NULL AND matched_expense_id IS NULL AND matched_bill_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_bank_transactions_external ON bank_transactions(external_id);

-- RLS Policies
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

-- Bank accounts: Users can only see accounts in their organization
CREATE POLICY bank_accounts_org_policy ON bank_accounts
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Bank transactions: Users can only see transactions from their org's accounts
CREATE POLICY bank_transactions_org_policy ON bank_transactions
    FOR ALL USING (
        bank_account_id IN (
            SELECT ba.id FROM bank_accounts ba
            JOIN organization_members om ON ba.organization_id = om.organization_id
            WHERE om.user_id = auth.uid()
        )
    );

-- Helper function to increment balance atomically
CREATE OR REPLACE FUNCTION increment_balance(row_id UUID, amount BIGINT)
RETURNS BIGINT AS $$
DECLARE
    new_balance BIGINT;
BEGIN
    UPDATE bank_accounts 
    SET balance = balance + amount, updated_at = NOW()
    WHERE id = row_id
    RETURNING balance INTO new_balance;
    
    RETURN new_balance;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE bank_accounts IS 'Connected bank accounts for automatic transaction import';
COMMENT ON TABLE bank_transactions IS 'Imported bank transactions for reconciliation';
COMMENT ON COLUMN bank_transactions.amount IS 'Amount in cents. Positive for deposits/credits, negative for withdrawals/debits';
COMMENT ON COLUMN bank_accounts.balance IS 'Current balance in cents';
