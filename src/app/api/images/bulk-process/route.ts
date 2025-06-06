import { NextRequest, NextResponse } from 'next/server';
import { CloudinaryService } from '@/ai/services/cloudinary.service';
import { createSupabaseClient } from '@/core/database/supabase';
import { queueService } from '@/queue/services/queue.service';
import { QUEUE_NAMES } from '@/queue/config/queue.config';
import { z } from 'zod';

const bulkProcessSchema = z.object({
  vehicleId: z.string().uuid(),
  imageIds: z.array(z.string().uuid()).min(1),
  operation: z.enum(['remove_background', 'enhance', 'create_thumbnails']),
  options: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    quality: z.string().optional(),
    priority: z.number().min(1).max(10).optional().default(5),
  }).optional(),
});

const bulkStatusSchema = z.object({
  vehicleId: z.string().uuid(),
  jobIds: z.array(z.string()).optional(),
});

const cloudinaryService = new CloudinaryService();

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkProcessSchema.parse(body);

    // Verify vehicle belongs to user
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, user_id')
      .eq('id', validatedData.vehicleId)
      .eq('user_id', user.id)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or unauthorized' },
        { status: 404 }
      );
    }

    // Verify all images belong to the vehicle and user
    const { data: images, error: imagesError } = await supabase
      .from('vehicle_images')
      .select(`
        id,
        vehicle_id,
        original_url,
        processed_url,
        cloudinary_public_id,
        processing_status,
        vehicles!inner (
          user_id
        )
      `)
      .in('id', validatedData.imageIds)
      .eq('vehicle_id', validatedData.vehicleId)
      .eq('vehicles.user_id', user.id);

    if (imagesError || !images || images.length !== validatedData.imageIds.length) {
      return NextResponse.json(
        { error: 'Some images not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update all images to processing status
    await supabase
      .from('vehicle_images')
      .update({ processing_status: 'processing' })
      .in('id', validatedData.imageIds);

    const queuedJobs = [];
    const timestamp = Date.now();

    // Queue jobs for each image
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const jobId = `bulk-${validatedData.operation}-${image.id}-${timestamp}-${i}`;
      
      try {
        await queueService.addJob(QUEUE_NAMES.IMAGE_PROCESSING, {
          id: jobId,
          data: {
            imageId: image.id,
            operation: validatedData.operation,
            options: validatedData.options,
            vehicleId: validatedData.vehicleId,
            originalUrl: image.original_url,
            processedUrl: image.processed_url,
            publicId: image.cloudinary_public_id,
            isBulkOperation: true,
            bulkJobId: `bulk-${validatedData.vehicleId}-${timestamp}`,
          },
          priority: validatedData.options?.priority || 5,
          delay: i * 1000, // Stagger jobs by 1 second to avoid rate limits
        });

        queuedJobs.push({
          jobId,
          imageId: image.id,
          status: 'queued',
        });
      } catch (queueError) {
        console.error(`Failed to queue job for image ${image.id}:`, queueError);
        
        // Mark this image as failed
        await supabase
          .from('vehicle_images')
          .update({ processing_status: 'failed' })
          .eq('id', image.id);
      }
    }

    return NextResponse.json({
      success: true,
      operation: validatedData.operation,
      vehicleId: validatedData.vehicleId,
      totalImages: images.length,
      queuedJobs: queuedJobs.length,
      jobs: queuedJobs,
      bulkJobId: `bulk-${validatedData.vehicleId}-${timestamp}`,
      message: `${queuedJobs.length} images queued for ${validatedData.operation.replace('_', ' ')}`,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Bulk processing error:', error);
    return NextResponse.json(
      { error: 'Failed to queue bulk processing' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const jobIds = searchParams.get('jobIds')?.split(',') || [];

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      );
    }

    // Verify vehicle belongs to user
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, user_id')
      .eq('id', vehicleId)
      .eq('user_id', user.id)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get processing status for all images in the vehicle
    const { data: images, error: imagesError } = await supabase
      .from('vehicle_images')
      .select('id, processing_status, created_at')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (imagesError) {
      console.error('Images fetch error:', imagesError);
      return NextResponse.json(
        { error: 'Failed to fetch image status' },
        { status: 500 }
      );
    }

    // Get queue job statuses if jobIds provided
    const jobStatuses = [];
    if (jobIds.length > 0) {
      for (const jobId of jobIds) {
        try {
          const job = await queueService.getJob(QUEUE_NAMES.IMAGE_PROCESSING, jobId);
          if (job) {
            jobStatuses.push({
              jobId,
              status: await job.getState(),
              progress: job.progress(),
              data: job.data,
              finishedOn: job.finishedOn,
              failedReason: job.failedReason,
            });
          }
        } catch (jobError) {
          console.error(`Failed to get job status for ${jobId}:`, jobError);
          jobStatuses.push({
            jobId,
            status: 'unknown',
            error: 'Failed to fetch job status',
          });
        }
      }
    }

    // Calculate overall statistics
    const statusCounts = images.reduce((counts, image) => {
      counts[image.processing_status] = (counts[image.processing_status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return NextResponse.json({
      vehicleId,
      totalImages: images.length,
      imageStatuses: images,
      jobStatuses,
      statusCounts,
      overallProgress: {
        completed: statusCounts.completed || 0,
        processing: statusCounts.processing || 0,
        pending: statusCounts.pending || 0,
        failed: statusCounts.failed || 0,
      },
    });

  } catch (error) {
    console.error('Get bulk processing status error:', error);
    return NextResponse.json(
      { error: 'Failed to get processing status' },
      { status: 500 }
    );
  }
}