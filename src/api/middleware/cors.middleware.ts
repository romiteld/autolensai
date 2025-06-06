import { NextRequest, NextResponse } from 'next/server';

export interface CORSOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const defaultOptions: CORSOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'User-Agent',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

export function withCORS(options: CORSOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return function corsMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
  ) {
    return async function (request: NextRequest): Promise<NextResponse> {
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: getCORSHeaders(request, config),
        });
      }

      // Execute the handler
      const response = await handler(request);

      // Add CORS headers to the response
      const corsHeaders = getCORSHeaders(request, config);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    };
  };
}

function getCORSHeaders(request: NextRequest, options: CORSOptions): Record<string, string> {
  const headers: Record<string, string> = {};
  const origin = request.headers.get('origin');

  // Handle origin
  if (options.origin === true) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
  } else if (typeof options.origin === 'string') {
    headers['Access-Control-Allow-Origin'] = options.origin;
  } else if (Array.isArray(options.origin)) {
    if (origin && options.origin.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    }
  } else if (options.origin === false) {
    // Don't set Access-Control-Allow-Origin header
  }

  // Handle methods
  if (options.methods) {
    headers['Access-Control-Allow-Methods'] = options.methods.join(', ');
  }

  // Handle allowed headers
  if (options.allowedHeaders) {
    headers['Access-Control-Allow-Headers'] = options.allowedHeaders.join(', ');
  }

  // Handle credentials
  if (options.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  // Handle max age
  if (options.maxAge) {
    headers['Access-Control-Max-Age'] = options.maxAge.toString();
  }

  return headers;
}

// Preset configurations for common scenarios
export const apiCORS = withCORS({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.NEXT_PUBLIC_APP_URL!] 
    : true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
});

export const publicCORS = withCORS({
  origin: true,
  methods: ['GET', 'POST'],
  credentials: false,
});

export const webhookCORS = withCORS({
  origin: false,
  methods: ['POST'],
  credentials: false,
});