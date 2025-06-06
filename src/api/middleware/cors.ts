import { NextRequest, NextResponse } from 'next/server';

interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

const defaultOptions: CorsOptions = {
  origin: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: [
    'X-Requested-With',
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
  ],
  exposedHeaders: [],
  credentials: false,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

function isOriginAllowed(origin: string | null, allowedOrigin: string | string[] | boolean): boolean {
  if (!origin) return false;
  
  if (allowedOrigin === true) return true;
  if (allowedOrigin === false) return false;
  
  if (typeof allowedOrigin === 'string') {
    return origin === allowedOrigin;
  }
  
  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.includes(origin);
  }
  
  return false;
}

export function createCorsMiddleware(options: CorsOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return (request: NextRequest): NextResponse => {
    const origin = request.headers.get('origin');
    const method = request.method;

    // Handle preflight requests
    if (method === 'OPTIONS') {
      const response = new NextResponse(null, {
        status: config.optionsSuccessStatus,
      });

      // Set CORS headers for preflight
      if (config.origin && isOriginAllowed(origin, config.origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
      }

      if (config.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }

      if (config.methods) {
        response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '));
      }

      if (config.allowedHeaders) {
        response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
      }

      if (config.maxAge !== undefined) {
        response.headers.set('Access-Control-Max-Age', config.maxAge.toString());
      }

      return response;
    }

    // For non-preflight requests, return null to continue processing
    return NextResponse.next();
  };
}

export function addCorsHeaders(response: NextResponse, options: CorsOptions = {}): NextResponse {
  const config = { ...defaultOptions, ...options };

  // Get origin from the original request (would need to be passed in real implementation)
  const origin = response.headers.get('origin');

  if (config.origin && isOriginAllowed(origin, config.origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
  }

  if (config.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (config.exposedHeaders && config.exposedHeaders.length > 0) {
    response.headers.set('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
  }

  return response;
}

// Predefined CORS configurations
export const publicCors = createCorsMiddleware({
  origin: true,
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});

export const restrictedCors = createCorsMiddleware({
  origin: [
    'https://autolensai.com',
    'https://www.autolensai.com',
    'https://app.autolensai.com',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : []),
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});

export const apiCors = createCorsMiddleware({
  origin: true,
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'X-Requested-With',
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-API-Key',
    'X-Client-Version',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
  ],
});

// Helper function to apply CORS to API routes
export function withCors(
  corsMiddleware: (request: NextRequest) => NextResponse,
  handler: (request: NextRequest) => Promise<NextResponse>,
  corsOptions: CorsOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight requests
    const corsResponse = corsMiddleware(request);
    if (corsResponse.status === 204 || corsResponse.status === 200) {
      return corsResponse;
    }

    // Execute the main handler
    const response = await handler(request);

    // Add CORS headers to the response
    return addCorsHeaders(response, corsOptions);
  };
}