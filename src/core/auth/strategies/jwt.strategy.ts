import { NextRequest } from 'next/server';
import { createSupabaseClient } from '@/core/database/supabase';

export interface JWTPayload {
  sub: string; // Subject (user ID)
  email: string;
  aud: string; // Audience
  iss: string; // Issuer
  iat: number; // Issued at
  exp: number; // Expires at
  role?: string;
  session_id?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
}

export class JWTStrategy {
  private supabase = createSupabaseClient();

  /**
   * Extract JWT token from request headers
   */
  extractTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return null;
    }

    const [scheme, token] = authHeader.split(' ');
    
    if (scheme.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }

  /**
   * Validate JWT token using Supabase
   */
  async validateToken(token: string): Promise<JWTPayload | null> {
    try {
      // Use Supabase to verify the token
      const { data: { user }, error } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        console.error('JWT validation error:', error);
        return null;
      }

      // Convert Supabase user to our JWT payload format
      const payload: JWTPayload = {
        sub: user.id,
        email: user.email || '',
        aud: user.aud || 'authenticated',
        iss: 'supabase',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
        role: user.role,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
      };

      return payload;
    } catch (error) {
      console.error('JWT validation error:', error);
      return null;
    }
  }

  /**
   * Validate request and extract user information
   */
  async validateRequest(request: NextRequest): Promise<{
    valid: boolean;
    user: JWTPayload | null;
    error?: string;
  }> {
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      return {
        valid: false,
        user: null,
        error: 'No authentication token provided'
      };
    }

    const user = await this.validateToken(token);

    if (!user) {
      return {
        valid: false,
        user: null,
        error: 'Invalid or expired token'
      };
    }

    // Check if token is expired
    if (user.exp && user.exp < Math.floor(Date.now() / 1000)) {
      return {
        valid: false,
        user: null,
        error: 'Token has expired'
      };
    }

    return {
      valid: true,
      user
    };
  }

  /**
   * Extract user ID from request
   */
  async extractUserId(request: NextRequest): Promise<string | null> {
    const validation = await this.validateRequest(request);
    return validation.valid ? validation.user!.sub : null;
  }

  /**
   * Check if user has specific role
   */
  async hasRole(request: NextRequest, role: string): Promise<boolean> {
    const validation = await this.validateRequest(request);
    
    if (!validation.valid || !validation.user) {
      return false;
    }

    const userRoles = validation.user.app_metadata?.roles || [];
    return Array.isArray(userRoles) ? userRoles.includes(role) : false;
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(request: NextRequest, permission: string): Promise<boolean> {
    const validation = await this.validateRequest(request);
    
    if (!validation.valid || !validation.user) {
      return false;
    }

    const userPermissions = validation.user.app_metadata?.permissions || [];
    return Array.isArray(userPermissions) ? userPermissions.includes(permission) : false;
  }

  /**
   * Get user session information
   */
  async getSessionInfo(request: NextRequest): Promise<{
    user: JWTPayload | null;
    sessionId: string | null;
    isValid: boolean;
  }> {
    const validation = await this.validateRequest(request);
    
    return {
      user: validation.user,
      sessionId: validation.user?.session_id || null,
      isValid: validation.valid
    };
  }

  /**
   * Refresh token if needed
   */
  async refreshTokenIfNeeded(request: NextRequest): Promise<{
    needsRefresh: boolean;
    newToken?: string;
    error?: string;
  }> {
    const validation = await this.validateRequest(request);

    if (!validation.valid) {
      return {
        needsRefresh: false,
        error: validation.error
      };
    }

    const user = validation.user!;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = user.exp - now;

    // Refresh if token expires in the next 5 minutes (300 seconds)
    if (timeUntilExpiry < 300) {
      try {
        const { data, error } = await this.supabase.auth.refreshSession();
        
        if (error || !data.session) {
          return {
            needsRefresh: true,
            error: 'Failed to refresh token'
          };
        }

        return {
          needsRefresh: true,
          newToken: data.session.access_token
        };
      } catch (error) {
        return {
          needsRefresh: true,
          error: 'Token refresh failed'
        };
      }
    }

    return {
      needsRefresh: false
    };
  }

  /**
   * Create JWT middleware for automatic token validation
   */
  createMiddleware(options: {
    required?: boolean;
    roles?: string[];
    permissions?: string[];
  } = {}) {
    return async (request: NextRequest): Promise<{
      valid: boolean;
      user: JWTPayload | null;
      error?: string;
    }> => {
      const { required = true, roles = [], permissions = [] } = options;

      const validation = await this.validateRequest(request);

      // If authentication is required but validation failed
      if (required && !validation.valid) {
        return validation;
      }

      // If authentication succeeded, check additional requirements
      if (validation.valid && validation.user) {
        // Check role requirements
        if (roles.length > 0) {
          const userRoles = validation.user.app_metadata?.roles || [];
          const hasRequiredRole = roles.some(role => 
            Array.isArray(userRoles) ? userRoles.includes(role) : false
          );

          if (!hasRequiredRole) {
            return {
              valid: false,
              user: null,
              error: `Required role not found. User has: ${userRoles.join(', ')}, required: ${roles.join(', ')}`
            };
          }
        }

        // Check permission requirements
        if (permissions.length > 0) {
          const userPermissions = validation.user.app_metadata?.permissions || [];
          const hasRequiredPermission = permissions.some(permission => 
            Array.isArray(userPermissions) ? userPermissions.includes(permission) : false
          );

          if (!hasRequiredPermission) {
            return {
              valid: false,
              user: null,
              error: `Required permission not found. User has: ${userPermissions.join(', ')}, required: ${permissions.join(', ')}`
            };
          }
        }
      }

      return validation;
    };
  }

  /**
   * Create a secure context object for authenticated requests
   */
  async createSecureContext(request: NextRequest) {
    const validation = await this.validateRequest(request);
    const refreshInfo = await this.refreshTokenIfNeeded(request);

    return {
      isAuthenticated: validation.valid,
      user: validation.user,
      error: validation.error,
      tokenNeedsRefresh: refreshInfo.needsRefresh,
      newToken: refreshInfo.newToken,
      refreshError: refreshInfo.error,
      roles: validation.user?.app_metadata?.roles || [],
      permissions: validation.user?.app_metadata?.permissions || [],
      userId: validation.user?.sub,
      email: validation.user?.email,
      hasRole: (role: string) => {
        const roles = validation.user?.app_metadata?.roles || [];
        return Array.isArray(roles) ? roles.includes(role) : false;
      },
      hasPermission: (permission: string) => {
        const permissions = validation.user?.app_metadata?.permissions || [];
        return Array.isArray(permissions) ? permissions.includes(permission) : false;
      }
    };
  }
}

// Export singleton instance
export const jwtStrategy = new JWTStrategy();