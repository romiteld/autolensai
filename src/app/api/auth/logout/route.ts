import { NextRequest, NextResponse } from 'next/server';
import { 
  withOptionalAuth,
  AuthContext,
  publicApiMiddleware,
  APIError 
} from '@/api/middleware';
import { authService } from '@/core/services';

// POST /api/auth/logout - User logout
async function logoutHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  try {
    // Sign out the user (this invalidates the session in Supabase)
    if (context.isAuthenticated) {
      const result = await authService.signOut();
      
      if (!result.success) {
        console.error('Logout error:', result.error);
        // Continue with cookie clearing even if Supabase logout fails
      }
    }

    // Create response
    const response = NextResponse.json({
      message: 'Logout successful'
    });

    // Clear authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0, // Expire immediately
      expires: new Date(0) // Set to past date
    };

    response.cookies.set('access_token', '', cookieOptions);
    response.cookies.set('refresh_token', '', cookieOptions);

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, we should clear the cookies
    const response = NextResponse.json({
      message: 'Logout completed with errors',
      error: 'Session cleanup may have failed'
    }, { status: 200 }); // Still return 200 since user intent is achieved

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
      expires: new Date(0)
    };

    response.cookies.set('access_token', '', cookieOptions);
    response.cookies.set('refresh_token', '', cookieOptions);

    return response;
  }
}

// Apply middleware (optional auth since logout should work even if session is invalid)
export const POST = withOptionalAuth(logoutHandler);