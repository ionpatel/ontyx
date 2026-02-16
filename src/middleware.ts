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

  // If user is not logged in and trying to access protected routes, redirect to login
  if (!user && !isPublicRoute) {
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
