import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  createApiMiddleware,
  withRequiredAuth,
  withValidation,
  createValidationMiddleware,
  AuthContext,
  ValidationError,
  APIError
} from '@/api/middleware';

// Validation schema for the request
const requestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(18, 'Must be at least 18 years old').optional(),
  preferences: z.object({
    notifications: z.boolean().default(true),
    theme: z.enum(['light', 'dark']).default('light')
  }).optional()
});

const querySchema = z.object({
  page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).optional(),
  sort: z.enum(['asc', 'desc']).optional()
});

// Create validation middleware
const validateRequest = createValidationMiddleware({
  body: requestSchema,
  query: querySchema
});

// GET /api/example/protected - Example protected route with full middleware stack
async function getProtectedHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const sort = searchParams.get('sort') || 'asc';

  // Mock data response
  const data = {
    message: 'This is a protected endpoint',
    user: {
      id: context.user!.id,
      email: context.user!.email,
      roles: context.user!.app_metadata?.roles || []
    },
    pagination: {
      page,
      limit,
      sort
    },
    timestamp: new Date().toISOString(),
    requestInfo: {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    }
  };

  return NextResponse.json(data, {
    headers: {
      'X-Custom-Header': 'protected-endpoint',
      'X-User-ID': context.user!.id
    }
  });
}

// POST /api/example/protected - Example protected route with validation
async function postProtectedHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  try {
    // Validation is handled by middleware, so we can access the validated data
    const body = await request.json();
    
    // Additional business logic validation
    if (body.email === context.user!.email && body.name.length < 2) {
      throw new ValidationError('Name must be at least 2 characters for your own profile');
    }

    // Mock processing
    const result = {
      message: 'Data processed successfully',
      processedData: {
        ...body,
        userId: context.user!.id,
        processedAt: new Date().toISOString()
      },
      user: {
        id: context.user!.id,
        email: context.user!.email
      }
    };

    return NextResponse.json(result, { 
      status: 201,
      headers: {
        'X-Processing-Time': Date.now().toString(),
        'X-User-ID': context.user!.id
      }
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new APIError('Failed to process data', 500);
  }
}

// PUT /api/example/protected - Example with role-based access
async function putProtectedHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  // Check if user has admin role
  if (!context.hasRole('admin')) {
    throw new APIError('Admin role required for this operation', 403);
  }

  try {
    const body = await request.json();
    
    const result = {
      message: 'Admin operation completed',
      operation: 'update',
      data: body,
      performedBy: {
        id: context.user!.id,
        email: context.user!.email,
        roles: context.user!.app_metadata?.roles || []
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(result);

  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to perform admin operation', 500);
  }
}

// Apply different middleware configurations to each route

// GET - Basic protected route with query validation
export const GET = createApiMiddleware(
  withRequiredAuth(async (request: NextRequest, context: AuthContext) => {
    // Apply query validation
    const validationResult = await createValidationMiddleware({ query: querySchema })(request);
    if (validationResult instanceof NextResponse) {
      return validationResult;
    }
    return getProtectedHandler(request, context);
  }),
  {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET'],
    },
    logging: {
      logLevel: 'info',
      includeHeaders: true,
      includeBody: false,
    }
  }
);

// POST - Protected route with full validation
export const POST = createApiMiddleware(
  withRequiredAuth(async (request: NextRequest, context: AuthContext) => {
    // Apply body validation
    const validationResult = await createValidationMiddleware({ body: requestSchema })(request);
    if (validationResult instanceof NextResponse) {
      return validationResult;
    }
    return postProtectedHandler(request, context);
  }),
  {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 50, // More restrictive for POST
    },
    cors: {
      origin: [
        'https://autolensai.com',
        'https://app.autolensai.com',
        ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
      ],
      credentials: true,
      methods: ['POST'],
    },
    logging: {
      logLevel: 'info',
      includeHeaders: true,
      includeBody: true,
      maxBodySize: 2048,
    }
  }
);

// PUT - Admin only route with strict rate limiting
export const PUT = createApiMiddleware(
  withRequiredAuth(putProtectedHandler),
  {
    rateLimit: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // Very restrictive for admin operations
      message: 'Admin operation rate limit exceeded',
    },
    cors: {
      origin: [
        'https://admin.autolensai.com',
        ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
      ],
      credentials: true,
      methods: ['PUT'],
    },
    logging: {
      logLevel: 'warn', // Log admin operations at warn level
      includeHeaders: true,
      includeBody: true,
      includeResponse: true,
      maxBodySize: 4096,
    }
  }
);