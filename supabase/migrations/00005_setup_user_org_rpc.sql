-- Ontyx ERP - User Organization Setup RPC
-- Workaround for auth.users trigger not firing
-- Called from frontend after signup

-- =============================================================================
-- SETUP USER ORGANIZATION RPC
-- =============================================================================
-- Creates user profile, organization, member, and default warehouse in one transaction

CREATE OR REPLACE FUNCTION setup_user_organization(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_company_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id UUID;
    v_slug TEXT;
    v_warehouse_id UUID;
BEGIN
    -- 1. Create user profile (if not exists)
    INSERT INTO users (id, email, full_name, status)
    VALUES (p_user_id, p_email, p_full_name, 'active')
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        updated_at = NOW();

    -- 2. Check if user already has an organization
    SELECT organization_id INTO v_org_id
    FROM organization_members
    WHERE user_id = p_user_id
    LIMIT 1;

    IF v_org_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'organization_id', v_org_id,
            'message', 'User already has organization'
        );
    END IF;

    -- 3. Generate unique slug
    v_slug := lower(regexp_replace(p_company_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    
    -- Ensure uniqueness by appending random suffix if needed
    IF EXISTS (SELECT 1 FROM organizations WHERE slug = v_slug) THEN
        v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
    END IF;

    -- 4. Create organization
    INSERT INTO organizations (
        name,
        slug,
        email,
        status,
        currency,
        timezone,
        country
    ) VALUES (
        p_company_name,
        v_slug,
        p_email,
        'trial',
        'CAD',
        'America/Toronto',
        'CA'
    )
    RETURNING id INTO v_org_id;

    -- 5. Create organization member (owner)
    INSERT INTO organization_members (
        organization_id,
        user_id,
        role,
        is_active,
        joined_at
    ) VALUES (
        v_org_id,
        p_user_id,
        'owner',
        true,
        NOW()
    );

    -- 6. Create default warehouse (use is_primary, NOT is_default)
    INSERT INTO warehouses (
        organization_id,
        code,
        name,
        is_primary,
        is_active
    ) VALUES (
        v_org_id,
        'MAIN',
        'Main Warehouse',
        true,
        true
    )
    RETURNING id INTO v_warehouse_id;

    RETURN jsonb_build_object(
        'success', true,
        'organization_id', v_org_id,
        'warehouse_id', v_warehouse_id,
        'message', 'Organization created successfully'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION setup_user_organization TO authenticated;

-- =============================================================================
-- HELPER: Get user's organization ID
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND is_active = true
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_user_organization_id TO authenticated;
