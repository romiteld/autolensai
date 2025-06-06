import { authProvider, type AuthUser, type AuthSession } from '@/core/auth';
import { createSupabaseAdmin } from '@/core/database/supabase';

export interface SignUpRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  metadata?: Record<string, any>;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  metadata?: Record<string, any>;
}

export interface AuthServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export class AuthService {
  private adminClient = createSupabaseAdmin();

  async signUp(request: SignUpRequest): Promise<AuthServiceResponse<{ user: AuthUser; session: AuthSession }>> {
    try {
      const { email, password, firstName, lastName, metadata } = request;
      
      const userMetadata = {
        firstName,
        lastName,
        ...metadata,
      };

      const result = await authProvider.signUp(email, password, userMetadata);
      
      if (!result.user || !result.session) {
        return {
          success: false,
          error: 'Failed to create user account',
          code: 'SIGNUP_FAILED'
        };
      }

      // Set default role for new users
      if (result.user.id) {
        await this.assignRole(result.user.id, 'user');
      }

      return {
        success: true,
        data: {
          user: result.user,
          session: result.session
        }
      };
    } catch (error) {
      console.error('SignUp error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
        code: 'SIGNUP_ERROR'
      };
    }
  }

  async signIn(request: SignInRequest): Promise<AuthServiceResponse<{ user: AuthUser; session: AuthSession }>> {
    try {
      const { email, password } = request;
      
      const result = await authProvider.signIn(email, password);
      
      if (!result.user || !result.session) {
        return {
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        };
      }

      return {
        success: true,
        data: {
          user: result.user,
          session: result.session
        }
      };
    } catch (error) {
      console.error('SignIn error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
        code: 'SIGNIN_ERROR'
      };
    }
  }

  async signOut(): Promise<AuthServiceResponse> {
    try {
      await authProvider.signOut();
      
      return {
        success: true
      };
    } catch (error) {
      console.error('SignOut error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
        code: 'SIGNOUT_ERROR'
      };
    }
  }

  async getCurrentUser(): Promise<AuthServiceResponse<AuthUser>> {
    try {
      const user = await authProvider.getUser();
      
      if (!user) {
        return {
          success: false,
          error: 'No authenticated user',
          code: 'NO_USER'
        };
      }

      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('GetCurrentUser error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user',
        code: 'GET_USER_ERROR'
      };
    }
  }

  async updateUser(userId: string, updates: UpdateUserRequest): Promise<AuthServiceResponse<AuthUser>> {
    try {
      const { email, phone, firstName, lastName, metadata } = updates;
      
      const updateData: any = {};
      
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      
      if (firstName || lastName || metadata) {
        updateData.data = {};
        if (firstName) updateData.data.firstName = firstName;
        if (lastName) updateData.data.lastName = lastName;
        if (metadata) updateData.data = { ...updateData.data, ...metadata };
      }

      await authProvider.updateUser(updateData);
      
      // Get updated user
      const updatedUser = await authProvider.getUserById(userId);
      
      if (!updatedUser) {
        return {
          success: false,
          error: 'Failed to retrieve updated user',
          code: 'UPDATE_FAILED'
        };
      }

      return {
        success: true,
        data: updatedUser
      };
    } catch (error) {
      console.error('UpdateUser error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
        code: 'UPDATE_ERROR'
      };
    }
  }

  async resetPassword(email: string): Promise<AuthServiceResponse> {
    try {
      await authProvider.resetPassword(email);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('ResetPassword error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send reset email',
        code: 'RESET_ERROR'
      };
    }
  }

  async updatePassword(newPassword: string): Promise<AuthServiceResponse> {
    try {
      await authProvider.updatePassword(newPassword);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('UpdatePassword error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update password',
        code: 'PASSWORD_UPDATE_ERROR'
      };
    }
  }

  // Admin methods
  async getUserById(userId: string): Promise<AuthServiceResponse<AuthUser>> {
    try {
      const user = await authProvider.getUserById(userId);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        };
      }

      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('GetUserById error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user',
        code: 'GET_USER_ERROR'
      };
    }
  }

  async listUsers(page = 1, perPage = 10): Promise<AuthServiceResponse<{ users: AuthUser[]; total: number }>> {
    try {
      const result = await authProvider.listUsers(page, perPage);
      
      return {
        success: true,
        data: {
          users: result.users || [],
          total: result.total || 0
        }
      };
    } catch (error) {
      console.error('ListUsers error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list users',
        code: 'LIST_USERS_ERROR'
      };
    }
  }

  async deleteUser(userId: string): Promise<AuthServiceResponse> {
    try {
      await authProvider.deleteUser(userId);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('DeleteUser error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user',
        code: 'DELETE_USER_ERROR'
      };
    }
  }

  async assignRole(userId: string, role: string): Promise<AuthServiceResponse> {
    try {
      await authProvider.assignRole(userId, role);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('AssignRole error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign role',
        code: 'ASSIGN_ROLE_ERROR'
      };
    }
  }

  async removeRole(userId: string, role: string): Promise<AuthServiceResponse> {
    try {
      await authProvider.removeRole(userId, role);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('RemoveRole error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove role',
        code: 'REMOVE_ROLE_ERROR'
      };
    }
  }

  async hasRole(userId: string, role: string): Promise<AuthServiceResponse<boolean>> {
    try {
      const hasRole = await authProvider.hasRole(userId, role);
      
      return {
        success: true,
        data: hasRole
      };
    } catch (error) {
      console.error('HasRole error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check role',
        code: 'CHECK_ROLE_ERROR'
      };
    }
  }

  async banUser(userId: string, duration?: string): Promise<AuthServiceResponse> {
    try {
      await authProvider.banUser(userId, duration);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('BanUser error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to ban user',
        code: 'BAN_USER_ERROR'
      };
    }
  }

  async unbanUser(userId: string): Promise<AuthServiceResponse> {
    try {
      await authProvider.unbanUser(userId);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('UnbanUser error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unban user',
        code: 'UNBAN_USER_ERROR'
      };
    }
  }

  // OAuth methods
  async signInWithProvider(provider: 'google' | 'github' | 'facebook'): Promise<AuthServiceResponse<{ url: string }>> {
    try {
      const result = await authProvider.signInWithProvider(provider);
      
      return {
        success: true,
        data: {
          url: result.url || ''
        }
      };
    } catch (error) {
      console.error('SignInWithProvider error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth sign in failed',
        code: 'OAUTH_ERROR'
      };
    }
  }

  async verifyOtp(token: string, type: 'signup' | 'recovery' | 'invite' | 'phone' = 'signup'): Promise<AuthServiceResponse<{ user: AuthUser; session: AuthSession }>> {
    try {
      const result = await authProvider.verifyOtp(token, type);
      
      if (!result.user || !result.session) {
        return {
          success: false,
          error: 'OTP verification failed',
          code: 'OTP_VERIFICATION_FAILED'
        };
      }

      return {
        success: true,
        data: {
          user: result.user,
          session: result.session
        }
      };
    } catch (error) {
      console.error('VerifyOtp error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OTP verification failed',
        code: 'OTP_ERROR'
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();