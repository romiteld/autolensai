import { createSupabaseClient, createSupabaseAdmin } from '@/core/database/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/common/types/database.types';

export interface AuthUser {
  id: string;
  email: string | undefined;
  email_verified?: boolean;
  phone?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: AuthUser;
}

export class SupabaseAuthProvider {
  private supabase = createSupabaseClient();
  private adminClient = createSupabaseAdmin();

  // User authentication methods
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  async getSession(): Promise<AuthSession | null> {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    
    if (error) {
      throw new Error(`Failed to get session: ${error.message}`);
    }

    return session;
  }

  async getUser(): Promise<AuthUser | null> {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    
    if (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return user;
  }

  async refreshSession() {
    const { data, error } = await this.supabase.auth.refreshSession();
    
    if (error) {
      throw new Error(`Failed to refresh session: ${error.message}`);
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  async updatePassword(password: string) {
    const { error } = await this.supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw new Error(`Password update failed: ${error.message}`);
    }
  }

  async updateUser(updates: { email?: string; phone?: string; data?: Record<string, any> }) {
    const { error } = await this.supabase.auth.updateUser(updates);

    if (error) {
      throw new Error(`User update failed: ${error.message}`);
    }
  }

  // Admin methods (server-side only)
  async getUserById(id: string): Promise<AuthUser | null> {
    const { data: { user }, error } = await this.adminClient.auth.admin.getUserById(id);
    
    if (error) {
      throw new Error(`Failed to get user by ID: ${error.message}`);
    }

    return user;
  }

  async deleteUser(id: string) {
    const { error } = await this.adminClient.auth.admin.deleteUser(id);
    
    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async listUsers(page = 1, perPage = 10) {
    const { data, error } = await this.adminClient.auth.admin.listUsers({
      page,
      perPage,
    });
    
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    return data;
  }

  async banUser(id: string, duration?: string) {
    const { error } = await this.adminClient.auth.admin.updateUserById(id, {
      ban_duration: duration || 'permanent',
    });
    
    if (error) {
      throw new Error(`Failed to ban user: ${error.message}`);
    }
  }

  async unbanUser(id: string) {
    const { error } = await this.adminClient.auth.admin.updateUserById(id, {
      ban_duration: 'none',
    });
    
    if (error) {
      throw new Error(`Failed to unban user: ${error.message}`);
    }
  }

  // Event listeners
  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  // OAuth providers
  async signInWithProvider(provider: 'google' | 'github' | 'facebook') {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(`OAuth sign in failed: ${error.message}`);
    }

    return data;
  }

  // Magic link authentication
  async signInWithMagicLink(email: string) {
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(`Magic link sign in failed: ${error.message}`);
    }
  }

  // Phone authentication
  async signInWithPhone(phone: string) {
    const { error } = await this.supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      throw new Error(`Phone sign in failed: ${error.message}`);
    }
  }

  async verifyOtp(token: string, type: 'signup' | 'recovery' | 'invite' | 'phone' = 'signup') {
    const { data, error } = await this.supabase.auth.verifyOtp({
      token,
      type,
    });

    if (error) {
      throw new Error(`OTP verification failed: ${error.message}`);
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  // Session management
  async invalidateAllSessions(userId: string) {
    const { error } = await this.adminClient.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...((await this.getUserById(userId))?.app_metadata || {}),
        session_invalidated_at: new Date().toISOString(),
      },
    });

    if (error) {
      throw new Error(`Failed to invalidate sessions: ${error.message}`);
    }
  }

  // Check if user has specific role
  async hasRole(userId: string, role: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      const roles = user?.app_metadata?.roles || [];
      return Array.isArray(roles) ? roles.includes(role) : false;
    } catch (error) {
      return false;
    }
  }

  // Assign role to user
  async assignRole(userId: string, role: string) {
    const user = await this.getUserById(userId);
    const currentRoles = user?.app_metadata?.roles || [];
    const newRoles = Array.isArray(currentRoles) 
      ? [...new Set([...currentRoles, role])]
      : [role];

    const { error } = await this.adminClient.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...user?.app_metadata,
        roles: newRoles,
      },
    });

    if (error) {
      throw new Error(`Failed to assign role: ${error.message}`);
    }
  }

  // Remove role from user
  async removeRole(userId: string, role: string) {
    const user = await this.getUserById(userId);
    const currentRoles = user?.app_metadata?.roles || [];
    const newRoles = Array.isArray(currentRoles) 
      ? currentRoles.filter(r => r !== role)
      : [];

    const { error } = await this.adminClient.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...user?.app_metadata,
        roles: newRoles,
      },
    });

    if (error) {
      throw new Error(`Failed to remove role: ${error.message}`);
    }
  }
}

// Singleton instance
export const authProvider = new SupabaseAuthProvider();