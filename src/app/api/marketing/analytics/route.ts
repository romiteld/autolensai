import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MarketingAnalyticsService } from '@/marketing/services/analytics.service';
import { queueService } from '@/queue/services/queue.service';
import { QUEUE_NAMES } from '@/queue/config/queue.config';

const AnalyticsQuerySchema = z.object({
  vehicleId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  platform: z.enum(['facebook', 'instagram', 'craigslist', 'youtube', 'all']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  metrics: z.array(z.enum([
    'views', 'clicks', 'inquiries', 'favorites', 'shares', 
    'reach', 'impressions', 'ctr', 'cpc', 'conversion_rate'
  ])).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'platform', 'campaign']).optional(),
});

type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;

const UpdateMetricsSchema = z.object({
  vehicleId: z.string().uuid(),
  platform: z.enum(['facebook', 'instagram', 'craigslist', 'youtube']),
  metrics: z.object({
    views: z.number().min(0).optional(),
    clicks: z.number().min(0).optional(),
    inquiries: z.number().min(0).optional(),
    favorites: z.number().min(0).optional(),
    shares: z.number().min(0).optional(),
    reach: z.number().min(0).optional(),
    impressions: z.number().min(0).optional(),
    spend: z.number().min(0).optional(),
  }),
  timestamp: z.string().datetime().optional(),
});

type UpdateMetricsRequest = z.infer<typeof UpdateMetricsSchema>;

const analyticsService = new MarketingAnalyticsService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query: AnalyticsQuery = {
      vehicleId: searchParams.get('vehicleId') || undefined,
      campaignId: searchParams.get('campaignId') || undefined,
      platform: (searchParams.get('platform') as any) || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      metrics: searchParams.get('metrics')?.split(',') as any,
      groupBy: (searchParams.get('groupBy') as any) || undefined,
    };

    const validatedQuery = AnalyticsQuerySchema.parse(query);

    // Get analytics data
    const analytics = await analyticsService.getAnalytics(validatedQuery);

    // Calculate derived metrics
    const summary = await analyticsService.calculateSummary(validatedQuery);

    return NextResponse.json({
      success: true,
      data: {
        analytics,
        summary,
        query: validatedQuery,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Failed to fetch analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateMetricsRequest = await request.json();
    const validatedData = UpdateMetricsSchema.parse(body);

    // Update metrics
    const result = await analyticsService.updateMetrics({
      ...validatedData,
      timestamp: validatedData.timestamp ? new Date(validatedData.timestamp) : new Date(),
    });

    // Queue analytics aggregation job
    const jobId = `analytics_aggregate_${validatedData.vehicleId}_${Date.now()}`;
    await queueService.addJob(QUEUE_NAMES.ANALYTICS, {
      id: jobId,
      data: {
        type: 'AGGREGATE_METRICS',
        vehicleId: validatedData.vehicleId,
        platform: validatedData.platform,
        timestamp: validatedData.timestamp || new Date().toISOString(),
      },
      priority: 5,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Metrics updated successfully',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Failed to update metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Performance insights endpoint
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'insights') {
      const body = await request.json();
      const { vehicleId, campaignId, timeframe = '7d' } = body;

      if (!vehicleId && !campaignId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Either vehicleId or campaignId is required',
          },
          { status: 400 }
        );
      }

      const insights = await analyticsService.generateInsights({
        vehicleId,
        campaignId,
        timeframe,
      });

      return NextResponse.json({
        success: true,
        data: insights,
      });
    }

    if (action === 'optimize') {
      const body = await request.json();
      const { vehicleId, campaignId } = body;

      if (!vehicleId && !campaignId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Either vehicleId or campaignId is required',
          },
          { status: 400 }
        );
      }

      // Queue optimization job
      const jobId = `analytics_optimize_${vehicleId || campaignId}_${Date.now()}`;
      await queueService.addJob(QUEUE_NAMES.ANALYTICS, {
        id: jobId,
        data: {
          type: 'GENERATE_OPTIMIZATION_RECOMMENDATIONS',
          vehicleId,
          campaignId,
        },
        priority: 8,
      });

      return NextResponse.json({
        success: true,
        data: {
          jobId,
          message: 'Optimization analysis queued',
        },
      }, { status: 202 });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action parameter',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to process analytics request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process analytics request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Refresh analytics data from external platforms
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicleId, platform, campaignId } = body;

    if (!vehicleId && !campaignId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either vehicleId or campaignId is required',
        },
        { status: 400 }
      );
    }

    // Queue data refresh job
    const jobId = `analytics_refresh_${vehicleId || campaignId}_${Date.now()}`;
    await queueService.addJob(QUEUE_NAMES.ANALYTICS, {
      id: jobId,
      data: {
        type: 'REFRESH_PLATFORM_DATA',
        vehicleId,
        campaignId,
        platform,
      },
      priority: 6,
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        message: 'Analytics refresh queued',
      },
    }, { status: 202 });
  } catch (error) {
    console.error('Failed to refresh analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}