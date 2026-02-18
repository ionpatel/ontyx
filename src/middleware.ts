import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that don't require authentication (public pages only)
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
  '/features',
  '/integrations',
  '/changelog',
  '/blog',
  '/careers',
  '/partners',
  '/demo',
  '/help',
  '/docs',
  '/api-docs',
]

// Routes that should bypass auth check entirely (let Next.js handle 404s)
const bypassRoutes = [
  '/auth/callback',
  '/auth/confirm',
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

  // Check if route should bypass auth entirely
  const isBypassRoute = bypassRoutes.some(route => pathname.startsWith(route))
  if (isBypassRoute) {
    return response
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
  
  // Check if route is auth route (login, register, etc.)
  const isAuthRoute = authRoutes.some(route => pathname === route)

  // Check if route is explicitly a dashboard/protected route
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/onboarding') ||
                           pathname.startsWith('/settings') ||
                           pathname.startsWith('/invoices') ||
                           pathname.startsWith('/contacts') ||
                           pathname.startsWith('/inventory') ||
                           pathname.startsWith('/employees') ||
                           pathname.startsWith('/projects') ||
                           pathname.startsWith('/crm') ||
                           pathname.startsWith('/accounting') ||
                           pathname.startsWith('/payroll') ||
                           pathname.startsWith('/reports') ||
                           pathname.startsWith('/pos') ||
                           pathname.startsWith('/manufacturing') ||
                           pathname.startsWith('/warehouses') ||
                           pathname.startsWith('/purchases') ||
                           pathname.startsWith('/bills') ||
                           pathname.startsWith('/expenses') ||
                           pathname.startsWith('/banking') ||
                           pathname.startsWith('/appointments') ||
                           pathname.startsWith('/time-tracking') ||
                           pathname.startsWith('/time-off') ||
                           pathname.startsWith('/sales') ||
                           pathname.startsWith('/documents')

  // If user is logged in and trying to access auth routes, redirect to dashboard
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user is not logged in and trying to access explicitly protected routes, redirect to login
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // For all other routes (including unknown ones), let Next.js handle it
  // This allows proper 404 pages for non-existent public routes

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
