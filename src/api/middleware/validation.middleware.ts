import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';
import { createSupabaseClient } from '@/core/database/supabase';

export interface ValidationOptions {
  body?: ZodSchema<any>;
  query?: ZodSchema<any>;
  params?: ZodSchema<any>;
  headers?: ZodSchema<any>;
}

export function withValidation(schemas: ValidationOptions) {
  return function validationMiddleware(
    handler: (request: NextRequest, validated: any) => Promise<NextResponse> | NextResponse
  ) {
    return async function (request: NextRequest): Promise<NextResponse> {
      try {
        const validated: any = {};

        // Validate request body
        if (schemas.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            const body = await request.json();
            validated.body = schemas.body.parse(body);
          } catch (parseError) {
            return NextResponse.json(
              { 
                error: 'Invalid JSON in request body',
                details: parseError instanceof Error ? parseError.message : 'JSON parse error'
              },
              { status: 400 }
            );
          }
        }

        // Validate query parameters
        if (schemas.query) {
          const { searchParams } = new URL(request.url);
          const query: Record<string, any> = {};
          
          searchParams.forEach((value, key) => {
            // Try to parse numbers and booleans
            if (value === 'true') query[key] = true;
            else if (value === 'false') query[key] = false;
            else if (!isNaN(Number(value)) && value !== '') query[key] = Number(value);
            else query[key] = value;
          });

          validated.query = schemas.query.parse(query);
        }

        // Validate URL parameters (would need to be extracted from the route)
        if (schemas.params) {
          // This would typically be handled by the Next.js router
          // For now, we'll skip this validation
        }

        // Validate headers
        if (schemas.headers) {
          const headers: Record<string, string> = {};
          request.headers.forEach((value, key) => {
            headers[key.toLowerCase()] = value;
          });
          validated.headers = schemas.headers.parse(headers);
        }

        // Execute the handler with validated data
        return await handler(request, validated);

      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              details: error.errors.map(err => ({
                path: err.path.join('.'),
                message: err.message,
                code: err.code,
              })),
            },
            { status: 400 }
          );
        }

        console.error('Validation middleware error:', error);
        return NextResponse.json(
          { error: 'Internal validation error' },
          { status: 500 }
        );
      }
    };
  };
}

// Authentication validation
export function withAuth(required: boolean = true) {
  return function authMiddleware(
    handler: (request: NextRequest, user?: any) => Promise<NextResponse> | NextResponse
  ) {
    return async function (request: NextRequest): Promise<NextResponse> {
      try {
        const supabase = createSupabaseClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (required && (error || !user)) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        return await handler(request, user);

      } catch (error) {
        console.error('Auth middleware error:', error);
        return NextResponse.json(
          { error: 'Authentication error' },
          { status: 401 }
        );
      }
    };
  };
}

// Subscription validation
export function withSubscription(planRequired?: string) {
  return function subscriptionMiddleware(
    handler: (request: NextRequest, user: any, subscription?: any) => Promise<NextResponse> | NextResponse
  ) {
    return withAuth(true)(async function (request: NextRequest, user: any): Promise<NextResponse> {
      try {
        const supabase = createSupabaseClient();
        
        // Get user's active subscription
        const { data: subscription, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Subscription check error:', error);
          return NextResponse.json(
            { error: 'Failed to check subscription status' },
            { status: 500 }
          );
        }

        if (!subscription) {
          return NextResponse.json(
            { 
              error: 'Active subscription required',
              requiresSubscription: true,
            },
            { status: 403 }
          );
        }

        // Check specific plan if required
        if (planRequired && subscription.plan_name !== planRequired) {
          return NextResponse.json(
            {
              error: `${planRequired} plan required`,
              currentPlan: subscription.plan_name,
              requiredPlan: planRequired,
            },
            { status: 403 }
          );
        }

        return await handler(request, user, subscription);

      } catch (error) {
        console.error('Subscription middleware error:', error);
        return NextResponse.json(
          { error: 'Subscription validation error' },
          { status: 500 }
        );
      }
    });
  };
}

// Usage tracking middleware
export function withUsageTracking(featureType: string, costCredits: number = 1) {
  return function usageTrackingMiddleware(
    handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse
  ) {
    return async function (request: NextRequest, ...args: any[]): Promise<NextResponse> {
      const response = await handler(request, ...args);

      // Only track usage on successful requests
      if (response.status >= 200 && response.status < 300) {
        try {
          const supabase = createSupabaseClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            await supabase
              .from('usage_tracking')
              .insert({
                user_id: user.id,
                feature_type: featureType,
                credits_used: costCredits,
                request_path: new URL(request.url).pathname,
                request_method: request.method,
              });
          }
        } catch (error) {
          console.error('Usage tracking error:', error);
          // Don't fail the request if usage tracking fails
        }
      }

      return response;
    };
  };
}

// Request logging middleware
export function withLogging(level: 'basic' | 'detailed' = 'basic') {
  return function loggingMiddleware(
    handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse
  ) {
    return async function (request: NextRequest, ...args: any[]): Promise<NextResponse> {
      const startTime = Date.now();
      const { pathname } = new URL(request.url);

      if (level === 'detailed') {
        console.log(`[${new Date().toISOString()}] ${request.method} ${pathname} - Started`);
      }

      try {
        const response = await handler(request, ...args);
        const duration = Date.now() - startTime;

        console.log(
          `[${new Date().toISOString()}] ${request.method} ${pathname} - ${response.status} (${duration}ms)`
        );

        if (level === 'detailed' && response.status >= 400) {
          const responseText = await response.clone().text();
          console.log(`Response body: ${responseText}`);
        }

        return response;

      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(
          `[${new Date().toISOString()}] ${request.method} ${pathname} - ERROR (${duration}ms)`,
          error
        );
        throw error;
      }
    };
  };
}

// Combine multiple middlewares
export function withMiddlewares(...middlewares: Array<(handler: any) => any>) {
  return function (handler: any) {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}