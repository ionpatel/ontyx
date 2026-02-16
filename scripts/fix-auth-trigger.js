#!/usr/bin/env node
/**
 * Fix the auth.users trigger for Supabase
 * Run this via Supabase SQL Editor or with postgres connection
 */

const SUPABASE_URL = 'https://ufsuqflsiezkaqtoevvc.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmc3VxZmxzaWV6a2FxdG9ldnZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTIwNTExNiwiZXhwIjoyMDg2NzgxMTE2fQ.OXH-8E0VUmaaAVRUiE7jYf912QlFfSDpHWazvZq4G8g';

// The SQL to fix the trigger
const SQL = `
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with proper permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the auth user creation
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Ensure service_role can insert into users table (bypasses RLS)
-- Service role already has these permissions but let's be explicit
GRANT ALL ON public.users TO service_role;
`;

console.log('='.repeat(60));
console.log('SQL TO RUN IN SUPABASE SQL EDITOR:');
console.log('='.repeat(60));
console.log(SQL);
console.log('='.repeat(60));
console.log('\nGo to: https://supabase.com/dashboard/project/ufsuqflsiezkaqtoevvc/sql/new');
console.log('Paste the SQL above and click "Run"');
