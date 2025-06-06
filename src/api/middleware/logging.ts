import { NextRequest, NextResponse } from 'next/server';

interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  userAgent: string;
  ip: string;
  duration: number;
  status: number;
  contentLength?: number;
  userId?: string;
  requestId: string;
  error?: string;
}

interface LoggingOptions {
  includeHeaders?: boolean;
  includeBody?: boolean;
  includeResponse?: boolean;
  maxBodySize?: number;
  sensitiveHeaders?: string[];
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

const defaultOptions: LoggingOptions = {
  includeHeaders: false,
  includeBody: false,
  includeResponse: false,
  maxBodySize: 1024, // 1KB
  sensitiveHeaders: [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token',
  ],
  logLevel: 'info',
};

// Generate unique request ID
function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Get client IP address
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  const remoteAddr = request.headers.get('remote-addr');
  if (remoteAddr) {
    return remoteAddr;
  }
  
  return 'unknown';
}

// Filter sensitive headers
function filterHeaders(headers: Headers, sensitiveHeaders: string[]): Record<string, string> {
  const filtered: Record<string, string> = {};
  
  headers.forEach((value, key) => {
    if (!sensitiveHeaders.includes(key.toLowerCase())) {
      filtered[key] = value;
    } else {
      filtered[key] = '[REDACTED]';
    }
  });
  
  return filtered;
}

// Structured logging functions
const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  
  error: (message: string, data?: any) => {
    console.error(`[ERROR] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
};

export function createLoggingMiddleware(options: LoggingOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return async (
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    // Add request ID to headers for tracking
    const requestWithId = new NextRequest(request.url, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'x-request-id': requestId,
      },
      body: request.body,
    });

    const logData: Partial<LogEntry> = {
      requestId,
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: getClientIp(request),
    };

    // Log request headers if enabled
    if (config.includeHeaders) {
      const headers = filterHeaders(request.headers, config.sensitiveHeaders || []);
      logger.debug(`Request headers for ${requestId}`, headers);
    }

    // Log request body if enabled and applicable
    if (config.includeBody && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = await request.text();
        if (body.length <= (config.maxBodySize || 1024)) {
          logger.debug(`Request body for ${requestId}`, { body });
        } else {
          logger.debug(`Request body for ${requestId} (truncated)`, {
            body: body.substring(0, config.maxBodySize || 1024) + '...',
            actualSize: body.length,
          });
        }
      } catch (error) {
        logger.warn(`Failed to read request body for ${requestId}`, { error });
      }
    }

    let response: NextResponse;
    let error: string | undefined;

    try {
      // Execute the handler
      response = await handler(requestWithId);
      
      // Add request ID to response headers
      response.headers.set('x-request-id', requestId);
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Request ${requestId} failed`, { error: err });
      
      // Create error response
      response = NextResponse.json(
        { 
          error: 'Internal server error',
          requestId,
        },
        { status: 500 }
      );
      response.headers.set('x-request-id', requestId);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Complete log entry
    const completeLogData: LogEntry = {
      ...logData as LogEntry,
      duration,
      status: response.status,
      contentLength: parseInt(response.headers.get('content-length') || '0') || undefined,
      error,
    };

    // Log the completed request
    const logLevel = response.status >= 500 ? 'error' : response.status >= 400 ? 'warn' : 'info';
    const message = `${request.method} ${request.url} - ${response.status} (${duration}ms)`;
    
    logger[logLevel](message, completeLogData);

    // Log response headers if enabled
    if (config.includeResponse && config.includeHeaders) {
      const responseHeaders = Object.fromEntries(response.headers.entries());
      logger.debug(`Response headers for ${requestId}`, responseHeaders);
    }

    // Performance monitoring
    if (duration > 5000) { // Log slow requests (>5s)
      logger.warn(`Slow request detected: ${requestId}`, {
        duration,
        url: request.url,
        method: request.method,
      });
    }

    return response;
  };
}

// Predefined logging configurations
export const productionLogging = createLoggingMiddleware({
  includeHeaders: false,
  includeBody: false,
  includeResponse: false,
  logLevel: 'info',
});

export const developmentLogging = createLoggingMiddleware({
  includeHeaders: true,
  includeBody: true,
  includeResponse: true,
  maxBodySize: 2048,
  logLevel: 'debug',
});

export const securityLogging = createLoggingMiddleware({
  includeHeaders: true,
  includeBody: false,
  includeResponse: false,
  logLevel: 'warn',
  sensitiveHeaders: [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token',
    'x-session-id',
  ],
});

// Helper function to apply logging to API routes
export function withLogging(
  loggingMiddleware: (
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ) => Promise<NextResponse>,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    return loggingMiddleware(request, handler);
  };
}

// Metrics collection (in a real app, this would send to monitoring service)
export class MetricsCollector {
  private static metrics: Map<string, number> = new Map();

  static increment(metric: string): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + 1);
  }

  static timing(metric: string, duration: number): void {
    const key = `${metric}_total_time`;
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + duration);
    
    const countKey = `${metric}_count`;
    const count = this.metrics.get(countKey) || 0;
    this.metrics.set(countKey, count + 1);
  }

  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  static reset(): void {
    this.metrics.clear();
  }
}

// Health check endpoint with metrics
export function createHealthCheckHandler() {
  return async (request: NextRequest): Promise<NextResponse> => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: MetricsCollector.getMetrics(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown',
    };

    return NextResponse.json(health);
  };
}