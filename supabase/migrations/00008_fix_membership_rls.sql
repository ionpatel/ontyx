-- Fix RLS circular dependency on organization_members
-- Users need to see their own membership to find their org_id

-- Drop existing policies that may conflict
DROP POLICY IF EXISTS "Users can view own membership" ON organization_members;
DROP POLICY IF EXISTS "select_own_membership" ON organization_members;

-- Add direct self-query policy (no circular dependency)
CREATE POLICY "Users can view own membership"
    ON organization_members
    FOR SELECT
    USING (user_id = auth.uid());

-- Also ensure users can see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
    ON users
    FOR SELECT
    USING (id = auth.uid());

-- Users can update own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
    ON users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
