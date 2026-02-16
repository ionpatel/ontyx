import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Check if Supabase is configured (demo mode if not)
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && !url.includes('placeholder'))
}

// Routes that don't require authentication
// NOTE: Dashboard routes are public for demo mode - users can explore without login
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/about',
  '/pricing',
  '/contact',
  '/terms',
  '/privacy',
  '/security',
  '/pipeda',
  // Demo mode - allow dashboard access without auth
  '/dashboard',
  '/contacts',
  '/invoices',
  '/sales',
  '/inventory',
  '/purchases',
  '/bills',
  '/accounting',
  '/banking',
  '/employees',
  '/payroll',
  '/reports',
  '/settings',
  '/projects',
  '/manufacturing',
  '/warehouses',
  '/crm',
  '/apps',
]

// Routes that should redirect to dashboard if logged in
const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  const { response, user } = await updateSession(request)

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
  
  // Check if route is auth route (login, register, etc.)
  const isAuthRoute = authRoutes.some(route => pathname === route)

  // If user is logged in and trying to access auth routes, redirect to dashboard
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user is not logged in and trying to access protected routes
  // BUT allow demo mode (when Supabase is not configured)
  if (!user && !isPublicRoute && isSupabaseConfigured()) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
