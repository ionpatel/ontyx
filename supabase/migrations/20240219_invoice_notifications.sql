-- =============================================================================
-- INVOICE NOTIFICATIONS & PAYMENT LINKS
-- Track how invoices are sent and enable quick payment links
-- =============================================================================

-- Invoice notifications log
CREATE TABLE IF NOT EXISTS invoice_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Notification details
    notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('email', 'sms', 'whatsapp', 'mail')),
    recipient VARCHAR(255) NOT NULL, -- Email or phone number
    message TEXT,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'opened', 'clicked')),
    external_id VARCHAR(255), -- Twilio SID, SendGrid ID, etc.
    
    -- Timestamps
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment links for quick mobile payments
CREATE TABLE IF NOT EXISTS payment_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Link details
    token VARCHAR(50) UNIQUE NOT NULL, -- Short URL token
    
    -- Payment status
    amount_cents BIGINT, -- Optional: preset amount
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paid', 'expired', 'cancelled')),
    
    -- Tracking
    views INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    -- Expiration
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoice_notifications_invoice ON invoice_notifications(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_notifications_type ON invoice_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_payment_links_token ON payment_links(token);
CREATE INDEX IF NOT EXISTS idx_payment_links_invoice ON payment_links(invoice_id);

-- RLS
ALTER TABLE invoice_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only see notifications for their org's invoices
CREATE POLICY invoice_notifications_policy ON invoice_notifications
    FOR ALL USING (
        invoice_id IN (
            SELECT i.id FROM invoices i
            JOIN organization_members om ON i.organization_id = om.organization_id
            WHERE om.user_id = auth.uid()
        )
    );

CREATE POLICY payment_links_policy ON payment_links
    FOR ALL USING (
        invoice_id IN (
            SELECT i.id FROM invoices i
            JOIN organization_members om ON i.organization_id = om.organization_id
            WHERE om.user_id = auth.uid()
        )
    );

-- Comments
COMMENT ON TABLE invoice_notifications IS 'Log of all invoice delivery methods (email, SMS, WhatsApp)';
COMMENT ON TABLE payment_links IS 'Short payment links for quick mobile payments';
COMMENT ON COLUMN invoice_notifications.external_id IS 'External service message ID (Twilio SID, SendGrid ID)';
COMMENT ON COLUMN payment_links.token IS 'URL-safe token for payment link (e.g., pay.ontyx.ca/i/{token})';
