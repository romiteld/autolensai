import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface ValidationOptions {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  headers?: z.ZodSchema;
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class RequestValidationError extends Error {
  public errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Request validation failed');
    this.name = 'RequestValidationError';
    this.errors = errors;
  }
}

function formatZodErrors(error: z.ZodError): ValidationError[] {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

export function createValidationMiddleware(schemas: ValidationOptions) {
  return async (request: NextRequest): Promise<{ validated: any } | NextResponse> => {
    const validated: any = {};
    const errors: ValidationError[] = [];

    try {
      // Validate query parameters
      if (schemas.query) {
        const url = new URL(request.url);
        const queryObject = Object.fromEntries(url.searchParams.entries());
        
        try {
          validated.query = schemas.query.parse(queryObject);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(...formatZodErrors(error));
          }
        }
      }

      // Validate request body (for POST, PUT, PATCH requests)
      if (schemas.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.json();
          validated.body = schemas.body.parse(body);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(...formatZodErrors(error));
          } else {
            errors.push({
              field: 'body',
              message: 'Invalid JSON format',
              code: 'invalid_json',
            });
          }
        }
      }

      // Validate headers
      if (schemas.headers) {
        const headersObject = Object.fromEntries(request.headers.entries());
        
        try {
          validated.headers = schemas.headers.parse(headersObject);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(...formatZodErrors(error));
          }
        }
      }

      // If there are validation errors, return error response
      if (errors.length > 0) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            message: 'The request contains invalid data',
            details: errors,
          },
          { status: 400 }
        );
      }

      return { validated };
    } catch (error) {
      console.error('Validation middleware error:', error);
      return NextResponse.json(
        {
          error: 'Internal validation error',
          message: 'An error occurred while validating the request',
        },
        { status: 500 }
      );
    }
  };
}

// Common validation schemas
export const commonSchemas = {
  pagination: z.object({
    page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).optional(),
    limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).optional(),
    offset: z.string().transform(val => parseInt(val)).pipe(z.number().min(0)).optional(),
  }),

  search: z.object({
    q: z.string().min(1).optional(),
    sort: z.enum(['asc', 'desc']).optional(),
    sortBy: z.string().optional(),
  }),

  id: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  authHeaders: z.object({
    authorization: z.string().startsWith('Bearer '),
  }),

  contentType: z.object({
    'content-type': z.string().includes('application/json'),
  }),

  userAgent: z.object({
    'user-agent': z.string().min(1),
  }),
};

// Helper function to apply validation to API routes
export function withValidation(
  validationMiddleware: (request: NextRequest) => Promise<{ validated: any } | NextResponse>,
  handler: (request: NextRequest, validated: any) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = await validationMiddleware(request);
    
    if (result instanceof NextResponse) {
      return result; // Validation failed, return error response
    }

    return handler(request, result.validated);
  };
}

// Predefined validation middlewares
export const validatePagination = createValidationMiddleware({
  query: commonSchemas.pagination,
});

export const validateSearch = createValidationMiddleware({
  query: commonSchemas.search.merge(commonSchemas.pagination),
});

export const validateId = createValidationMiddleware({
  params: commonSchemas.id,
});

export const validateAuthHeaders = createValidationMiddleware({
  headers: commonSchemas.authHeaders,
});

// Content-Type validation for JSON APIs
export const validateJsonContent = createValidationMiddleware({
  headers: commonSchemas.contentType,
});

// Vehicle-specific validations
export const vehicleValidation = {
  create: createValidationMiddleware({
    body: z.object({
      make: z.string().min(2, 'Make must be at least 2 characters'),
      model: z.string().min(2, 'Model must be at least 2 characters'),
      year: z.number().min(1900).max(new Date().getFullYear() + 1),
      mileage: z.number().min(0).optional(),
      price: z.number().min(0).optional(),
      description: z.string().optional(),
      condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
      location: z.string().optional(),
      zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid zip code').optional(),
      vin: z.string().length(17, 'VIN must be 17 characters').optional(),
      transmission: z.enum(['automatic', 'manual', 'cvt']).optional(),
      fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']).optional(),
      exteriorColor: z.string().optional(),
      interiorColor: z.string().optional(),
    }),
  }),

  update: createValidationMiddleware({
    body: z.object({
      make: z.string().min(2).optional(),
      model: z.string().min(2).optional(),
      year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
      mileage: z.number().min(0).optional(),
      price: z.number().min(0).optional(),
      description: z.string().optional(),
      condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
      location: z.string().optional(),
      zipCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
      vin: z.string().length(17).optional(),
      transmission: z.enum(['automatic', 'manual', 'cvt']).optional(),
      fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']).optional(),
      exteriorColor: z.string().optional(),
      interiorColor: z.string().optional(),
      status: z.enum(['active', 'pending', 'sold', 'archived']).optional(),
    }),
    params: commonSchemas.id,
  }),

  search: createValidationMiddleware({
    query: z.object({
      make: z.string().optional(),
      model: z.string().optional(),
      year: z.string().transform(val => parseInt(val)).pipe(z.number()).optional(),
      minPrice: z.string().transform(val => parseInt(val)).pipe(z.number()).optional(),
      maxPrice: z.string().transform(val => parseInt(val)).pipe(z.number()).optional(),
      condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
      fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']).optional(),
      transmission: z.enum(['automatic', 'manual', 'cvt']).optional(),
      location: z.string().optional(),
      zipCode: z.string().optional(),
      radius: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(500)).optional(),
    }).merge(commonSchemas.pagination),
  }),
};