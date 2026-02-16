/**
 * Sets up automatic organization creation on user signup
 */

const { Client } = require('pg');

const client = new Client({
  host: 'db.ufsuqflsiezkaqtoevvc.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASSWORD || '15022003H@rsh!l',
  ssl: { rejectUnauthorized: false }
});

const setupSQL = `
-- Function to create organization and membership for new users
CREATE OR REPLACE FUNCTION create_user_organization()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
    org_name TEXT;
    org_slug TEXT;
BEGIN
    -- Generate org name from email
    org_name := COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1) || '''s Company');
    org_slug := LOWER(REGEXP_REPLACE(org_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
    
    -- Create organization
    INSERT INTO organizations (
        name, 
        slug, 
        email,
        country,
        timezone,
        currency,
        plan,
        status,
        trial_ends_at
    )
    VALUES (
        org_name,
        org_slug,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'country', 'CA'),
        'America/Toronto',
        'CAD',
        'trial',
        'trial',
        NOW() + INTERVAL '14 days'
    )
    RETURNING id INTO org_id;
    
    -- Add user as organization owner
    INSERT INTO organization_members (
        organization_id,
        user_id,
        role,
        is_active,
        joined_at
    )
    VALUES (
        org_id,
        NEW.id,
        'owner',
        true,
        NOW()
    );
    
    -- Create default warehouse
    INSERT INTO warehouses (
        organization_id,
        code,
        name,
        country,
        is_primary,
        is_active
    )
    VALUES (
        org_id,
        'MAIN',
        'Main Warehouse',
        COALESCE(NEW.raw_user_meta_data->>'country', 'CA'),
        true,
        true
    );
    
    -- Create default product categories
    INSERT INTO product_categories (organization_id, name, slug, is_active) VALUES
        (org_id, 'Products', 'products', true),
        (org_id, 'Services', 'services', true);
    
    -- Create basic chart of accounts
    INSERT INTO chart_of_accounts (organization_id, code, name, account_type, is_active) VALUES
        (org_id, '1000', 'Cash', 'asset', true),
        (org_id, '1100', 'Accounts Receivable', 'asset', true),
        (org_id, '1200', 'Inventory', 'asset', true),
        (org_id, '2000', 'Accounts Payable', 'liability', true),
        (org_id, '3000', 'Owner Equity', 'equity', true),
        (org_id, '4000', 'Sales Revenue', 'revenue', true),
        (org_id, '5000', 'Cost of Goods Sold', 'expense', true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_user_created_setup_org ON users;

-- Create trigger on users table (fires after handle_new_user creates the profile)
CREATE TRIGGER on_user_created_setup_org
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_organization();

-- Also update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name, avatar_url, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        'active'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function setup() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    console.log('🔧 Setting up auto-organization creation...\n');
    await client.query(setupSQL);
    
    console.log('✅ Done! New users will now automatically get:');
    console.log('   • Personal organization (14-day trial)');
    console.log('   • Owner role');
    console.log('   • Default warehouse');
    console.log('   • Basic product categories');
    console.log('   • Chart of accounts');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

setup();
