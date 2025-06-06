import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  publicApiMiddleware,
  createValidationMiddleware,
  ValidationError,
  APIError 
} from '@/api/middleware';
import { authService } from '@/core/services';

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
});

// POST /api/auth/register - User registration
async function registerHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      throw new ValidationError('Invalid registration data', validationResult.error.errors);
    }

    const { email, password, firstName, lastName } = validationResult.data;

    // Check if user already exists (this would be done by Supabase automatically)
    const result = await authService.signUp({
      email,
      password,
      firstName,
      lastName,
      metadata: {
        acceptedTermsAt: new Date().toISOString(),
        registrationSource: 'web'
      }
    });

    if (!result.success) {
      if (result.code === 'SIGNUP_FAILED' && result.error?.includes('already registered')) {
        throw new APIError('An account with this email already exists', 409);
      }
      throw new APIError(result.error || 'Registration failed', 400);
    }

    // Return success response (don't include sensitive session data in response)
    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: result.data!.user.id,
        email: result.data!.user.email,
        emailVerified: result.data!.user.email_verified || false
      },
      requiresEmailVerification: !result.data!.user.email_verified
    }, { status: 201 });

  } catch (error) {
    if (error instanceof ValidationError || error instanceof APIError) {
      throw error;
    }
    
    console.error('Registration error:', error);
    throw new APIError('Registration failed. Please try again.', 500);
  }
}

// Apply middleware
export const POST = publicApiMiddleware(registerHandler);