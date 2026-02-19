-- Add onboarding_completed column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Also add other onboarding-related columns if missing
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS business_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_subtype VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_size VARCHAR(50),
ADD COLUMN IF NOT EXISTS enabled_modules TEXT[],
ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'starter';

-- Set default for existing records
UPDATE organizations 
SET onboarding_completed = FALSE 
WHERE onboarding_completed IS NULL;
