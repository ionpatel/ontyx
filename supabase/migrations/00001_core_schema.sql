-- Ontyx ERP - Core Schema Migration
-- Organizations, Users, Roles, Permissions
-- Multi-tenant foundation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE org_status AS ENUM ('active', 'suspended', 'cancelled', 'trial');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'manager', 'member', 'viewer');
CREATE TYPE currency_code AS ENUM ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'CNY');

-- =============================================================================
-- ORGANIZATIONS
-- =============================================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'US',
    
    -- Settings
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    currency currency_code DEFAULT 'USD',
    fiscal_year_start INTEGER DEFAULT 1, -- Month (1-12)
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    
    -- Billing
    plan VARCHAR(50) DEFAULT 'trial',
    trial_ends_at TIMESTAMPTZ,
    subscription_id VARCHAR(255),
    
    -- Status
    status org_status DEFAULT 'trial',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);

-- =============================================================================
-- USERS (extends Supabase auth.users)
-- =============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(50),
    
    -- Preferences
    theme VARCHAR(20) DEFAULT 'system',
    locale VARCHAR(10) DEFAULT 'en-US',
    notifications_enabled BOOLEAN DEFAULT true,
    
    -- Status
    status user_status DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ORGANIZATION MEMBERS (Join table)
-- =============================================================================

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role member_role DEFAULT 'member',
    title VARCHAR(100),
    department VARCHAR(100),
    
    -- Permissions override
    custom_permissions JSONB DEFAULT '{}',
    
    -- Status
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(role);

-- =============================================================================
-- ROLES & PERMISSIONS
-- =============================================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false, -- System roles can't be deleted
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, name)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL, -- invoices, inventory, etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE member_roles (
    member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    
    PRIMARY KEY (member_id, role_id)
);

-- =============================================================================
-- AUDIT LOG
-- =============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(50) NOT NULL, -- create, update, delete, login, etc.
    entity_type VARCHAR(100) NOT NULL, -- invoice, contact, etc.
    entity_id UUID,
    
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- =============================================================================
-- SETTINGS (Key-Value per org)
-- =============================================================================

CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, key)
);

CREATE INDEX idx_settings_org_key ON settings(organization_id, key);

-- =============================================================================
-- FILE ATTACHMENTS
-- =============================================================================

CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    
    entity_type VARCHAR(100), -- invoice, contact, etc.
    entity_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_org ON attachments(organization_id);
CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Org members can see their organizations
CREATE POLICY "Members can view their organizations" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Org members can see other members in same org
CREATE POLICY "Members can view org members" ON organization_members
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Admins can manage org members
CREATE POLICY "Admins can manage org members" ON organization_members
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner', 'admin')
        )
    );

-- Roles visible to org members
CREATE POLICY "Members can view roles" ON roles
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Permissions are public (read-only)
CREATE POLICY "Permissions are viewable" ON permissions
    FOR SELECT USING (true);

-- Settings visible to org members
CREATE POLICY "Members can view settings" ON settings
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Audit logs visible to admins
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner', 'admin')
        )
    );

-- Attachments visible to org members
CREATE POLICY "Members can view attachments" ON attachments
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at_organizations BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_organization_members BEFORE UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_roles BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_settings BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get current user's org
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT organization_id INTO org_id
    FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SEED DEFAULT PERMISSIONS
-- =============================================================================

INSERT INTO permissions (code, name, module, description) VALUES
-- Invoices
('invoices.view', 'View Invoices', 'invoices', 'Can view all invoices'),
('invoices.create', 'Create Invoices', 'invoices', 'Can create new invoices'),
('invoices.edit', 'Edit Invoices', 'invoices', 'Can edit existing invoices'),
('invoices.delete', 'Delete Invoices', 'invoices', 'Can delete invoices'),
('invoices.send', 'Send Invoices', 'invoices', 'Can send invoices to customers'),

-- Bills
('bills.view', 'View Bills', 'bills', 'Can view all bills'),
('bills.create', 'Create Bills', 'bills', 'Can create new bills'),
('bills.edit', 'Edit Bills', 'bills', 'Can edit existing bills'),
('bills.delete', 'Delete Bills', 'bills', 'Can delete bills'),
('bills.approve', 'Approve Bills', 'bills', 'Can approve bills for payment'),

-- Banking
('banking.view', 'View Banking', 'banking', 'Can view bank accounts and transactions'),
('banking.reconcile', 'Reconcile Transactions', 'banking', 'Can reconcile bank transactions'),
('banking.manage', 'Manage Bank Accounts', 'banking', 'Can add/edit bank accounts'),

-- Accounting
('accounting.view', 'View Accounting', 'accounting', 'Can view chart of accounts and journals'),
('accounting.journals', 'Create Journal Entries', 'accounting', 'Can create manual journal entries'),
('accounting.close', 'Close Periods', 'accounting', 'Can close accounting periods'),

-- Inventory
('inventory.view', 'View Inventory', 'inventory', 'Can view products and stock levels'),
('inventory.manage', 'Manage Inventory', 'inventory', 'Can adjust stock and create movements'),
('inventory.products', 'Manage Products', 'inventory', 'Can create/edit products'),

-- Sales
('sales.view', 'View Sales', 'sales', 'Can view sales orders'),
('sales.create', 'Create Sales Orders', 'sales', 'Can create new sales orders'),
('sales.edit', 'Edit Sales Orders', 'sales', 'Can edit sales orders'),
('sales.approve', 'Approve Sales Orders', 'sales', 'Can approve sales orders'),

-- Purchases
('purchases.view', 'View Purchases', 'purchases', 'Can view purchase orders'),
('purchases.create', 'Create Purchase Orders', 'purchases', 'Can create new purchase orders'),
('purchases.approve', 'Approve Purchases', 'purchases', 'Can approve purchase orders'),

-- Contacts
('contacts.view', 'View Contacts', 'contacts', 'Can view contacts'),
('contacts.manage', 'Manage Contacts', 'contacts', 'Can create/edit contacts'),

-- CRM
('crm.view', 'View CRM', 'crm', 'Can view leads and opportunities'),
('crm.manage', 'Manage CRM', 'crm', 'Can create/edit leads and opportunities'),

-- Projects
('projects.view', 'View Projects', 'projects', 'Can view projects and tasks'),
('projects.manage', 'Manage Projects', 'projects', 'Can create/edit projects'),

-- HR
('hr.view', 'View HR', 'hr', 'Can view employees'),
('hr.manage', 'Manage HR', 'hr', 'Can manage employee records'),
('hr.payroll', 'Manage Payroll', 'hr', 'Can run and manage payroll'),

-- Reports
('reports.view', 'View Reports', 'reports', 'Can view reports'),
('reports.export', 'Export Reports', 'reports', 'Can export reports'),

-- Settings
('settings.view', 'View Settings', 'settings', 'Can view organization settings'),
('settings.manage', 'Manage Settings', 'settings', 'Can modify organization settings'),
('settings.users', 'Manage Users', 'settings', 'Can invite/manage users');
