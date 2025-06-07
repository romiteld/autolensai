import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard, AuthContext } from '../guards/auth.guard';

/**
 * Authentication decorators for API routes
 * These decorators provide a clean way to add authentication requirements to route handlers
 */

export type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse>;

export type HandlerWithAuth = (request: NextRequest) => Promise<NextResponse>;

/**
 * Requires authentication for the route
 */
export function RequireAuth(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (request: NextRequest) {
    const { context, response } = await AuthGuard.validateAuth(request, { required: true });
    
    if (response) {
      return response;
    }

    return originalMethod.call(this, request, context);
  };

  return descriptor;
}

/**
 * Requires specific roles for the route
 */
export function RequireRoles(roles: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (request: NextRequest) {
      const { context, response } = await AuthGuard.validateAuth(request, { 
        required: true, 
        roles 
      });
      
      if (response) {
        return response;
      }

      return originalMethod.call(this, request, context);
    };

    return descriptor;
  };
}

/**
 * Requires specific permissions for the route
 */
export function RequirePermissions(permissions: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (request: NextRequest) {
      const { context, response } = await AuthGuard.validateAuth(request, { 
        required: true, 
        permissions 
      });
      
      if (response) {
        return response;
      }

      return originalMethod.call(this, request, context);
    };

    return descriptor;
  };
}

/**
 * Requires admin role for the route
 */
export function RequireAdmin(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (request: NextRequest) {
    const { context, response } = await AuthGuard.validateAuth(request, { 
      required: true, 
      roles: ['admin', 'super_admin'] 
    });
    
    if (response) {
      return response;
    }

    return originalMethod.call(this, request, context);
  };

  return descriptor;
}

/**
 * Makes authentication optional for the route
 */
export function OptionalAuth(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (request: NextRequest) {
    const context = await AuthGuard.optionalAuth(request);
    return originalMethod.call(this, request, context);
  };

  return descriptor;
}

/**
 * Requires premium subscription for the route
 */
export function RequirePremium(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (request: NextRequest) {
    const { context, response } = await AuthGuard.validateAuth(request, { 
      required: true, 
      permissions: ['premium_features'] 
    });
    
    if (response) {
      return response;
    }

    return originalMethod.call(this, request, context);
  };

  return descriptor;
}

/**
 * Requires enterprise subscription for the route
 */
export function RequireEnterprise(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (request: NextRequest) {
    const { context, response } = await AuthGuard.validateAuth(request, { 
      required: true, 
      permissions: ['enterprise_features'] 
    });
    
    if (response) {
      return response;
    }

    return originalMethod.call(this, request, context);
  };

  return descriptor;
}

/**
 * Function-based decorators for use with regular function handlers
 */

export function withRequiredAuth(handler: AuthenticatedHandler): HandlerWithAuth {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { context, response } = await AuthGuard.validateAuth(request, { required: true });
    
    if (response) {
      return response;
    }

    return handler(request, context);
  };
}

export function withRequiredRoles(roles: string[]) {
  return function (handler: AuthenticatedHandler): HandlerWithAuth {
    return async (request: NextRequest): Promise<NextResponse> => {
      const { context, response } = await AuthGuard.validateAuth(request, { 
        required: true, 
        roles 
      });
      
      if (response) {
        return response;
      }

      return handler(request, context);
    };
  };
}

export function withRequiredPermissions(permissions: string[]) {
  return function (handler: AuthenticatedHandler): HandlerWithAuth {
    return async (request: NextRequest): Promise<NextResponse> => {
      const { context, response } = await AuthGuard.validateAuth(request, { 
        required: true, 
        permissions 
      });
      
      if (response) {
        return response;
      }

      return handler(request, context);
    };
  };
}

export function withOptionalAuthDecorator(handler: AuthenticatedHandler): HandlerWithAuth {
  return async (request: NextRequest): Promise<NextResponse> => {
    const context = await AuthGuard.optionalAuth(request);
    return handler(request, context);
  };
}

export function withAdminRequired(handler: AuthenticatedHandler): HandlerWithAuth {
  return withRequiredRoles(['admin', 'super_admin'])(handler);
}

export function withPremiumRequired(handler: AuthenticatedHandler): HandlerWithAuth {
  return withRequiredPermissions(['premium_features'])(handler);
}

export function withEnterpriseRequired(handler: AuthenticatedHandler): HandlerWithAuth {
  return withRequiredPermissions(['enterprise_features'])(handler);
}

/**
 * Resource ownership validation decorator
 */
export function RequireOwnership(getResourceUserId: (request: NextRequest) => Promise<string>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (request: NextRequest) {
      // First check authentication
      const { context, response } = await AuthGuard.validateAuth(request, { required: true });
      
      if (response) {
        return response;
      }

      // Get resource user ID
      const resourceUserId = await getResourceUserId(request);
      
      // Check ownership
      const ownershipResult = await AuthGuard.checkResourceOwnership(
        request, 
        resourceUserId, 
        true // Allow admin access
      );

      if (ownershipResult instanceof NextResponse) {
        return ownershipResult;
      }

      return originalMethod.call(this, request, context);
    };

    return descriptor;
  };
}

export function withOwnershipRequired(
  getResourceUserId: (request: NextRequest) => Promise<string>
) {
  return function (handler: AuthenticatedHandler): HandlerWithAuth {
    return async (request: NextRequest): Promise<NextResponse> => {
      // First check authentication
      const { context, response } = await AuthGuard.validateAuth(request, { required: true });
      
      if (response) {
        return response;
      }

      // Get resource user ID
      const resourceUserId = await getResourceUserId(request);
      
      // Check ownership
      const ownershipResult = await AuthGuard.checkResourceOwnership(
        request, 
        resourceUserId, 
        true // Allow admin access
      );

      if (ownershipResult instanceof NextResponse) {
        return ownershipResult;
      }

      return handler(request, context);
    };
  };
}

/**
 * Subscription validation decorator
 */
export function RequireSubscription(planName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (request: NextRequest) {
      const subscriptionResult = await AuthGuard.checkSubscription(request, planName);

      if (subscriptionResult instanceof NextResponse) {
        return subscriptionResult;
      }

      const context = await AuthGuard.optionalAuth(request);
      return originalMethod.call(this, request, context);
    };

    return descriptor;
  };
}

export function withSubscriptionRequired(planName?: string) {
  return function (handler: AuthenticatedHandler): HandlerWithAuth {
    return async (request: NextRequest): Promise<NextResponse> => {
      const subscriptionResult = await AuthGuard.checkSubscription(request, planName);

      if (subscriptionResult instanceof NextResponse) {
        return subscriptionResult;
      }

      const context = await AuthGuard.optionalAuth(request);
      return handler(request, context);
    };
  };
}