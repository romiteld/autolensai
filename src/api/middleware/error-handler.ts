import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  requestId?: string;
  details?: any;
  stack?: string;
}

interface ErrorHandlerOptions {
  includeStack?: boolean;
  logErrors?: boolean;
  customErrorMap?: Map<string, (error: any) => ErrorResponse>;
}

export class APIError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends APIError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

const defaultOptions: ErrorHandlerOptions = {
  includeStack: process.env.NODE_ENV === 'development',
  logErrors: true,
  customErrorMap: new Map(),
};

function formatZodError(error: z.ZodError): ErrorResponse {
  const details = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return {
    error: 'Validation Error',
    message: 'The request contains invalid data',
    statusCode: 400,
    timestamp: new Date().toISOString(),
    path: '',
    details,
  };
}

function formatDatabaseError(error: any): ErrorResponse {
  // Handle common database errors
  if (error.code === '23505') { // Unique constraint violation
    return {
      error: 'Conflict',
      message: 'A resource with this information already exists',
      statusCode: 409,
      timestamp: new Date().toISOString(),
      path: '',
      details: { constraint: error.constraint },
    };
  }

  if (error.code === '23503') { // Foreign key violation
    return {
      error: 'Bad Request',
      message: 'Referenced resource does not exist',
      statusCode: 400,
      timestamp: new Date().toISOString(),
      path: '',
      details: { constraint: error.constraint },
    };
  }

  if (error.code === '23502') { // Not null violation
    return {
      error: 'Bad Request',
      message: 'Required field is missing',
      statusCode: 400,
      timestamp: new Date().toISOString(),
      path: '',
      details: { column: error.column },
    };
  }

  // Generic database error
  return {
    error: 'Database Error',
    message: 'A database error occurred',
    statusCode: 500,
    timestamp: new Date().toISOString(),
    path: '',
    details: process.env.NODE_ENV === 'development' ? { code: error.code } : undefined,
  };
}

function formatNetworkError(error: any): ErrorResponse {
  if (error.code === 'ECONNREFUSED') {
    return {
      error: 'Service Unavailable',
      message: 'Unable to connect to external service',
      statusCode: 503,
      timestamp: new Date().toISOString(),
      path: '',
    };
  }

  if (error.code === 'ETIMEDOUT') {
    return {
      error: 'Gateway Timeout',
      message: 'External service request timed out',
      statusCode: 504,
      timestamp: new Date().toISOString(),
      path: '',
    };
  }

  return {
    error: 'External Service Error',
    message: 'An error occurred while communicating with external service',
    statusCode: 502,
    timestamp: new Date().toISOString(),
    path: '',
  };
}

export function createErrorHandler(options: ErrorHandlerOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return async (
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      const requestId = request.headers.get('x-request-id');
      const path = new URL(request.url).pathname;

      let errorResponse: ErrorResponse;

      // Handle different types of errors
      if (error instanceof APIError) {
        errorResponse = {
          error: error.name.replace('Error', ''),
          message: error.message,
          statusCode: error.statusCode,
          timestamp: new Date().toISOString(),
          path,
          requestId: requestId || undefined,
          details: error.details,
          stack: config.includeStack ? error.stack : undefined,
        };
      } else if (error instanceof z.ZodError) {
        errorResponse = formatZodError(error);
        errorResponse.path = path;
        errorResponse.requestId = requestId || undefined;
      } else if (error && typeof error === 'object' && 'code' in error) {
        // Database or network errors
        if (typeof error.code === 'string') {
          if (error.code.startsWith('23') || error.code.startsWith('42')) {
            errorResponse = formatDatabaseError(error);
          } else if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'].includes(error.code)) {
            errorResponse = formatNetworkError(error);
          } else {
            errorResponse = {
              error: 'Internal Server Error',
              message: 'An unexpected error occurred',
              statusCode: 500,
              timestamp: new Date().toISOString(),
              path,
              requestId: requestId || undefined,
              stack: config.includeStack && error instanceof Error ? error.stack : undefined,
            };
          }
        } else {
          errorResponse = {
            error: 'Internal Server Error',
            message: 'An unexpected error occurred',
            statusCode: 500,
            timestamp: new Date().toISOString(),
            path,
            requestId: requestId || undefined,
            stack: config.includeStack && error instanceof Error ? error.stack : undefined,
          };
        }
      } else {
        // Generic error
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        errorResponse = {
          error: 'Internal Server Error',
          message,
          statusCode: 500,
          timestamp: new Date().toISOString(),
          path,
          requestId: requestId || undefined,
          stack: config.includeStack && error instanceof Error ? error.stack : undefined,
        };
      }

      // Log the error if enabled
      if (config.logErrors) {
        const logLevel = errorResponse.statusCode >= 500 ? 'error' : 'warn';
        console[logLevel](`API Error [${requestId}]:`, {
          ...errorResponse,
          originalError: error,
        });
      }

      return NextResponse.json(errorResponse, {
        status: errorResponse.statusCode,
        headers: {
          'Content-Type': 'application/json',
          ...(requestId && { 'X-Request-ID': requestId }),
        },
      });
    }
  };
}

// Predefined error handlers
export const productionErrorHandler = createErrorHandler({
  includeStack: false,
  logErrors: true,
});

export const developmentErrorHandler = createErrorHandler({
  includeStack: true,
  logErrors: true,
});

// Helper function to apply error handling to API routes
export function withErrorHandler(
  errorHandler: (
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ) => Promise<NextResponse>,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    return errorHandler(request, handler);
  };
}

// Utility functions for throwing common errors
export const throwIfNotFound = (resource: any, message?: string): void => {
  if (!resource) {
    throw new NotFoundError(message);
  }
};

export const throwIfUnauthorized = (condition: boolean, message?: string): void => {
  if (!condition) {
    throw new AuthorizationError(message);
  }
};

export const throwIfUnauthenticated = (user: any, message?: string): void => {
  if (!user) {
    throw new AuthenticationError(message);
  }
};

export const throwValidationError = (message: string, details?: any): never => {
  throw new ValidationError(message, details);
};

// Error boundary for React components (if needed)
export class ErrorBoundary {
  static createApiErrorResponse(error: unknown, request: NextRequest): NextResponse {
    const errorHandler = process.env.NODE_ENV === 'production' 
      ? productionErrorHandler 
      : developmentErrorHandler;

    // This is a synchronous version for use in catch blocks
    const requestId = request.headers.get('x-request-id');
    const path = new URL(request.url).pathname;

    if (error instanceof APIError) {
      return NextResponse.json({
        error: error.name.replace('Error', ''),
        message: error.message,
        statusCode: error.statusCode,
        timestamp: new Date().toISOString(),
        path,
        requestId: requestId || undefined,
        details: error.details,
      }, { status: error.statusCode });
    }

    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path,
      requestId: requestId || undefined,
    }, { status: 500 });
  }
}