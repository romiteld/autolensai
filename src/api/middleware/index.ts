import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, withRateLimit } from './rate-limit';
import { createCorsMiddleware, withCors } from './cors';
import { createValidationMiddleware, withValidation } from './validation';
import { createLoggingMiddleware, withLogging } from './logging';
import { createErrorHandler, withErrorHandler } from './error-handler';

// Re-export all middleware components
export * from './rate-limit';
export * from './cors';
export * from './validation';
export * from './logging';
export * from './error-handler';

// Re-export authentication components
export * from '@/core/auth';
export { AuthGuard, withAuth, withOptionalAuth, requireAuth, requireRole, requirePermission, checkOwnership } from '@/core/auth/guards/auth.guard';

// Create withRequiredAuth wrapper for protected API routes
export function withRequiredAuth<T = any>(
  handler: (request: NextRequest, context: import('@/core/auth/guards/auth.guard').AuthContext) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const { context, response } = await AuthGuard.validateAuth(request, { required: true });
    
    if (response) {
      return response as NextResponse<T>;
    }

    return handler(request, context);
  };
}

interface MiddlewareOptions {
  rateLimit?: Parameters<typeof createRateLimiter>[0];
  cors?: Parameters<typeof createCorsMiddleware>[0];
  validation?: Parameters<typeof createValidationMiddleware>[0];
  logging?: Parameters<typeof createLoggingMiddleware>[0];
  errorHandler?: Parameters<typeof createErrorHandler>[0];
  enableMetrics?: boolean;
}

type MiddlewareHandler = (request: NextRequest) => Promise<NextResponse>;

// Middleware composer that applies all middleware in the correct order
export function createApiMiddleware(
  handler: MiddlewareHandler,
  options: MiddlewareOptions = {}
): MiddlewareHandler {
  let composedHandler = handler;

  // Apply middleware in reverse order (last applied executes first)
  
  // 1. Error handling (outermost layer)
  if (options.errorHandler !== false) {
    const errorHandler = createErrorHandler(options.errorHandler || {});
    composedHandler = withErrorHandler(errorHandler, composedHandler);
  }

  // 2. Logging
  if (options.logging !== false) {
    const loggingMiddleware = createLoggingMiddleware(options.logging || {});
    composedHandler = withLogging(loggingMiddleware, composedHandler);
  }

  // 3. CORS
  if (options.cors !== false) {
    const corsMiddleware = createCorsMiddleware(options.cors || {});
    composedHandler = withCors(corsMiddleware, composedHandler, options.cors || {});
  }

  // 4. Rate limiting
  if (options.rateLimit) {
    const rateLimitMiddleware = createRateLimiter(options.rateLimit);
    composedHandler = withRateLimit(rateLimitMiddleware, composedHandler);
  }

  // 5. Validation (innermost layer before handler)
  if (options.validation) {
    const validationMiddleware = createValidationMiddleware(options.validation);
    composedHandler = withValidation(validationMiddleware, composedHandler);
  }

  return composedHandler;
}

// Predefined middleware configurations for common use cases

// Public API endpoints (GET requests, public data)
export const publicApiMiddleware = (handler: MiddlewareHandler) =>
  createApiMiddleware(handler, {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000,
    },
    cors: {
      origin: true,
      credentials: false,
      methods: ['GET', 'HEAD', 'OPTIONS'],
    },
    logging: {
      logLevel: 'info',
      includeHeaders: false,
      includeBody: false,
    },
    errorHandler: {
      includeStack: false,
      logErrors: true,
    },
  });

// Protected API endpoints (require authentication)
export const protectedApiMiddleware = (handler: MiddlewareHandler) =>
  createApiMiddleware(handler, {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 500,
    },
    cors: {
      origin: [
        'https://autolensai.com',
        'https://www.autolensai.com',
        'https://app.autolensai.com',
        ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    },
    logging: {
      logLevel: 'info',
      includeHeaders: true,
      includeBody: true,
      maxBodySize: 1024,
    },
    errorHandler: {
      includeStack: process.env.NODE_ENV === 'development',
      logErrors: true,
    },
  });

// Admin API endpoints (enhanced security)
export const adminApiMiddleware = (handler: MiddlewareHandler) =>
  createApiMiddleware(handler, {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
    cors: {
      origin: [
        'https://admin.autolensai.com',
        ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    },
    logging: {
      logLevel: 'info',
      includeHeaders: true,
      includeBody: true,
      maxBodySize: 2048,
    },
    errorHandler: {
      includeStack: false,
      logErrors: true,
    },
  });

// File upload endpoints
export const uploadApiMiddleware = (handler: MiddlewareHandler) =>
  createApiMiddleware(handler, {
    rateLimit: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 50,
      message: 'Upload rate limit exceeded, please try again later',
    },
    cors: {
      origin: true,
      credentials: true,
      methods: ['POST', 'OPTIONS'],
    },
    logging: {
      logLevel: 'info',
      includeHeaders: true,
      includeBody: false, // Don't log file content
    },
    errorHandler: {
      includeStack: false,
      logErrors: true,
    },
  });

// Webhook endpoints
export const webhookApiMiddleware = (handler: MiddlewareHandler) =>
  createApiMiddleware(handler, {
    cors: {
      origin: false, // Webhooks typically don't need CORS
      methods: ['POST', 'OPTIONS'],
    },
    logging: {
      logLevel: 'info',
      includeHeaders: true,
      includeBody: true,
      maxBodySize: 4096,
    },
    errorHandler: {
      includeStack: false,
      logErrors: true,
    },
  });

// Health check and monitoring endpoints
export const healthCheckMiddleware = (handler: MiddlewareHandler) =>
  createApiMiddleware(handler, {
    cors: {
      origin: true,
      methods: ['GET', 'HEAD', 'OPTIONS'],
    },
    logging: {
      logLevel: 'debug',
      includeHeaders: false,
      includeBody: false,
    },
    errorHandler: {
      includeStack: false,
      logErrors: false,
    },
  });

// Development middleware (more verbose logging and debugging)
export const developmentApiMiddleware = (handler: MiddlewareHandler) =>
  createApiMiddleware(handler, {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 10000, // Very lenient for development
    },
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    },
    logging: {
      logLevel: 'debug',
      includeHeaders: true,
      includeBody: true,
      includeResponse: true,
      maxBodySize: 4096,
    },
    errorHandler: {
      includeStack: true,
      logErrors: true,
    },
  });

// Helper function to create route-specific middleware
export function createRouteMiddleware(
  path: string,
  method: string,
  options: MiddlewareOptions = {}
) {
  return (handler: MiddlewareHandler) =>
    createApiMiddleware(handler, {
      ...options,
      logging: {
        ...options.logging,
        // Add route context to logs
      },
    });
}

// Type-safe wrapper for Next.js API routes
export function withMiddleware<T = any>(
  middleware: (handler: MiddlewareHandler) => MiddlewareHandler
) {
  return function (handler: (request: NextRequest) => Promise<NextResponse<T>>) {
    return middleware(handler);
  };
}

// Global error boundary for unhandled errors
export function globalErrorHandler(error: Error, request: NextRequest): NextResponse {
  console.error('Unhandled API error:', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}