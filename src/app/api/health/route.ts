import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/core/config/env';
import { healthCheckMiddleware } from '@/api/middleware';

async function healthCheckHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const serviceStatus = env.getServiceStatus();
    
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.get('NODE_ENV'),
      uptime: process.uptime(),
      services: serviceStatus,
      allCoreServicesReady: serviceStatus.database && 
                           serviceStatus.openai && 
                           serviceStatus.cloudinary && 
                           serviceStatus.falai && 
                           serviceStatus.sonauto && 
                           serviceStatus.stripe,
      version: process.env.npm_package_version || '1.0.0'
    };

    return NextResponse.json(healthCheck, {
      status: healthCheck.allCoreServicesReady ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Environment configuration error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Apply health check middleware (minimal logging, no rate limiting)
export const GET = healthCheckMiddleware(healthCheckHandler);