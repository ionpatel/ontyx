-- =============================================================================
-- ONBOARDING SUPPORT
-- Add business type, size, and onboarding status to organizations
-- =============================================================================

-- Add new columns to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS business_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS business_subtype VARCHAR(50),
ADD COLUMN IF NOT EXISTS business_size VARCHAR(20) CHECK (business_size IN ('solo', 'small', 'medium', 'large')),
ADD COLUMN IF NOT EXISTS enabled_modules TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS province VARCHAR(2);

-- Create index for business type filtering
CREATE INDEX IF NOT EXISTS idx_organizations_business_type ON organizations(business_type);
CREATE INDEX IF NOT EXISTS idx_organizations_onboarding ON organizations(onboarding_completed);

-- Update existing organizations to have onboarding completed (legacy users)
UPDATE organizations SET onboarding_completed = TRUE WHERE onboarding_completed IS NULL;

-- =============================================================================
-- DEFAULT CATEGORIES PER BUSINESS TYPE
-- Seed function to create default categories for new organizations
-- =============================================================================

CREATE OR REPLACE FUNCTION seed_default_categories(
    p_org_id UUID,
    p_business_type VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_categories TEXT[];
BEGIN
    -- Define categories based on business type
    CASE p_business_type
        WHEN 'trades' THEN
            v_categories := ARRAY['Parts & Materials', 'Tools & Equipment', 'Services', 'Labor'];
        WHEN 'retail' THEN
            v_categories := ARRAY['Products', 'Accessories', 'Clearance', 'New Arrivals'];
        WHEN 'food' THEN
            v_categories := ARRAY['Food & Beverages', 'Supplies', 'Equipment', 'Ingredients'];
        WHEN 'professional' THEN
            v_categories := ARRAY['Services', 'Consulting', 'Training', 'Software'];
        WHEN 'healthcare' THEN
            v_categories := ARRAY['Medical Supplies', 'Equipment', 'Services', 'Medications'];
        WHEN 'manufacturing' THEN
            v_categories := ARRAY['Raw Materials', 'Finished Goods', 'Work in Progress', 'Packaging'];
        ELSE
            v_categories := ARRAY['Products', 'Services', 'General'];
    END CASE;

    -- Insert categories
    INSERT INTO product_categories (organization_id, name, slug, is_active)
    SELECT 
        p_org_id,
        unnest(v_categories),
        lower(regexp_replace(unnest(v_categories), '[^a-zA-Z0-9]+', '-', 'g')),
        TRUE
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGER: Auto-seed categories when organization completes onboarding
-- =============================================================================

CREATE OR REPLACE FUNCTION on_organization_onboarding_complete()
RETURNS TRIGGER AS $$
BEGIN
    -- When onboarding is marked complete, seed default categories
    IF NEW.onboarding_completed = TRUE AND (OLD.onboarding_completed IS NULL OR OLD.onboarding_completed = FALSE) THEN
        PERFORM seed_default_categories(NEW.id, NEW.business_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_onboarding_complete ON organizations;
CREATE TRIGGER trigger_onboarding_complete
    AFTER UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION on_organization_onboarding_complete();

-- Also seed on insert if onboarding already complete
CREATE OR REPLACE FUNCTION on_organization_insert_seed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.onboarding_completed = TRUE THEN
        PERFORM seed_default_categories(NEW.id, NEW.business_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_organization_insert_seed ON organizations;
CREATE TRIGGER trigger_organization_insert_seed
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION on_organization_insert_seed();

COMMENT ON COLUMN organizations.business_type IS 'trades, retail, food, professional, healthcare, manufacturing';
COMMENT ON COLUMN organizations.business_subtype IS 'Specific subtype within business_type';
COMMENT ON COLUMN organizations.business_size IS 'solo, small, medium, large';
COMMENT ON COLUMN organizations.enabled_modules IS 'Array of enabled module names';
