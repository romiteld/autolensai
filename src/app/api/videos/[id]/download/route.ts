import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/core/database/supabase';
import { Redis } from 'ioredis';
import { env } from '@/core/config/env';

const redis = new Redis(env.get('REDIS_URL') || 'redis://localhost:6379');

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'mp4';
    const platform = searchParams.get('platform'); // youtube, instagram, tiktok
    
    if (!id) {
      return NextResponse.json(
        { 
          error: 'Job ID is required',
          code: 'MISSING_JOB_ID'
        },
        { status: 400 }
      );
    }

    // Get video generation status
    const statusKey = `video_generation:${id}`;
    const redisStatus = await redis.get(statusKey);
    
    let videoUrl = null;
    let detailedStatus = null;

    if (redisStatus) {
      try {
        detailedStatus = JSON.parse(redisStatus);
        videoUrl = detailedStatus.finalVideoUrl;
      } catch (error) {
        console.error('Failed to parse Redis status:', error);
      }
    }

    // If not found in Redis, check database
    if (!videoUrl) {
      const { data: dbStatus } = await supabase
        .from('video_generation_jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (dbStatus && dbStatus.status === 'completed') {
        // Look for completed video in vehicle_videos table
        const { data: videoRecord } = await supabase
          .from('vehicle_videos')
          .select('video_url, platform, created_at')
          .eq('vehicle_id', dbStatus.vehicleId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (videoRecord) {
          videoUrl = videoRecord.video_url;
        }
      }
    }

    if (!videoUrl) {
      return NextResponse.json(
        { 
          error: 'Video not found or not yet completed',
          code: 'VIDEO_NOT_FOUND',
          status: detailedStatus?.status || 'unknown'
        },
        { status: 404 }
      );
    }

    // Check if video generation is completed
    if (detailedStatus && detailedStatus.status !== 'completed') {
      return NextResponse.json(
        { 
          error: 'Video generation is not yet completed',
          code: 'VIDEO_NOT_READY',
          status: detailedStatus.status,
          progress: detailedStatus.progress || 0
        },
        { status: 425 } // Too Early
      );
    }

    // For direct download, we'll redirect to the video URL
    // In production, you might want to:
    // 1. Validate user permissions
    // 2. Log download activity
    // 3. Apply watermarks
    // 4. Convert formats on-the-fly

    const userId = request.headers.get('user-id') || 'anonymous';

    // Log download activity
    try {
      await supabase
        .from('video_downloads')
        .insert({
          job_id: id,
          user_id: userId,
          video_url: videoUrl,
          format,
          platform,
          downloaded_at: new Date().toISOString(),
          ip_address: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        });
    } catch (error) {
      console.error('Failed to log download:', error);
      // Continue with download even if logging fails
    }

    // Return download information
    return NextResponse.json({
      success: true,
      jobId: id,
      downloadUrl: videoUrl,
      format,
      platform,
      message: 'Video ready for download',
      metadata: {
        generatedAt: detailedStatus?.completedAt,
        duration: 30, // seconds
        resolution: '1080x1920',
        fileSize: 'Unknown', // Could be determined from actual file
      }
    });

  } catch (error) {
    console.error('Video download API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to prepare video download',
        code: 'DOWNLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Alternative endpoint for direct video streaming/download
export async function POST(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  try {
    const { id } = params;
    const body = await request.json();
    const { action, options = {} } = body; // action: 'stream' | 'download' | 'convert'
    
    if (!id) {
      return NextResponse.json(
        { 
          error: 'Job ID is required',
          code: 'MISSING_JOB_ID'
        },
        { status: 400 }
      );
    }

    // Get video URL (same logic as GET)
    const statusKey = `video_generation:${id}`;
    const redisStatus = await redis.get(statusKey);
    
    let videoUrl = null;
    let detailedStatus = null;

    if (redisStatus) {
      try {
        detailedStatus = JSON.parse(redisStatus);
        videoUrl = detailedStatus.finalVideoUrl;
      } catch (error) {
        console.error('Failed to parse Redis status:', error);
      }
    }

    if (!videoUrl) {
      return NextResponse.json(
        { 
          error: 'Video not found or not yet completed',
          code: 'VIDEO_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    switch (action) {
      case 'stream':
        // Return streaming URL with appropriate headers
        return NextResponse.json({
          success: true,
          streamUrl: videoUrl,
          contentType: 'video/mp4',
          action: 'stream'
        });

      case 'download':
        // Return download URL with download headers
        return NextResponse.json({
          success: true,
          downloadUrl: videoUrl,
          filename: `marketing_video_${id}.mp4`,
          action: 'download'
        });

      case 'convert':
        // Future: Convert to different formats
        const { targetFormat = 'mp4', quality = 'high' } = options;
        
        return NextResponse.json({
          success: false,
          error: 'Format conversion not yet implemented',
          code: 'NOT_IMPLEMENTED',
          message: `Conversion to ${targetFormat} will be available in a future update`
        }, { status: 501 });

      default:
        return NextResponse.json(
          { 
            error: 'Invalid action specified',
            code: 'INVALID_ACTION',
            validActions: ['stream', 'download', 'convert']
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Video action API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process video action',
        code: 'ACTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}