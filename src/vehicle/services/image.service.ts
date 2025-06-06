import { createSupabaseClient } from '@/core/database/supabase';
import { CloudinaryService } from '@/ai/services/cloudinary.service';
import { queueService } from '@/queue/services/queue.service';
import { QUEUE_NAMES } from '@/queue/config/queue.config';
import { ImageProcessingService } from '@/ai/image-processing';
import type { Database } from '@/common/types/database.types';

type VehicleImage = Database['public']['Tables']['vehicle_images']['Row'];
type VehicleImageInsert = Database['public']['Tables']['vehicle_images']['Insert'];
type VehicleImageUpdate = Database['public']['Tables']['vehicle_images']['Update'];

export interface ImageUploadOptions {
  applyEnhancements?: boolean;
  orderIndex?: number;
  isPrimary?: boolean;
  folder?: string;
}

export interface ProcessingOptions {
  width?: number;
  height?: number;
  quality?: string;
  async?: boolean;
}

export interface ImageProcessingWorkflow {
  removeBackground?: boolean;
  replaceBackground?: boolean;
  backgroundPrompt?: string;
  enhance?: boolean;
  optimize?: boolean;
  createVariants?: boolean;
  addWatermark?: boolean;
  watermarkText?: string;
}

export interface BatchProcessingOptions extends ImageProcessingWorkflow {
  batchSize?: number;
  concurrency?: number;
  priority?: number;
}

export class ImageService {
  private cloudinaryService: CloudinaryService;
  private imageProcessingService: ImageProcessingService;

  constructor() {
    this.cloudinaryService = new CloudinaryService();
    this.imageProcessingService = new ImageProcessingService();
  }

  async uploadVehicleImages(
    vehicleId: string,
    userId: string,
    files: Array<{ name: string; type: string; data: string }>,
    options: ImageUploadOptions = {}
  ) {
    const supabase = createSupabaseClient();

    // Verify vehicle ownership
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, user_id')
      .eq('id', vehicleId)
      .eq('user_id', userId)
      .single();

    if (vehicleError || !vehicle) {
      throw new Error('Vehicle not found or unauthorized');
    }

    const folder = options.folder || `autolensai/vehicles/${vehicleId}`;
    const uploadedImages = [];

    // If setting as primary, remove primary status from other images
    if (options.isPrimary) {
      await supabase
        .from('vehicle_images')
        .update({ is_primary: false })
        .eq('vehicle_id', vehicleId);
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Convert base64 to data URL for Cloudinary
        const imageDataUrl = `data:${file.type};base64,${file.data}`;

        // Upload to Cloudinary (without enhancement initially)
        const uploadResult = await this.cloudinaryService.uploadVehicleImage(
          imageDataUrl, 
          folder, 
          []
        );

        // Store image metadata in database
        const imageData: VehicleImageInsert = {
          vehicle_id: vehicleId,
          original_url: uploadResult.url,
          cloudinary_public_id: uploadResult.publicId,
          order_index: options.orderIndex ? options.orderIndex + i : i,
          is_primary: options.isPrimary && i === 0, // Only first image can be primary
          processing_status: 'pending',
        };

        const { data: imageRecord, error: insertError } = await supabase
          .from('vehicle_images')
          .insert(imageData)
          .select()
          .single();

        if (insertError) {
          console.error('Database insert error:', insertError);
          // Try to cleanup Cloudinary upload
          await this.cloudinaryService.deleteImage(uploadResult.publicId);
          throw new Error('Failed to save image metadata');
        }

        uploadedImages.push({
          id: imageRecord.id,
          originalUrl: uploadResult.url,
          publicId: uploadResult.publicId,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
        });

        // Queue enhancement job if requested
        if (options.applyEnhancements) {
          await queueService.addJob(QUEUE_NAMES.IMAGE_PROCESSING, {
            id: `enhance-${imageRecord.id}`,
            data: {
              imageId: imageRecord.id,
              operation: 'enhance',
              vehicleId,
              originalUrl: uploadResult.url,
              publicId: uploadResult.publicId,
            },
            priority: 5,
          });
        }

      } catch (fileError) {
        console.error(`Failed to upload file ${file.name}:`, fileError);
        // Continue with other files
      }
    }

