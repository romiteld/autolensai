import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  publicApiMiddleware,
  ValidationError,
  APIError 
} from '@/api/middleware';
import { authService } from '@/core/services';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
});

// POST /api/auth/login - User login
async function loginHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      throw new ValidationError('Invalid login data', validationResult.error.errors);
    }

    const { email, password, rememberMe } = validationResult.data;

    const result = await authService.signIn({ email, password });

    if (!result.success) {
      // Don't reveal whether the email exists or not
      throw new APIError('Invalid email or password', 401);
    }

    // Prepare response data
    const responseData = {
      message: 'Login successful',
      user: {
        id: result.data!.user.id,
        email: result.data!.user.email,
        emailVerified: result.data!.user.email_verified || false,
        roles: result.data!.user.app_metadata?.roles || ['user'],
        metadata: {
          firstName: result.data!.user.user_metadata?.firstName,
          lastName: result.data!.user.user_metadata?.lastName
        }
      },
      session: {
        accessToken: result.data!.session.access_token,
        refreshToken: result.data!.session.refresh_token,
        expiresIn: result.data!.session.expires_in,
        tokenType: result.data!.session.token_type
      }
    };

    const response = NextResponse.json(responseData);

    // Set secure HTTP-only cookies for session management
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30 days or 1 day
    };

    response.cookies.set('access_token', result.data!.session.access_token, cookieOptions);
    
    if (result.data!.session.refresh_token) {
      response.cookies.set('refresh_token', result.data!.session.refresh_token, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 // Always 30 days for refresh token
      });
    }

    return response;

  } catch (error) {
    if (error instanceof ValidationError || error instanceof APIError) {
      throw error;
    }
    
    console.error('Login error:', error);
    throw new APIError('Login failed. Please try again.', 500);
  }
}

// Apply middleware with stricter rate limiting for auth endpoints
export const POST = publicApiMiddleware(loginHandler);