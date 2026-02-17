-- Allow users to see their own membership records directly
CREATE POLICY IF NOT EXISTS "Users can view own membership" ON organization_members
    FOR SELECT USING (user_id = auth.uid());
