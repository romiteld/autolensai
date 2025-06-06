import { NextRequest, NextResponse } from 'next/server';
import { authProvider } from '../providers/supabase.provider';
import { createSupabaseClient } from '@/core/database/supabase';

export interface AuthGuardOptions {
  required?: boolean;
  roles?: string[];
  permissions?: string[];
  redirectTo?: string;
}

export interface AuthContext {
  user: any | null;
  session: any | null;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

export class AuthGuard {
  static async validateAuth(
    request: NextRequest,
    options: AuthGuardOptions = {}
  ): Promise<{ context: AuthContext; response?: NextResponse }> {
    const {
      required = true,
      roles = [],
      permissions = [],
      redirectTo = '/auth/login'
    } = options;

    try {
      const supabase = createSupabaseClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (sessionError || userError) {
        console.error('Auth validation error:', sessionError || userError);
      }

      const isAuthenticated = !!(session && user);
      
      // Create auth context
      const context: AuthContext = {
        user,
        session,
        isAuthenticated,
        hasRole: (role: string) => {
          if (!user?.app_metadata?.roles) return false;
          return user.app_metadata.roles.includes(role);
        },
        hasPermission: (permission: string) => {
          if (!user?.app_metadata?.permissions) return false;
          return user.app_metadata.permissions.includes(permission);
        }
      };

      // Check authentication requirement
      if (required && !isAuthenticated) {
        return {
          context,
          response: NextResponse.json(
            { 
              error: 'Authentication required',
              code: 'UNAUTHENTICATED',
              redirectTo
            },
            { status: 401 }
          )
        };
      }

      // Check role requirements
      if (isAuthenticated && roles.length > 0) {
        const hasRequiredRole = roles.some(role => context.hasRole(role));
        if (!hasRequiredRole) {
          return {
            context,
            response: NextResponse.json(
              {
                error: 'Insufficient role permissions',
                code: 'INSUFFICIENT_ROLE',
                required_roles: roles,
                user_roles: user?.app_metadata?.roles || []
              },
              { status: 403 }
            )
          };
        }
      }

      // Check permission requirements
      if (isAuthenticated && permissions.length > 0) {
        const hasRequiredPermission = permissions.some(permission => 
          context.hasPermission(permission)
        );
        if (!hasRequiredPermission) {
          return {
            context,
            response: NextResponse.json(
              {
                error: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS',
                required_permissions: permissions,
                user_permissions: user?.app_metadata?.permissions || []
              },
              { status: 403 }
            )
          };
        }
      }

      return { context };
    } catch (error) {
      console.error('Auth guard error:', error);
      return {
        context: {
          user: null,
          session: null,
          isAuthenticated: false,
          hasRole: () => false,
          hasPermission: () => false
        },
        response: NextResponse.json(
          { 
            error: 'Authentication service error',
            code: 'AUTH_SERVICE_ERROR'
          },
          { status: 500 }
        )
      };
    }
  }

  static async requireAuth(request: NextRequest): Promise<{ user: any; session: any } | NextResponse> {
    const { context, response } = await this.validateAuth(request, { required: true });
    
    if (response) {
      return response;
    }

    return {
      user: context.user!,
      session: context.session!
    };
  }

  static async requireRole(request: NextRequest, roles: string[]): Promise<{ user: any; session: any } | NextResponse> {
    const { context, response } = await this.validateAuth(request, { 
      required: true, 
      roles 
    });
    
    if (response) {
      return response;
    }

    return {
      user: context.user!,
      session: context.session!
    };
  }

  static async requirePermission(request: NextRequest, permissions: string[]): Promise<{ user: any; session: any } | NextResponse> {
    const { context, response } = await this.validateAuth(request, { 
      required: true, 
      permissions 
    });
    
    if (response) {
      return response;
    }

    return {
      user: context.user!,
      session: context.session!
    };
  }

  static async optionalAuth(request: NextRequest): Promise<AuthContext> {
    const { context } = await this.validateAuth(request, { required: false });
    return context;
  }

  // Middleware wrapper for protecting routes
  static protect(options: AuthGuardOptions = {}) {
    return (handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) => {
      return async (request: NextRequest): Promise<NextResponse> => {
        const { context, response } = await this.validateAuth(request, options);
        
        if (response) {
          return response;
        }

        return handler(request, context);
      };
    };
  }

  // Admin only protection
  static adminOnly(handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) {
    return this.protect({ 
      required: true, 
      roles: ['admin', 'super_admin'] 
    })(handler);
  }

  // User or admin protection  
  static userOrAdmin(handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) {
    return this.protect({ 
      required: true, 
      roles: ['user', 'admin', 'super_admin'] 
    })(handler);
  }

  // Premium subscription protection
  static premiumOnly(handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) {
    return this.protect({ 
      required: true, 
      permissions: ['premium_features'] 
    })(handler);
  }

  // Enterprise subscription protection
  static enterpriseOnly(handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) {
    return this.protect({ 
      required: true, 
      permissions: ['enterprise_features'] 
    })(handler);
  }

  // Check if user owns resource
  static async checkResourceOwnership(
    request: NextRequest,
    resourceUserId: string,
    allowAdmin = true
  ): Promise<boolean | NextResponse> {
    const { context, response } = await this.validateAuth(request, { required: true });
    
    if (response) {
      return response;
    }

    const isOwner = context.user!.id === resourceUserId;
    const isAdmin = allowAdmin && context.hasRole('admin');

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          error: 'Resource access denied',
          code: 'RESOURCE_ACCESS_DENIED',
          message: 'You can only access your own resources'
        },
        { status: 403 }
      );
    }

    return true;
  }

  // Check subscription status
  static async checkSubscription(
    request: NextRequest,
    requiredPlan?: string
  ): Promise<{ user: any; subscription: any } | NextResponse> {
    const { context, response } = await this.validateAuth(request, { required: true });
    
    if (response) {
      return response;
    }

    // This would typically check the user's subscription in the database
    // For now, we'll just return the user
    return {
      user: context.user!,
      subscription: null // TODO: Implement subscription check
    };
  }

  // Rate limiting based on user type
  static getRateLimitConfig(user: any): { windowMs: number; maxRequests: number } {
    if (!user) {
      return { windowMs: 15 * 60 * 1000, maxRequests: 100 }; // Anonymous users
    }

    const roles = user.app_metadata?.roles || [];
    
    if (roles.includes('enterprise')) {
      return { windowMs: 15 * 60 * 1000, maxRequests: 10000 };
    }
    
    if (roles.includes('premium')) {
      return { windowMs: 15 * 60 * 1000, maxRequests: 2000 };
    }
    
    if (roles.includes('basic')) {
      return { windowMs: 15 * 60 * 1000, maxRequests: 500 };
    }

    // Default authenticated user
    return { windowMs: 15 * 60 * 1000, maxRequests: 200 };
  }
}

// Helper functions for common auth patterns
export const withAuth = AuthGuard.protect();
export const withOptionalAuth = (handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    const context = await AuthGuard.optionalAuth(request);
    return handler(request, context);
  };
};

export const requireAuth = AuthGuard.requireAuth;
export const requireRole = AuthGuard.requireRole;
export const requirePermission = AuthGuard.requirePermission;
export const checkOwnership = AuthGuard.checkResourceOwnership;