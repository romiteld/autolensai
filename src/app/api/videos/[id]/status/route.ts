import { NextRequest, NextResponse } from 'next/server';
import { queueService } from '@/queue/services/queue.service';
import { QUEUE_NAMES } from '@/queue/config/queue.config';
import { supabase } from '@/core/database/supabase';
import { Redis } from 'ioredis';
import { env } from '@/core/config/env';

// Initialize Redis client for status tracking
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
    
    if (!id) {
      return NextResponse.json(
        { 
          error: 'Job ID is required',
          code: 'MISSING_JOB_ID'
        },
        { status: 400 }
      );
    }

    // Get detailed status from Redis
    const statusKey = `video_generation:${id}`;
    const redisStatus = await redis.get(statusKey);
    
    let detailedStatus = null;
    if (redisStatus) {
      try {
        detailedStatus = JSON.parse(redisStatus);
      } catch (error) {
        console.error('Failed to parse Redis status:', error);
      }
    }

    // Get job from queue
    const job = await queueService.getJob(QUEUE_NAMES.VIDEO_GENERATION, id);
    
    // Get status from database
    const { data: dbStatus } = await supabase
      .from('video_generation_jobs')
      .select('*')
      .eq('id', id)
      .single();

    // Combine status from different sources
    let status = 'unknown';
    let progress = 0;
    let currentStep = 'Unknown status';
    let error = null;

    if (job) {
      // Job exists in queue
      const jobState = await job.getState();
      progress = job.progress() as number || 0;
      
      switch (jobState) {
        case 'waiting':
        case 'delayed':
          status = 'queued';
          currentStep = 'Waiting in queue';
          break;
        case 'active':
          status = detailedStatus?.status || 'processing';
          currentStep = detailedStatus?.currentStep || 'Processing video';
          break;
        case 'completed':
          status = 'completed';
          currentStep = 'Video generation completed';
          progress = 100;
          break;
        case 'failed':
          status = 'failed';
          currentStep = 'Video generation failed';
          error = job.failedReason;
          break;
        default:
          status = 'unknown';
      }
    } else if (dbStatus) {
      // Job not in queue but exists in database
      status = dbStatus.status || 'unknown';
      progress = dbStatus.progress || 0;
      currentStep = dbStatus.currentStep || 'Unknown';
      error = dbStatus.error;
    }

    // Calculate estimated time remaining
    let estimatedTimeRemaining = null;
    if (status !== 'completed' && status !== 'failed') {
      const totalEstimatedTime = 400; // 6-7 minutes in seconds
      const elapsedProgress = progress / 100;
      estimatedTimeRemaining = Math.max(0, totalEstimatedTime * (1 - elapsedProgress));
    }

    const response = {
      success: true,
      jobId: id,
      status,
      progress,
      currentStep,
      error,
      estimatedTimeRemaining,
      details: {
        ...detailedStatus,
        queueStatus: job ? await job.getState() : null,
        createdAt: dbStatus?.createdAt || detailedStatus?.createdAt,
        completedAt: dbStatus?.completedAt || detailedStatus?.completedAt,
      }
    };

    // Add specific status details based on current stage
    if (detailedStatus) {
      if (detailedStatus.scenes) {
        response.details.scenes = detailedStatus.scenes;
      }
      if (detailedStatus.videoClips) {
        response.details.videoClips = detailedStatus.videoClips;
      }
      if (detailedStatus.musicUrl) {
        response.details.musicUrl = detailedStatus.musicUrl;
      }
      if (detailedStatus.finalVideoUrl) {
        response.details.finalVideoUrl = detailedStatus.finalVideoUrl;
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Video status API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get video generation status',
        code: 'STATUS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { 
          error: 'Job ID is required',
          code: 'MISSING_JOB_ID'
        },
        { status: 400 }
      );
    }

    // Get job from queue
    const job = await queueService.getJob(QUEUE_NAMES.VIDEO_GENERATION, id);
    
    if (job) {
      const jobState = await job.getState();
      
      // Only allow cancellation of queued or active jobs
      if (jobState === 'waiting' || jobState === 'delayed' || jobState === 'active') {
        await job.remove();
        
        // Update status in database
        await supabase
          .from('video_generation_jobs')
          .update({
            status: 'cancelled',
            error: 'Job cancelled by user',
            completedAt: new Date().toISOString(),
          })
          .eq('id', id);

        // Clean up Redis status
        const statusKey = `video_generation:${id}`;
        await redis.del(statusKey);

        return NextResponse.json({
          success: true,
          message: 'Video generation job cancelled successfully',
          jobId: id,
        });
      } else {
        return NextResponse.json(
          { 
            error: `Cannot cancel job in ${jobState} state`,
            code: 'CANNOT_CANCEL',
            currentState: jobState
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { 
          error: 'Job not found',
          code: 'JOB_NOT_FOUND'
        },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Video cancellation API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to cancel video generation',
        code: 'CANCELLATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}