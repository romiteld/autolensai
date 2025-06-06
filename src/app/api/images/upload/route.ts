import { NextRequest, NextResponse } from 'next/server';
import { CloudinaryService } from '@/ai/services/cloudinary.service';
import { createSupabaseClient } from '@/core/database/supabase';
import { z } from 'zod';
import { queueService } from '@/queue/services/queue.service';
import { QUEUE_NAMES } from '@/queue/config/queue.config';

const uploadSchema = z.object({
  vehicleId: z.string().uuid(),
  files: z.array(z.object({
    name: z.string(),
    type: z.string(),
    data: z.string(), // Base64 encoded image
  })),
  folder: z.string().optional().default('autolensai/vehicles'),
  applyEnhancements: z.boolean().optional().default(false),
  orderIndex: z.number().optional(),
  isPrimary: z.boolean().optional().default(false),
});

const querySchema = z.object({
  vehicleId: z.string().uuid().optional(),
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
    const validatedData = uploadSchema.parse(body);

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

    const uploadedImages = [];
    const folder = `${validatedData.folder}/${validatedData.vehicleId}`;

    // If setting as primary, remove primary status from other images
    if (validatedData.isPrimary) {
      await supabase
        .from('vehicle_images')
        .update({ is_primary: false })
        .eq('vehicle_id', validatedData.vehicleId);
    }

    // Process each file
    for (let i = 0; i < validatedData.files.length; i++) {
      const file = validatedData.files[i];
      
      try {
        // Convert base64 to data URL for Cloudinary
        const imageDataUrl = `data:${file.type};base64,${file.data}`;

        // Upload to Cloudinary (without enhancement initially)
        const uploadResult = await cloudinaryService.uploadVehicleImage(imageDataUrl, folder, []);

        // Store image metadata in database
        const { data: imageRecord, error: insertError } = await supabase
          .from('vehicle_images')
          .insert({
            vehicle_id: validatedData.vehicleId,
            original_url: uploadResult.url,
            cloudinary_public_id: uploadResult.publicId,
            order_index: validatedData.orderIndex ? validatedData.orderIndex + i : i,
            is_primary: validatedData.isPrimary && i === 0, // Only first image can be primary
            processing_status: 'pending',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Database insert error:', insertError);
          // Try to cleanup Cloudinary upload
          await cloudinaryService.deleteImage(uploadResult.publicId);
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
        if (validatedData.applyEnhancements) {
          await queueService.addJob(QUEUE_NAMES.IMAGE_PROCESSING, {
            id: `enhance-${imageRecord.id}`,
            data: {
              imageId: imageRecord.id,
              operation: 'enhance',
              vehicleId: validatedData.vehicleId,
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

    return NextResponse.json({
      images: uploadedImages,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      enhancementQueued: validatedData.applyEnhancements,
    }, { status: 201 });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
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

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      );
    }

    // Verify vehicle belongs to user and get images
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
      .eq('vehicles.user_id', user.id)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (imagesError) {
      console.error('Images fetch error:', imagesError);
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      );
    }

    // Generate thumbnails for each image
    const imagesWithThumbnails = await Promise.all(
      images.map(async (image) => {
        let thumbnail = '';
        if (image.cloudinary_public_id) {
          thumbnail = await cloudinaryService.createThumbnail(image.cloudinary_public_id);
        }
        return {
          ...image,
          thumbnail,
          url: image.processed_url || image.original_url,
        };
      })
    );

    return NextResponse.json({ images: imagesWithThumbnails });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Get images error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}