    return uploadedImages;
  }

  async getVehicleImages(vehicleId: string, userId: string) {
    const supabase = createSupabaseClient();

    // Verify vehicle ownership and get images
    const { data: images, error: imagesError } = await supabase
      .from('vehicle_images')
      .select(`
        *,
        vehicles!inner (
          id,
          user_id
        )
      `)
      .eq('vehicle_id', vehicleId)
      .eq('vehicles.user_id', userId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (imagesError) {
      throw new Error('Failed to fetch images');
    }

    // Generate thumbnails for each image
    const imagesWithThumbnails = await Promise.all(
      images.map(async (image) => {
        let thumbnail = '';
        if (image.cloudinary_public_id) {
          thumbnail = await this.cloudinaryService.createThumbnail(
            image.cloudinary_public_id
          );
        }
        return {
          ...image,
          thumbnail,
          url: image.processed_url || image.original_url,
        };
      })
    );

    return imagesWithThumbnails;
  }

  async getImage(imageId: string, userId: string) {
    const supabase = createSupabaseClient();

    // Get image with vehicle ownership verification
    const { data: image, error: imageError } = await supabase
      .from('vehicle_images')
      .select(`
        *,
        vehicles!inner (
          id,
          user_id,
          make,
          model,
          year
        )
      `)
      .eq('id', imageId)
      .eq('vehicles.user_id', userId)
      .single();

    if (imageError || !image) {
      throw new Error('Image not found or unauthorized');
    }

    // Generate optimized URLs for different sizes
    let optimizedUrls = {};
    if (image.cloudinary_public_id) {
      optimizedUrls = {
        thumbnail: await this.cloudinaryService.createThumbnail(
          image.cloudinary_public_id, 
          300, 
          200
        ),
        medium: this.cloudinaryService.generateOptimizedUrl(
          image.cloudinary_public_id, 
          { width: 800, height: 600 }
        ),
        large: this.cloudinaryService.generateOptimizedUrl(
          image.cloudinary_public_id, 
          { width: 1200, height: 900 }
        ),
        original: image.processed_url || image.original_url,
      };
    }

    return {
      ...image,
      url: image.processed_url || image.original_url,
      optimizedUrls,
    };
  }

  async updateImage(imageId: string, userId: string, updates: VehicleImageUpdate) {
    const supabase = createSupabaseClient();

    // Verify image ownership
    const { data: image, error: imageError } = await supabase
      .from('vehicle_images')
      .select(`
        id,
        vehicle_id,
        vehicles!inner (
          user_id
        )
      `)
      .eq('id', imageId)
      .eq('vehicles.user_id', userId)
      .single();

    if (imageError || !image) {
      throw new Error('Image not found or unauthorized');
    }

    // If setting as primary, remove primary status from other images
    if (updates.is_primary) {
      await supabase
        .from('vehicle_images')
        .update({ is_primary: false })
        .eq('vehicle_id', image.vehicle_id);
    }

    // Update image
    const { data: updatedImage, error: updateError } = await supabase
      .from('vehicle_images')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to update image');
    }

    return updatedImage;
  }

  async deleteImage(imageId: string, userId: string) {
    const supabase = createSupabaseClient();

    // Get image with ownership verification
    const { data: image, error: imageError } = await supabase
      .from('vehicle_images')
      .select(`
        *,
        vehicles!inner (
          user_id
        )
      `)
      .eq('id', imageId)
      .eq('vehicles.user_id', userId)
      .single();

    if (imageError || !image) {
      throw new Error('Image not found or unauthorized');
    }

    // Delete from Cloudinary first
    let cloudinaryDeleted = false;
    if (image.cloudinary_public_id) {
      cloudinaryDeleted = await this.cloudinaryService.deleteImage(
        image.cloudinary_public_id
      );
    }

    if (!cloudinaryDeleted && image.cloudinary_public_id) {
      console.warn(`Failed to delete image from Cloudinary: ${image.cloudinary_public_id}`);
      // Continue with database deletion anyway
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('vehicle_images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      throw new Error('Failed to delete image from database');
    }

    // If this was the primary image, set another image as primary
    if (image.is_primary) {
      const { data: otherImages } = await supabase
        .from('vehicle_images')
        .select('id')
        .eq('vehicle_id', image.vehicle_id)
        .limit(1);

      if (otherImages && otherImages.length > 0) {
        await supabase
          .from('vehicle_images')
          .update({ is_primary: true })
          .eq('id', otherImages[0].id);
      }
    }

    return {
      success: true,
      cloudinaryDeleted,
    };
  }

  async processImage(
    imageId: string, 
    userId: string, 
    operation: 'remove_background' | 'enhance' | 'create_thumbnail',
    options: ProcessingOptions = {}
  ) {
    const supabase = createSupabaseClient();

    // Get image record and verify ownership
    const { data: image, error: imageError } = await supabase
      .from('vehicle_images')
      .select(`
        *,
        vehicles!inner (
          id,
          user_id
        )
      `)
      .eq('id', imageId)
      .eq('vehicles.user_id', userId)
      .single();

    if (imageError || !image) {
      throw new Error('Image not found or unauthorized');
    }

    // If async processing is requested (default), queue the job
    if (options.async !== false) {
      await supabase
        .from('vehicle_images')
        .update({ processing_status: 'processing' })
        .eq('id', imageId);

      const jobId = `${operation}-${imageId}-${Date.now()}`;
      
      await queueService.addJob(QUEUE_NAMES.IMAGE_PROCESSING, {
        id: jobId,
        data: {
          imageId,
          operation,
          options,
          vehicleId: image.vehicle_id,
          originalUrl: image.original_url,
          processedUrl: image.processed_url,
          publicId: image.cloudinary_public_id,
        },
        priority: 5,
      });

      return {
        success: true,
        async: true,
        jobId,
        operation,
        message: `Image ${operation.replace('_', ' ')} queued for processing`,
      };
    }

    // Synchronous processing
    await supabase
      .from('vehicle_images')
      .update({ processing_status: 'processing' })
      .eq('id', imageId);

    try {
      const sourceUrl = image.processed_url || image.original_url;
      let result;
      
      switch (operation) {
        case 'remove_background':
          result = await this.cloudinaryService.removeBackground(
            sourceUrl,
            `autolensai/vehicles/${image.vehicle_id}`
          );
          break;

        case 'enhance':
          result = await this.cloudinaryService.enhanceVehicleImage(
            sourceUrl,
            `autolensai/vehicles/${image.vehicle_id}`
          );
          break;

        case 'create_thumbnail':
          const thumbnailUrl = await this.cloudinaryService.createThumbnail(
            image.cloudinary_public_id,
            options.width,
            options.height
          );
          result = {
            publicId: image.cloudinary_public_id,
            url: thumbnailUrl,
            width: options.width || 400,
            height: options.height || 300,
          };
          break;

        default:
          throw new Error('Invalid operation');
      }

      // Update the image record with processed URL
      if (operation !== 'create_thumbnail') {
        await supabase
          .from('vehicle_images')
          .update({
            processed_url: result.url,
            processing_status: 'completed',
          })
          .eq('id', imageId);
      } else {
        await supabase
          .from('vehicle_images')
          .update({ processing_status: 'completed' })
          .eq('id', imageId);
      }

      return {
        success: true,
        async: false,
        operation,
        result,
        message: `Image ${operation.replace('_', ' ')} completed successfully`,
      };

    } catch (processingError) {
      console.error(`${operation} error:`, processingError);
      
      // Update status to failed
      await supabase
        .from('vehicle_images')
        .update({ processing_status: 'failed' })
        .eq('id', imageId);

      throw new Error(`Failed to ${operation.replace('_', ' ')}`);
    }
  }

  /**
   * Process vehicle images through a complete workflow
   */
  async processVehicleImageWorkflow(
    vehicleId: string,
    userId: string,
    workflow: ImageProcessingWorkflow
  ) {
    const supabase = createSupabaseClient();

    // Verify vehicle ownership
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, user_id, cloudinary_folder')
      .eq('id', vehicleId)
      .eq('user_id', userId)
      .single();

    if (vehicleError || !vehicle) {
      throw new Error('Vehicle not found or unauthorized');
    }

    // Get all vehicle images
    const { data: images, error: imagesError } = await supabase
      .from('vehicle_images')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('order_index', { ascending: true });

    if (imagesError) {
      throw new Error('Failed to fetch vehicle images');
    }

    if (!images || images.length === 0) {
      throw new Error('No images found for this vehicle');
    }

    const results = [];
    const folder = vehicle.cloudinary_folder || `vehicles/${vehicleId}`;

    // Process each image through the workflow
    for (const image of images) {
      try {
        // Update processing status
        await supabase
          .from('vehicle_images')
          .update({ processing_status: 'processing' })
          .eq('id', image.id);

        const sourceUrl = image.processed_url || image.original_url;
        
        const result = await this.imageProcessingService.processVehicleImage(
          sourceUrl,
          folder,
          {
            removeBackground: workflow.removeBackground,
            enhance: workflow.enhance,
            optimize: workflow.optimize,
            addWatermark: workflow.addWatermark,
            watermarkText: workflow.watermarkText,
            backgroundPrompt: workflow.backgroundPrompt,
          }
        );

        // Update image record with processed URL
        await supabase
          .from('vehicle_images')
          .update({
            processed_url: result.processed,
            processing_status: 'completed',
          })
          .eq('id', image.id);

        results.push({
          imageId: image.id,
          success: true,
          originalUrl: sourceUrl,
          processedUrl: result.processed,
          processingSteps: result.processingSteps,
        });
      } catch (error) {
        console.error(`Failed to process image ${image.id}:`, error);
        
        // Update status to failed
        await supabase
          .from('vehicle_images')
          .update({ processing_status: 'failed' })
          .eq('id', image.id);

        results.push({
          imageId: image.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      vehicleId,
      totalImages: images.length,
      processedImages: results.filter(r => r.success).length,
      failedImages: results.filter(r => !r.success).length,
      results,
    };
  }

  /**
   * Create comprehensive image variants for vehicle listing
   */
  async createVehicleImageVariants(
    imageId: string,
    userId: string
  ) {
    const supabase = createSupabaseClient();

    // Get image with vehicle info
    const { data: image, error: imageError } = await supabase
      .from('vehicle_images')
      .select(`
        *,
        vehicles!inner (
          id,
          user_id,
          cloudinary_folder
        )
      `)
      .eq('id', imageId)
      .eq('vehicles.user_id', userId)
      .single();

    if (imageError || !image) {
      throw new Error('Image not found or unauthorized');
    }

    const sourceUrl = image.processed_url || image.original_url;
    const folder = image.vehicles.cloudinary_folder || `vehicles/${image.vehicle_id}`;

    try {
      // Update processing status
      await supabase
        .from('vehicle_images')
        .update({ processing_status: 'processing' })
        .eq('id', imageId);

      // Create comprehensive image set
      const variants = await this.imageProcessingService.createVehicleImageSet(
        sourceUrl,
        folder
      );

      // Update status to completed
      await supabase
        .from('vehicle_images')
        .update({ processing_status: 'completed' })
        .eq('id', imageId);

      return {
        imageId,
        success: true,
        variants,
      };
    } catch (error) {
      console.error(`Failed to create variants for image ${imageId}:`, error);
      
      // Update status to failed
      await supabase
        .from('vehicle_images')
        .update({ processing_status: 'failed' })
        .eq('id', imageId);

      throw error;
    }
  }

  /**
   * Batch process multiple images with configurable options
   */
  async batchProcessImages(
    vehicleId: string,
    userId: string,
    options: BatchProcessingOptions
  ) {
    const {
      batchSize = 3,
      concurrency = 2,
      priority = 5,
      ...workflow
    } = options;

    const supabase = createSupabaseClient();

    // Verify vehicle ownership and get images
    const { data: images, error: imagesError } = await supabase
      .from('vehicle_images')
      .select(`
        *,
        vehicles!inner (
          id,
          user_id
        )
      `)
      .eq('vehicle_id', vehicleId)
      .eq('vehicles.user_id', userId)
      .order('order_index', { ascending: true });

    if (imagesError) {
      throw new Error('Failed to fetch images for batch processing');
    }

    if (!images || images.length === 0) {
      throw new Error('No images found for batch processing');
    }

    // Queue batch processing jobs
    const jobIds = [];
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      
      const jobId = `batch-process-${vehicleId}-${i}-${Date.now()}`;
      
      await queueService.addJob(QUEUE_NAMES.IMAGE_PROCESSING, {
        id: jobId,
        data: {
          type: 'batch_workflow',
          vehicleId,
          imageIds: batch.map(img => img.id),
          workflow,
          batchIndex: Math.floor(i / batchSize),
        },
        priority,
      });

      jobIds.push(jobId);
    }

    return {
      vehicleId,
      totalImages: images.length,
      batchCount: jobIds.length,
      jobIds,
      estimatedTime: Math.ceil(images.length / concurrency) * 2, // minutes
    };
  }

  /**
   * Get image processing statistics for a vehicle
   */
  async getImageProcessingStats(vehicleId: string, userId: string) {
    const supabase = createSupabaseClient();

    const { data: images, error } = await supabase
      .from('vehicle_images')
      .select(`
        processing_status,
        vehicles!inner (
          user_id
        )
      `)
      .eq('vehicle_id', vehicleId)
      .eq('vehicles.user_id', userId);

    if (error) {
      throw new Error('Failed to fetch image processing stats');
    }

    const stats = {
      total: images.length,
      pending: images.filter(img => img.processing_status === 'pending').length,
      processing: images.filter(img => img.processing_status === 'processing').length,
      completed: images.filter(img => img.processing_status === 'completed').length,
      failed: images.filter(img => img.processing_status === 'failed').length,
    };

    return {
      vehicleId,
      ...stats,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      hasFailures: stats.failed > 0,
      isProcessing: stats.processing > 0,
    };
  }

  /**
   * Retry failed image processing
   */
  async retryFailedProcessing(vehicleId: string, userId: string) {
    const supabase = createSupabaseClient();

    // Get failed images
    const { data: failedImages, error } = await supabase
      .from('vehicle_images')
      .select(`
        id,
        original_url,
        cloudinary_public_id,
        vehicles!inner (
          user_id,
          cloudinary_folder
        )
      `)
      .eq('vehicle_id', vehicleId)
      .eq('vehicles.user_id', userId)
      .eq('processing_status', 'failed');

    if (error) {
      throw new Error('Failed to fetch failed images');
    }

    if (!failedImages || failedImages.length === 0) {
      return {
        vehicleId,
        message: 'No failed images found',
        retriedCount: 0,
      };
    }

    const jobIds = [];
    for (const image of failedImages) {
      // Reset status to pending
      await supabase
        .from('vehicle_images')
        .update({ processing_status: 'pending' })
        .eq('id', image.id);

      // Queue retry job
      const jobId = `retry-${image.id}-${Date.now()}`;
      
      await queueService.addJob(QUEUE_NAMES.IMAGE_PROCESSING, {
        id: jobId,
        data: {
          type: 'retry_processing',
          imageId: image.id,
          vehicleId,
          originalUrl: image.original_url,
          publicId: image.cloudinary_public_id,
        },
        priority: 8, // Higher priority for retries
      });

      jobIds.push(jobId);
    }

    return {
      vehicleId,
      retriedCount: failedImages.length,
      jobIds,
      message: `Queued ${failedImages.length} failed images for retry processing`,
    };
  }

  /**
   * Generate downloadable image set for vehicle
   */
  async generateDownloadableImageSet(
    vehicleId: string,
    userId: string,
    format: 'web' | 'print' | 'social' = 'web'
  ) {
    const images = await this.getVehicleImages(vehicleId, userId);
    
    if (!images || images.length === 0) {
      throw new Error('No images found for download set generation');
    }

    const downloadSet = [];
    
    for (const image of images) {
      if (!image.cloudinary_public_id) continue;

      let optimizedUrl: string;
      
      switch (format) {
        case 'web':
          optimizedUrl = this.cloudinaryService.generateOptimizedUrl(
            image.cloudinary_public_id,
            { quality: 'auto:best', format: 'webp', width: 1200 }
          );
          break;
        case 'print':
          optimizedUrl = this.cloudinaryService.generateOptimizedUrl(
            image.cloudinary_public_id,
            { quality: 100, format: 'png', width: 3000 }
          );
          break;
        case 'social':
          optimizedUrl = this.cloudinaryService.generateOptimizedUrl(
            image.cloudinary_public_id,
            { quality: 'auto:best', format: 'jpg', width: 1080, height: 1080, crop: 'fill' }
          );
          break;
      }

      downloadSet.push({
        id: image.id,
        filename: `vehicle-${vehicleId}-image-${image.order_index || 0}.${format === 'print' ? 'png' : format === 'social' ? 'jpg' : 'webp'}`,
        url: optimizedUrl,
        isPrimary: image.is_primary,
        orderIndex: image.order_index,
      });
    }

    return {
      vehicleId,
      format,
      totalImages: downloadSet.length,
      images: downloadSet,
      downloadUrls: downloadSet.map(img => img.url),
    };
  }
}