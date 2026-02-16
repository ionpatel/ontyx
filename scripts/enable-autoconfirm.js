/**
 * Note: This requires Supabase Dashboard access
 * Go to: Authentication > Email Templates > Confirm signup
 * Or: Authentication > Providers > Email > Enable "Confirm email" = OFF
 * 
 * For now, let's just output the settings URL
 */

console.log(`
📧 Email Confirmation Settings

To enable auto-confirm (skip email verification):

1. Go to Supabase Dashboard:
   https://supabase.com/dashboard/project/ufsuqflsiezkaqtoevvc/auth/providers

2. Click on "Email" provider

3. Toggle OFF "Confirm email"

4. Save

This will let users sign up and log in immediately without email verification.
For production, you may want to keep it ON.
`);
