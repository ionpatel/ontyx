-- =====================================================
-- ONTYX: Fix Auth Trigger + Auto-Create Organization
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Create improved function that:
--    a) Creates user profile in public.users
--    b) Creates organization from signup metadata
--    c) Adds user as organization owner
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
    company_name TEXT;
    user_full_name TEXT;
    user_province TEXT;
    user_industry TEXT;
BEGIN
    -- Extract metadata
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    company_name := COALESCE(
        NEW.raw_user_meta_data->>'company_name',
        user_full_name || '''s Business'
    );
    user_province := COALESCE(NEW.raw_user_meta_data->>'province', 'ON');
    user_industry := COALESCE(NEW.raw_user_meta_data->>'industry', 'other');

    -- 1. Create user profile
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        user_full_name,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url;

    -- 2. Create organization for the user
    INSERT INTO public.organizations (
        name,
        slug,
        country,
        province,
        industry,
        currency,
        timezone
    ) VALUES (
        company_name,
        lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(NEW.id::text, 1, 8),
        'CA',
        user_province,
        user_industry,
        'CAD',
        'America/Toronto'
    )
    RETURNING id INTO new_org_id;

    -- 3. Add user as organization owner
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        is_active
    ) VALUES (
        new_org_id,
        NEW.id,
        'owner',
        true
    );

    -- 4. Create default warehouse for the organization
    INSERT INTO public.warehouses (
        organization_id,
        name,
        code,
        is_default,
        is_active
    ) VALUES (
        new_org_id,
        'Main Warehouse',
        'MAIN',
        true,
        true
    );

    -- 5. Seed default product categories
    INSERT INTO public.product_categories (organization_id, name, slug, description, is_active)
    VALUES 
        (new_org_id, 'General', 'general', 'General products', true),
        (new_org_id, 'Services', 'services', 'Service items', true);

    -- 6. Seed default chart of accounts (Canadian standard)
    INSERT INTO public.chart_of_accounts (organization_id, code, name, type, is_system, is_active)
    VALUES 
        (new_org_id, '1000', 'Cash', 'asset', true, true),
        (new_org_id, '1100', 'Accounts Receivable', 'asset', true, true),
        (new_org_id, '1200', 'Inventory', 'asset', true, true),
        (new_org_id, '2000', 'Accounts Payable', 'liability', true, true),
        (new_org_id, '2100', 'GST/HST Payable', 'liability', true, true),
        (new_org_id, '3000', 'Owner''s Equity', 'equity', true, true),
        (new_org_id, '4000', 'Sales Revenue', 'revenue', true, true),
        (new_org_id, '5000', 'Cost of Goods Sold', 'expense', true, true),
        (new_org_id, '6000', 'Operating Expenses', 'expense', true, true);

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail auth
    RAISE WARNING 'handle_new_user error: % %', SQLERRM, SQLSTATE;
    
    -- Still try to create the basic user profile
    BEGIN
        INSERT INTO public.users (id, email, full_name)
        VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1))
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if this also fails
    END;
    
    RETURN NEW;
END;
$$;

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. Sync existing auth users who don't have profiles
INSERT INTO public.users (id, email, full_name)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Done!
SELECT 'Auth trigger installed successfully!' as status;
