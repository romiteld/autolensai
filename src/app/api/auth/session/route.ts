import { NextRequest, NextResponse } from 'next/server';
import { 
  withOptionalAuth,
  AuthContext,
  publicApiMiddleware,
  APIError 
} from '@/api/middleware';

// GET /api/auth/session - Get current session info
async function getSessionHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  if (!context.isAuthenticated) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      session: null
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: context.user!.id,
      email: context.user!.email,
      roles: context.user!.app_metadata?.roles || [],
      permissions: context.user!.app_metadata?.permissions || [],
      metadata: context.user!.user_metadata || {}
    },
    session: {
      expires_at: context.session?.expires_at,
      token_type: context.session?.token_type
    }
  });
}

// DELETE /api/auth/session - Sign out
async function deleteSessionHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  if (!context.isAuthenticated) {
    throw new APIError('No active session to sign out', 401);
  }

  try {
    // In a real implementation, you would invalidate the session
    // For now, we'll just return a success response
    return NextResponse.json({
      message: 'Successfully signed out',
      success: true
    });
  } catch (error) {
    throw new APIError('Failed to sign out', 500);
  }
}

// Apply middleware to routes
export const GET = withOptionalAuth(getSessionHandler);
export const DELETE = withOptionalAuth(deleteSessionHandler);