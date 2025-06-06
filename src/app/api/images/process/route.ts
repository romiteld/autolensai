import { NextRequest, NextResponse } from 'next/server';
import { CloudinaryService } from '@/ai/services/cloudinary.service';
import { createSupabaseClient } from '@/core/database/supabase';
import { queueService } from '@/queue/services/queue.service';
import { QUEUE_NAMES } from '@/queue/config/queue.config';
import { z } from 'zod';

const processSchema = z.object({
  imageId: z.string().uuid(),
  operation: z.enum(['remove_background', 'enhance', 'create_thumbnail']),
  async: z.boolean().optional().default(true),
  options: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    quality: z.string().optional(),
  }).optional(),
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
    const validatedData = processSchema.parse(body);

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
      .eq('id', validatedData.imageId)
      .eq('vehicles.user_id', user.id)
      .single();

    if (imageError || !image) {
      return NextResponse.json(
        { error: 'Image not found or unauthorized' },
        { status: 404 }
      );
    }

    // If async processing is requested, queue the job
    if (validatedData.async) {
      await supabase
        .from('vehicle_images')
        .update({ processing_status: 'processing' })
        .eq('id', validatedData.imageId);

      const jobId = `${validatedData.operation}-${validatedData.imageId}-${Date.now()}`;
      
      await queueService.addJob(QUEUE_NAMES.IMAGE_PROCESSING, {
        id: jobId,
        data: {
          imageId: validatedData.imageId,
          operation: validatedData.operation,
          options: validatedData.options,
          vehicleId: image.vehicle_id,
          originalUrl: image.original_url,
          publicId: image.cloudinary_public_id,
        },
        priority: 5,
      });

      return NextResponse.json({
        success: true,
        async: true,
        jobId,
        operation: validatedData.operation,
        message: `Image ${validatedData.operation.replace('_', ' ')} queued for processing`,
      });
    }

    // Synchronous processing
    await supabase
      .from('vehicle_images')
      .update({ processing_status: 'processing' })
      .eq('id', validatedData.imageId);

    let result;
    try {
      const sourceUrl = image.processed_url || image.original_url;
      
      switch (validatedData.operation) {
        case 'remove_background':
          result = await cloudinaryService.removeBackground(
            sourceUrl,
            `autolensai/vehicles/${image.vehicle_id}`
          );
          break;

        case 'enhance':
          result = await cloudinaryService.enhanceVehicleImage(
            sourceUrl,
            `autolensai/vehicles/${image.vehicle_id}`
          );
          break;

        case 'create_thumbnail':
          const thumbnailUrl = await cloudinaryService.createThumbnail(
            image.cloudinary_public_id,
            validatedData.options?.width,
            validatedData.options?.height
          );
          result = {
            publicId: image.cloudinary_public_id,
            url: thumbnailUrl,
            width: validatedData.options?.width || 400,
            height: validatedData.options?.height || 300,
          };
          break;

        default:
          throw new Error('Invalid operation');
      }

      // Update the image record with processed URL
      if (validatedData.operation !== 'create_thumbnail') {
        await supabase
          .from('vehicle_images')
          .update({
            processed_url: result.url,
            processing_status: 'completed',
          })
          .eq('id', validatedData.imageId);
      } else {
        await supabase
          .from('vehicle_images')
          .update({ processing_status: 'completed' })
          .eq('id', validatedData.imageId);
      }

      return NextResponse.json({
        success: true,
        async: false,
        operation: validatedData.operation,
        result,
        message: `Image ${validatedData.operation.replace('_', ' ')} completed successfully`,
      });

    } catch (processingError) {
      console.error(`${validatedData.operation} error:`, processingError);
      
      // Update status to failed
      await supabase
        .from('vehicle_images')
        .update({ processing_status: 'failed' })
        .eq('id', validatedData.imageId);

      return NextResponse.json(
        { error: `Failed to ${validatedData.operation.replace('_', ' ')}` },
        { status: 500 }
      );
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Image processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
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
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Get processing status
    const { data: image, error: imageError } = await supabase
      .from('vehicle_images')
      .select(`
        id,
        processing_status,
        created_at,
        updated_at,
        vehicles!inner (
          user_id
        )
      `)
      .eq('id', imageId)
      .eq('vehicles.user_id', user.id)
      .single();

    if (imageError || !image) {
      return NextResponse.json(
        { error: 'Image not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      imageId: image.id,
      status: image.processing_status,
      createdAt: image.created_at,
    });

  } catch (error) {
    console.error('Get processing status error:', error);
    return NextResponse.json(
      { error: 'Failed to get processing status' },
      { status: 500 }
    );
  }
}