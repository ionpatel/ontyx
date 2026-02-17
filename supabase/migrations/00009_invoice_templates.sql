-- Invoice Templates table
CREATE TABLE IF NOT EXISTS invoice_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL DEFAULT 'Default',
    is_default BOOLEAN DEFAULT false,
    
    -- Colors
    primary_color VARCHAR(20) DEFAULT '#DC2626',
    secondary_color VARCHAR(20) DEFAULT '#1f2937',
    
    -- Logo settings
    logo_position VARCHAR(20) DEFAULT 'left' CHECK (logo_position IN ('left', 'center', 'right')),
    logo_size VARCHAR(20) DEFAULT 'medium' CHECK (logo_size IN ('small', 'medium', 'large')),
    
    -- Font
    font_style VARCHAR(20) DEFAULT 'modern' CHECK (font_style IN ('modern', 'classic', 'minimal')),
    
    -- Custom text
    header_text TEXT,
    footer_text TEXT DEFAULT 'Thank you for your business!',
    payment_instructions TEXT DEFAULT 'Payment is due within the terms specified above.',
    thank_you_message TEXT,
    
    -- Visibility toggles
    show_logo BOOLEAN DEFAULT true,
    show_company_address BOOLEAN DEFAULT true,
    show_customer_address BOOLEAN DEFAULT true,
    show_payment_terms BOOLEAN DEFAULT true,
    show_due_date BOOLEAN DEFAULT true,
    show_invoice_number BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, name)
);

-- Enable RLS
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own org templates" ON invoice_templates
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can manage own org templates" ON invoice_templates
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Index
CREATE INDEX idx_invoice_templates_org ON invoice_templates(organization_id);
