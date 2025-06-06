import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  publicApiMiddleware,
  ValidationError,
  APIError 
} from '@/api/middleware';
import { authService } from '@/core/services';

// Validation schema for password reset request
const resetRequestSchema = z.object({
  email: z.string().email('Invalid email format')
});

// Validation schema for password reset confirmation
const resetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
});

// POST /api/auth/reset-password - Request password reset
async function resetPasswordHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Check if this is a reset request or confirmation
    if (body.token) {
      // This is a password reset confirmation
      const validationResult = resetConfirmSchema.safeParse(body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid reset confirmation data', validationResult.error.errors);
      }

      const { token, password } = validationResult.data;

      // Verify the token and update password
      const verifyResult = await authService.verifyOtp(token, 'recovery');
      
      if (!verifyResult.success) {
        throw new APIError('Invalid or expired reset token', 400);
      }

      // Update the password
      const updateResult = await authService.updatePassword(password);
      
      if (!updateResult.success) {
        throw new APIError('Failed to update password', 500);
      }

      return NextResponse.json({
        message: 'Password updated successfully. You can now log in with your new password.',
        success: true
      });

    } else {
      // This is a password reset request
      const validationResult = resetRequestSchema.safeParse(body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid reset request data', validationResult.error.errors);
      }

      const { email } = validationResult.data;

      const result = await authService.resetPassword(email);

      if (!result.success) {
        // Don't reveal whether the email exists or not for security
        console.error('Password reset error:', result.error);
      }

      // Always return success message regardless of whether email exists
      return NextResponse.json({
        message: 'If an account with that email exists, we have sent you a password reset link.',
        success: true
      });
    }

  } catch (error) {
    if (error instanceof ValidationError || error instanceof APIError) {
      throw error;
    }
    
    console.error('Password reset error:', error);
    throw new APIError('Password reset failed. Please try again.', 500);
  }
}

// Apply middleware with rate limiting for password reset
export const POST = publicApiMiddleware(resetPasswordHandler);