import { NextRequest, NextResponse } from 'next/server';
import { queueService } from '@/queue/services/queue.service';
import { QUEUE_NAMES } from '@/queue/config/queue.config';
import { supabase } from '@/core/database/supabase';
import type { VideoGenerationJobData } from '@/queue/jobs/video-generation.job';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleId,
      marketingIdea,
      imageUrls,
      style = 'cinematic',
      theme = 'family',
      platform = 'youtube',
    } = body;

    // Validation
    if (!vehicleId || !marketingIdea || !imageUrls?.length) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: vehicleId, marketingIdea, and imageUrls are required',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    if (imageUrls.length !== 3) {
      return NextResponse.json(
        { 
          error: 'Exactly 3 image URLs are required for video generation',
          code: 'INVALID_IMAGE_COUNT'
        },
        { status: 400 }
      );
    }

    // Validate URLs
    const invalidUrls = imageUrls.filter((url: string) => {
      try {
        new URL(url);
        return false;
      } catch {
        return true;
      }
    });

    if (invalidUrls.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid image URLs provided',
          code: 'INVALID_URLS',
          invalidUrls
        },
        { status: 400 }
      );
    }

    // Get user ID from authentication (simplified for now)
    // In a real app, you'd get this from JWT token or session
    const userId = request.headers.get('user-id') || 'anonymous';

    // Verify vehicle exists and user has access
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, user_id, make, model, year')
      .eq('id', vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { 
          error: 'Vehicle not found',
          code: 'VEHICLE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Check if user owns the vehicle (in production, verify user auth)
    if (vehicle.user_id !== userId && userId !== 'anonymous') {
      return NextResponse.json(
        { 
          error: 'Unauthorized access to vehicle',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    // Create job data
    const jobData: VideoGenerationJobData = {
      vehicleId,
      userId,
      marketingIdea,
      imageUrls,
      style,
      theme,
      platform,
    };

    // Generate unique job ID
    const jobId = `video_${vehicleId}_${Date.now()}`;

    // Add job to queue
    const job = await queueService.addJob(QUEUE_NAMES.VIDEO_GENERATION, {
      id: jobId,
      data: jobData,
      priority: 1, // High priority for video generation
      attempts: 3,
    });

    // Store initial status
    const initialStatus = {
      id: jobId,
      vehicleId,
      status: 'queued',
      progress: 0,
      currentStep: 'Video generation queued',
      estimatedTime: 400, // 6-7 minutes
      createdAt: new Date().toISOString(),
      marketingIdea,
      style,
      theme,
      platform,
    };

    // Save to database for tracking
    const { error: dbError } = await supabase
      .from('video_generation_jobs')
      .insert(initialStatus);

    if (dbError) {
      console.error('Failed to save job to database:', dbError);
      // Continue anyway as the job is already queued
    }

    console.log(`Video generation job ${jobId} queued for vehicle ${vehicleId}`);

    return NextResponse.json({
      success: true,
      jobId,
      status: 'queued',
      message: 'Video generation started successfully',
      estimatedTime: 400,
      data: {
        vehicleId,
        marketingIdea,
        style,
        theme,
        platform,
        imageCount: imageUrls.length,
      }
    });

  } catch (error) {
    console.error('Video generation API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during video generation',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const userId = request.headers.get('user-id') || 'anonymous';

    if (!vehicleId) {
      return NextResponse.json(
        { 
          error: 'vehicleId parameter is required',
          code: 'MISSING_VEHICLE_ID'
        },
        { status: 400 }
      );
    }

    // Get all video generation jobs for this vehicle
    const { data: jobs, error } = await supabase
      .from('video_generation_jobs')
      .select('*')
      .eq('vehicleId', vehicleId)
      .order('createdAt', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      jobs: jobs || [],
      count: jobs?.length || 0,
    });

  } catch (error) {
    console.error('Video generation history API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch video generation history',
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}