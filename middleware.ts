import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from './src/common/types/database.types';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/vehicles',
  '/listings',
  '/profile',
  '/settings',
  '/billing',
];

// Routes that should redirect to dashboard if authenticated
const authOnlyRoutes = [
  '/auth/login',
  '/auth/register',
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Skip middleware for API routes, static files, and other non-page routes
  if (
    req.nextUrl.pathname.startsWith('/api') ||
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/favicon') ||
    req.nextUrl.pathname.includes('.') ||
    req.nextUrl.pathname === '/'
  ) {
    return res;
  }

  try {
    const supabase = createMiddlewareClient<Database>({ req, res });
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth middleware error:', error);
      return res;
    }

    const pathname = req.nextUrl.pathname;
    const isAuthenticated = !!session?.user;

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && authOnlyRoutes.some(route => pathname.startsWith(route))) {
      const redirectUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect unauthenticated users from protected routes
    if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return res;
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};