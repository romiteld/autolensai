import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/common/types/database.types';

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

export async function authMiddleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });
  
  try {
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