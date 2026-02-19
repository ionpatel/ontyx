-- Add missing onboarding columns that weren't in 00019_onboarding.sql
-- These columns are required by the /api/onboarding/complete endpoint

-- Add tier column for plan selection during onboarding
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'starter' 
CHECK (tier IN ('starter', 'growth', 'enterprise'));

-- Add province column for Canadian businesses
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS province VARCHAR(2);

-- Comments
COMMENT ON COLUMN organizations.tier IS 'User-selected tier during onboarding: starter, growth, enterprise';
COMMENT ON COLUMN organizations.province IS 'Canadian province code (ON, BC, AB, etc.)';
