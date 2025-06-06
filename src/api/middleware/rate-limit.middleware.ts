import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/core/database/supabase';

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  headers?: boolean;
}

const defaultOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyGenerator: (request) => getClientIP(request),
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  message: 'Too many requests, please try again later.',
  headers: true,
};

// In-memory store for development/simple setups
const store = new Map<string, { count: number; resetTime: number }>();

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddress = request.headers.get('x-remote-address');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddress || 'unknown';
}

export function withRateLimit(options: Partial<RateLimitOptions> = {}) {
  const config = { ...defaultOptions, ...options };

  return function rateLimitMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
  ) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const key = config.keyGenerator!(request);
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Clean up old entries
      cleanupStore(windowStart);

      // Get or create rate limit info
      let rateLimitInfo = store.get(key);
      if (!rateLimitInfo || rateLimitInfo.resetTime <= now) {
        rateLimitInfo = {
          count: 0,
          resetTime: now + config.windowMs,
        };
      }

      // Check if limit exceeded
      if (rateLimitInfo.count >= config.maxRequests) {
        const response = NextResponse.json(
          { error: config.message },
          { status: 429 }
        );

        if (config.headers) {
          response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
          response.headers.set('X-RateLimit-Remaining', '0');
          response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitInfo.resetTime / 1000).toString());
          response.headers.set('Retry-After', Math.ceil((rateLimitInfo.resetTime - now) / 1000).toString());
        }

        return response;
      }

      // Execute the handler
      const response = await handler(request);

      // Update count based on response status
      const shouldCount = (
        (!config.skipSuccessfulRequests || response.status >= 400) &&
        (!config.skipFailedRequests || response.status < 400)
      );

      if (shouldCount) {
        rateLimitInfo.count++;
        store.set(key, rateLimitInfo);
      }

      // Add rate limit headers
      if (config.headers) {
        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', Math.max(0, config.maxRequests - rateLimitInfo.count).toString());
        response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitInfo.resetTime / 1000).toString());
      }

      return response;
    };
  };
}

function cleanupStore(windowStart: number) {
  for (const [key, info] of store.entries()) {
    if (info.resetTime <= windowStart) {
      store.delete(key);
    }
  }
}

// Enhanced rate limiting with user-based limits
export function withUserRateLimit(options: Partial<RateLimitOptions> = {}) {
  const config = { ...defaultOptions, ...options };

  return function userRateLimitMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
  ) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Use user ID if authenticated, otherwise fall back to IP
      const key = user?.id || `ip:${getClientIP(request)}`;
      
      // Authenticated users get higher limits
      const userLimits = user 
        ? { ...config, maxRequests: config.maxRequests * 2 }
        : config;

      const now = Date.now();
      const windowStart = now - userLimits.windowMs;

      cleanupStore(windowStart);

      let rateLimitInfo = store.get(key);
      if (!rateLimitInfo || rateLimitInfo.resetTime <= now) {
        rateLimitInfo = {
          count: 0,
          resetTime: now + userLimits.windowMs,
        };
      }

      if (rateLimitInfo.count >= userLimits.maxRequests) {
        const response = NextResponse.json(
          { 
            error: config.message,
            authenticated: !!user,
            limit: userLimits.maxRequests,
          },
          { status: 429 }
        );

        if (config.headers) {
          response.headers.set('X-RateLimit-Limit', userLimits.maxRequests.toString());
          response.headers.set('X-RateLimit-Remaining', '0');
          response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitInfo.resetTime / 1000).toString());
        }

        return response;
      }

      const response = await handler(request);

      const shouldCount = (
        (!config.skipSuccessfulRequests || response.status >= 400) &&
        (!config.skipFailedRequests || response.status < 400)
      );

      if (shouldCount) {
        rateLimitInfo.count++;
        store.set(key, rateLimitInfo);
      }

      if (config.headers) {
        response.headers.set('X-RateLimit-Limit', userLimits.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', Math.max(0, userLimits.maxRequests - rateLimitInfo.count).toString());
        response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitInfo.resetTime / 1000).toString());
      }

      return response;
    };
  };
}

// Preset configurations
export const apiRateLimit = withUserRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 200 for authenticated users
  message: 'Too many API requests, please try again later.',
});

export const strictRateLimit = withRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10,
  message: 'Rate limit exceeded. Please wait before trying again.',
});

export const uploadRateLimit = withUserRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50, // 100 for authenticated users
  message: 'Upload rate limit exceeded. Please try again later.',
});

export const paymentRateLimit = withUserRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 20 for authenticated users
  message: 'Payment rate limit exceeded. Please try again later.',
});