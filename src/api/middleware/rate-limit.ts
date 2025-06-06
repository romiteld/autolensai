import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for development. In production, use Redis or similar
const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export function createRateLimiter(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const {
      windowMs,
      maxRequests,
      message = 'Too many requests, please try again later',
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
    } = config;

    // Generate key based on IP and user agent for better uniqueness
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const key = `${ip}:${userAgent}`;

    const now = Date.now();
    const resetTime = now + windowMs;

    // Initialize or update store entry
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime,
      };
    } else {
      store[key].count += 1;
    }

    const { count } = store[key];

    // Check if rate limit exceeded
    if (count > maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': store[key].resetTime.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    // Return null to continue processing, and add rate limit headers
    return null;
  };
}

// Predefined rate limiters for different use cases
export const strictRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
});

export const moderateRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 500, // 500 requests per 15 minutes
});

export const lenientRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 requests per 15 minutes
});

export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
});

export const uploadRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50, // 50 uploads per hour
  message: 'Upload rate limit exceeded, please try again later',
});

// Helper function to apply rate limiting to API routes
export function withRateLimit(
  rateLimiter: (request: NextRequest) => Promise<NextResponse | null>,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await rateLimiter(request);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(request);
  };
}

// Middleware to add rate limit headers to successful responses
export function addRateLimitHeaders(
  response: NextResponse,
  config: RateLimitConfig,
  key: string
): NextResponse {
  const storeEntry = store[key];
  
  if (storeEntry) {
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, config.maxRequests - storeEntry.count).toString());
    response.headers.set('X-RateLimit-Reset', storeEntry.resetTime.toString());
  }

  return response;
}