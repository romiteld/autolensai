import { NextRequest, NextResponse } from 'next/server';
import { CloudinaryService } from '@/ai/services/cloudinary.service';
import { createSupabaseClient } from '@/core/database/supabase';
import { queueService } from '@/queue/services/queue.service';
import { QUEUE_NAMES } from '@/queue/config/queue.config';
import { z } from 'zod';

const processSchema = z.object({
  imageId: z.string().uuid(),
  operation: z.enum([
    'remove_background', 
    'enhance', 
    'create_thumbnail',
    'generative_fill',
    'object_replace',
    'add_watermark',
    'add_pricing',
    'generate_social_card',
    'ai_enhance'
  ]),
  async: z.boolean().optional().default(true),
  options: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    quality: z.string().optional(),
    // Generative AI options
    prompt: z.string().optional(),
    hint: z.string().optional(),
    // Object replacement
    fromObject: z.string().optional(),
    toObject: z.string().optional(),
    // Text overlay
    text: z.string().optional(),
    fontSize: z.number().optional(),
    textColor: z.string().optional(),
    // Vehicle info for social cards
    vehicleInfo: z.object({
      make: z.string(),
      model: z.string(),
      year: z.number(),
      price: z.string()
    }).optional(),
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
          const bgRemovalUrl = await cloudinaryService.removeBackgroundWithAI(
            image.cloudinary_public_id,
            {
              prompt: validatedData.options?.prompt,
              hint: validatedData.options?.hint
            }
          );
          result = {
            publicId: image.cloudinary_public_id,
            url: bgRemovalUrl,
            operation: 'background_removal'
          };
          break;

        case 'enhance':
          result = await cloudinaryService.enhanceVehicleImage(
            sourceUrl,
            `autolensai/vehicles/${image.vehicle_id}`
          );
          break;

        case 'ai_enhance':
          const enhancedUrl = await cloudinaryService.enhanceVehicleWithAI(
            image.cloudinary_public_id,
            true
          );
          result = {
            publicId: image.cloudinary_public_id,
            url: enhancedUrl,
            operation: 'ai_enhancement'
          };
          break;

        case 'generative_fill':
          const fillUrl = await cloudinaryService.generativeFillBackground(
            image.cloudinary_public_id,
            {
              prompt: validatedData.options?.prompt || 'luxury car showroom background',
              width: validatedData.options?.width,
              height: validatedData.options?.height
            }
          );
          result = {
            publicId: image.cloudinary_public_id,
            url: fillUrl,
            operation: 'generative_fill'
          };
          break;

        case 'object_replace':
          if (!validatedData.options?.fromObject || !validatedData.options?.toObject) {
            throw new Error('fromObject and toObject are required for object replacement');
          }
          const replaceUrl = await cloudinaryService.replaceObjectWithAI(
            image.cloudinary_public_id,
            {
              from: validatedData.options.fromObject,
              to: validatedData.options.toObject,
              prompt: validatedData.options.prompt
            }
          );
          result = {
            publicId: image.cloudinary_public_id,
            url: replaceUrl,
            operation: 'object_replacement'
          };
          break;

        case 'add_watermark':
          const watermarkUrl = await cloudinaryService.applyBrandOverlay(
            image.cloudinary_public_id
          );
          result = {
            publicId: image.cloudinary_public_id,
            url: watermarkUrl,
            operation: 'watermark'
          };
          break;

        case 'add_pricing':
          if (!validatedData.options?.text) {
            throw new Error('Text is required for pricing overlay');
          }
          const pricingUrl = await cloudinaryService.addTextOverlay(
            image.cloudinary_public_id,
            {
              text: validatedData.options.text,
              fontSize: validatedData.options.fontSize || 72,
              color: validatedData.options.textColor || '#ffffff'
            }
          );
          result = {
            publicId: image.cloudinary_public_id,
            url: pricingUrl,
            operation: 'pricing_overlay'
          };
          break;

        case 'generate_social_card':
          if (!validatedData.options?.vehicleInfo) {
            throw new Error('Vehicle info is required for social card generation');
          }
          const socialCardUrl = await cloudinaryService.generateSocialCard(
            image.cloudinary_public_id,
            validatedData.options.vehicleInfo
          );
          result = {
            publicId: image.cloudinary_public_id,
            url: socialCardUrl,
            operation: 'social_card',
            dimensions: { width: 1200, height: 630 }
          };
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
            operation: 'thumbnail'
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