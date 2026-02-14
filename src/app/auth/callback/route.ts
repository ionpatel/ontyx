import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const setup = searchParams.get('setup');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // If this is a new signup, redirect to setup
      if (setup === 'true') {
        return NextResponse.redirect(`${origin}/setup`);
      }
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/login?error=auth_error`);
}
