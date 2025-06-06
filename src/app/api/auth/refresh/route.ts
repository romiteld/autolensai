import { NextRequest, NextResponse } from 'next/server';
import { 
  publicApiMiddleware,
  APIError 
} from '@/api/middleware';
import { createSupabaseClient } from '@/core/database/supabase';

// POST /api/auth/refresh - Refresh authentication token
async function refreshHandler(request: NextRequest): Promise<NextResponse> {
  try {
    // Get refresh token from cookies or request body
    let refreshToken = request.cookies.get('refresh_token')?.value;
    
    if (!refreshToken) {
      const body = await request.json().catch(() => ({}));
      refreshToken = body.refreshToken;
    }

    if (!refreshToken) {
      throw new APIError('No refresh token provided', 401);
    }

    // Use Supabase client to refresh the session
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !data.session) {
      throw new APIError('Invalid or expired refresh token', 401);
    }

    // Prepare response data
    const responseData = {
      message: 'Token refreshed successfully',
      user: {
        id: data.user!.id,
        email: data.user!.email || '',
        emailVerified: data.user!.email_confirmed_at ? true : false,
        roles: data.user!.app_metadata?.roles || ['user']
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
        tokenType: data.session.token_type
      }
    };

    const response = NextResponse.json(responseData);

    // Update cookies with new tokens
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 24 * 60 * 60 // 1 day for access token
    };

    response.cookies.set('access_token', data.session.access_token, cookieOptions);
    
    if (data.session.refresh_token) {
      response.cookies.set('refresh_token', data.session.refresh_token, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 // 30 days for refresh token
      });
    }

    return response;

  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    console.error('Token refresh error:', error);
    throw new APIError('Token refresh failed', 500);
  }
}

// Apply middleware
export const POST = publicApiMiddleware(refreshHandler);