-- Add tier column for onboarding plan selection
-- tier = user's selected plan during onboarding (starter, growth, enterprise)
-- plan = actual billing status (trial, free, paid, etc.)

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'starter' 
CHECK (tier IN ('starter', 'growth', 'enterprise'));

COMMENT ON COLUMN organizations.tier IS 'User-selected tier during onboarding: starter, growth, enterprise';
