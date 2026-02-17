-- Chatter System - Comments and Activities on any record
-- Like Odoo's chatter feature

CREATE TABLE IF NOT EXISTS chatter_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Polymorphic relation (any entity)
  entity_type TEXT NOT NULL, -- 'contact', 'invoice', 'ticket', etc.
  entity_id UUID NOT NULL,
  
  -- Message content
  type TEXT NOT NULL DEFAULT 'note' CHECK (type IN ('note', 'activity', 'system', 'email')),
  content TEXT NOT NULL,
  
  -- Activity-specific fields
  activity_type TEXT, -- 'call', 'email', 'meeting', 'todo', 'note'
  due_date DATE,
  is_done BOOLEAN DEFAULT false,
  
  -- Author
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chatter_entity ON chatter_messages(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_chatter_org ON chatter_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_chatter_created ON chatter_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatter_pending_activities ON chatter_messages(organization_id, is_done) 
  WHERE type = 'activity' AND is_done = false;

-- RLS
ALTER TABLE chatter_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org chatter"
  ON chatter_messages FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create chatter messages"
  ON chatter_messages FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own chatter messages"
  ON chatter_messages FOR UPDATE
  USING (created_by = auth.uid() OR organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own chatter messages"
  ON chatter_messages FOR DELETE
  USING (created_by = auth.uid());

-- Saved Filters (like Odoo's favorites)
CREATE TABLE IF NOT EXISTS saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Filter definition
  name TEXT NOT NULL,
  module TEXT NOT NULL, -- 'invoices', 'contacts', etc.
  filters JSONB NOT NULL DEFAULT '{}',
  sort JSONB,
  
  -- Settings
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, module, name)
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user ON saved_filters(user_id, module);

ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own filters"
  ON saved_filters FOR ALL
  USING (user_id = auth.uid() OR (is_shared AND organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )));

-- Recent Items (quick access)
CREATE TABLE IF NOT EXISTS recent_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT,
  
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_recent_items_user ON recent_items(user_id, accessed_at DESC);

ALTER TABLE recent_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recent items"
  ON recent_items FOR ALL
  USING (user_id = auth.uid());

-- Function to track recent item access
CREATE OR REPLACE FUNCTION track_recent_item(
  p_user_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_name TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO recent_items (user_id, entity_type, entity_id, entity_name, accessed_at)
  VALUES (p_user_id, p_entity_type, p_entity_id, p_entity_name, NOW())
  ON CONFLICT (user_id, entity_type, entity_id)
  DO UPDATE SET entity_name = p_entity_name, accessed_at = NOW();
  
  -- Keep only last 50 recent items per user
  DELETE FROM recent_items 
  WHERE user_id = p_user_id 
    AND id NOT IN (
      SELECT id FROM recent_items 
      WHERE user_id = p_user_id 
      ORDER BY accessed_at DESC 
      LIMIT 50
    );
END;
$$ LANGUAGE plpgsql;
