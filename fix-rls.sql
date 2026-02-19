-- Allow organization members to update their own organization
CREATE POLICY IF NOT EXISTS "Members can update their organization"
ON organizations FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);
