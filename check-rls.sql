-- Check if RLS is enabled on organizations
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'organizations';

-- List all policies on organizations
SELECT pol.polname, pol.polcmd, pol.polpermissive
FROM pg_policy pol
JOIN pg_class pc ON pc.oid = pol.polrelid
WHERE pc.relname = 'organizations';
