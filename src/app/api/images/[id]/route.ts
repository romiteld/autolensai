import { NextRequest, NextResponse } from 'next/server';
import { CloudinaryService } from '@/ai/services/cloudinary.service';
import { createSupabaseClient } from '@/core/database/supabase';
import { z } from 'zod';

const updateSchema = z.object({
  isPrimary: z.boolean().optional(),
  orderIndex: z.number().optional(),
});

const cloudinaryService = new CloudinaryService();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const imageId = params.id;

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
      .eq('vehicles.user_id', user.id)
      .single();

    if (imageError || !image) {
      return NextResponse.json(
        { error: 'Image not found or unauthorized' },
        { status: 404 }
      );
    }

    // Generate optimized URLs for different sizes and AI processing options
    let optimizedUrls = {};
    let aiProcessingUrls = {};
    let responsiveBreakpoints = {};
    
    if (image.cloudinary_public_id) {
      // Standard responsive sizes
      responsiveBreakpoints = await cloudinaryService.generateResponsiveBreakpoints(image.cloudinary_public_id);
      
      optimizedUrls = {
        thumbnail: await cloudinaryService.createThumbnail(image.cloudinary_public_id, 300, 200),
        medium: cloudinaryService.generateOptimizedUrl(image.cloudinary_public_id, { width: 800, height: 600 }),
        large: cloudinaryService.generateOptimizedUrl(image.cloudinary_public_id, { width: 1200, height: 900 }),
        original: image.processed_url || image.original_url,
      };
      
      // AI processing options
      aiProcessingUrls = {
        backgroundRemoved: await cloudinaryService.removeBackgroundWithAI(image.cloudinary_public_id),
        enhanced: await cloudinaryService.enhanceVehicleWithAI(image.cloudinary_public_id, true),
        showroomBackground: await cloudinaryService.generativeFillBackground(image.cloudinary_public_id),
        branded: await cloudinaryService.applyBrandOverlay(image.cloudinary_public_id),
        optimized: await cloudinaryService.optimizeDelivery(image.cloudinary_public_id)
      };
      
      // Before/after comparison URLs
      const beforeAfterUrls = await cloudinaryService.generateBeforeAfterUrls(image.cloudinary_public_id);
      aiProcessingUrls.beforeAfter = beforeAfterUrls;
    }

    return NextResponse.json({
      image: {
        ...image,
        url: image.processed_url || image.original_url,
        optimizedUrls,
        aiProcessingUrls,
        responsiveBreakpoints,
        // Additional metadata for frontend
        processing: {
          hasCloudinaryId: !!image.cloudinary_public_id,
          canProcess: !!image.cloudinary_public_id,
          status: image.processing_status || 'ready'
        }
      },
    });

  } catch (error) {
    console.error('Get image error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const imageId = params.id;
    const body = await request.json();
    const validatedData = updateSchema.parse(body);

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
      .eq('vehicles.user_id', user.id)
      .single();

    if (imageError || !image) {
      return NextResponse.json(
        { error: 'Image not found or unauthorized' },
        { status: 404 }
      );
    }

    // If setting as primary, remove primary status from other images
    if (validatedData.isPrimary) {
      await supabase
        .from('vehicle_images')
        .update({ is_primary: false })
        .eq('vehicle_id', image.vehicle_id);
    }

    // Update image
    const updateData: any = {};
    if (validatedData.isPrimary !== undefined) {
      updateData.is_primary = validatedData.isPrimary;
    }
    if (validatedData.orderIndex !== undefined) {
      updateData.order_index = validatedData.orderIndex;
    }

    const { data: updatedImage, error: updateError } = await supabase
      .from('vehicle_images')
      .update(updateData)
      .eq('id', imageId)
      .select()
      .single();

    if (updateError) {
      console.error('Image update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      image: updatedImage,
      message: 'Image updated successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update image error:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const imageId = params.id;

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
      .eq('vehicles.user_id', user.id)
      .single();

    if (imageError || !image) {
      return NextResponse.json(
        { error: 'Image not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete from Cloudinary first
    let cloudinaryDeleted = false;
    if (image.cloudinary_public_id) {
      cloudinaryDeleted = await cloudinaryService.deleteImage(image.cloudinary_public_id);
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
      console.error('Database delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete image from database' },
        { status: 500 }
      );
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

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      cloudinaryDeleted,
    });

  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}