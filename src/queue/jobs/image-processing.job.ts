import { Job } from 'bull';
import { CloudinaryService } from '@/ai/services/cloudinary.service';
import { createSupabaseClient } from '@/core/database/supabase';

export interface ImageProcessingJobData {
  imageId: string;
  operation: 'remove_background' | 'enhance' | 'create_thumbnail';
  vehicleId: string;
  originalUrl: string;
  processedUrl?: string;
  publicId: string;
  options?: {
    width?: number;
    height?: number;
    quality?: string;
  };
  isBulkOperation?: boolean;
  bulkJobId?: string;
}

export async function processImageJob(job: Job<ImageProcessingJobData>) {
  const { data } = job;
  const cloudinaryService = new CloudinaryService();
  const supabase = createSupabaseClient();

  try {
    console.log(`Starting image processing job: ${job.id} for image ${data.imageId}`);
    
    // Update job progress
    await job.progress(10);

    // Verify image still exists in database
    const { data: image, error: imageError } = await supabase
      .from('vehicle_images')
      .select('*')
      .eq('id', data.imageId)
      .single();

    if (imageError || !image) {
      throw new Error(`Image ${data.imageId} not found in database`);
    }

    await job.progress(20);

    let result;
    const sourceUrl = data.processedUrl || data.originalUrl;
    const folder = `autolensai/vehicles/${data.vehicleId}`;

    switch (data.operation) {
      case 'remove_background':
        console.log(`Removing background for image ${data.imageId}`);
        result = await cloudinaryService.removeBackground(sourceUrl, folder);
        await job.progress(70);
        break;

      case 'enhance':
        console.log(`Enhancing image ${data.imageId}`);
        result = await cloudinaryService.enhanceVehicleImage(sourceUrl, folder);
        await job.progress(70);
        break;

      case 'create_thumbnail':
        console.log(`Creating thumbnail for image ${data.imageId}`);
        const thumbnailUrl = await cloudinaryService.createThumbnail(
          data.publicId,
          data.options?.width,
          data.options?.height
        );
        result = {
          publicId: data.publicId,
          url: thumbnailUrl,
          width: data.options?.width || 400,
          height: data.options?.height || 300,
        };
        await job.progress(70);
        break;

      default:
        throw new Error(`Invalid operation: ${data.operation}`);
    }

    await job.progress(80);

    // Update database with processed image
    if (data.operation !== 'create_thumbnail') {
      const { error: updateError } = await supabase
        .from('vehicle_images')
        .update({
          processed_url: result.url,
          processing_status: 'completed',
        })
        .eq('id', data.imageId);

      if (updateError) {
        console.error(`Failed to update image ${data.imageId}:`, updateError);
        throw new Error('Failed to update image in database');
      }
    } else {
      // For thumbnails, just mark as completed
      const { error: updateError } = await supabase
        .from('vehicle_images')
        .update({
          processing_status: 'completed',
        })
        .eq('id', data.imageId);

      if (updateError) {
        console.error(`Failed to update image ${data.imageId}:`, updateError);
        throw new Error('Failed to update image in database');
      }
    }

    await job.progress(100);

    console.log(`Completed image processing job: ${job.id} for image ${data.imageId}`);
    
    return {
      success: true,
      imageId: data.imageId,
      operation: data.operation,
      result,
      processedUrl: result.url,
    };

  } catch (error) {
    console.error(`Image processing job failed: ${job.id}`, error);
    
    // Update database to mark as failed
    try {
      await supabase
        .from('vehicle_images')
        .update({
          processing_status: 'failed',
        })
        .eq('id', data.imageId);
    } catch (dbError) {
      console.error(`Failed to update failed status for image ${data.imageId}:`, dbError);
    }

    throw error;
  }
}

// Job processor registration function
export function registerImageProcessingJobs(queue: any) {
  queue.process('image-processing', 5, processImageJob);
  
  // Add job event listeners
  queue.on('completed', (job: Job<ImageProcessingJobData>, result: any) => {
    console.log(`Image processing job ${job.id} completed:`, result);
  });

  queue.on('failed', (job: Job<ImageProcessingJobData>, err: Error) => {
    console.error(`Image processing job ${job.id} failed:`, err.message);
  });

  queue.on('progress', (job: Job<ImageProcessingJobData>, progress: number) => {
    console.log(`Image processing job ${job.id} progress: ${progress}%`);
  });
}