-- =============================================================================
-- TEAM INVITES TABLE
-- For multi-user team management
-- =============================================================================

-- Add role column to organization_members if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organization_members' AND column_name = 'role'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN role VARCHAR(20) DEFAULT 'member';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organization_members' AND column_name = 'invited_by'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN invited_by UUID REFERENCES users(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organization_members' AND column_name = 'invited_at'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN invited_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organization_members' AND column_name = 'accepted_at'
  ) THEN
    ALTER TABLE organization_members ADD COLUMN accepted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Team invites table
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  
  invited_by UUID REFERENCES users(id),
  token VARCHAR(64) NOT NULL UNIQUE,
  
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_invites_org ON team_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_status ON team_invites(status);

-- RLS
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invites for their org"
  ON team_invites FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create invites"
  ON team_invites FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update invites"
  ON team_invites FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Anyone can view an invite by token (for accepting)
CREATE POLICY "Anyone can view invite by token"
  ON team_invites FOR SELECT
  USING (true);
