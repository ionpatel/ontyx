import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Only use singleton on client-side
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  // Only singleton on browser (avoid SSR issues)
  if (typeof window !== 'undefined') {
    if (!browserClient) {
      browserClient = createBrowserClient<Database>(supabaseUrl, supabaseKey)
    }
    return browserClient
  }

  // Server-side: create fresh client
  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}

// Supabase is always required now - no demo mode
export function isSupabaseConfigured(): boolean {
  return true
}
