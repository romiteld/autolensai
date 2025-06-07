import { NextRequest, NextResponse } from 'next/server';
import { CloudinaryService } from '@/ai/services/cloudinary.service';
import { createSupabaseClient } from '@/core/database/supabase';
import { z } from 'zod';

const signedUploadSchema = z.object({
  folder: z.string().optional(),
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
    const validatedData = signedUploadSchema.parse(body);

    // Default folder structure
    const folder = validatedData.folder || `autolensai/users/${user.id}/vehicles`;

    // Generate signed upload parameters
    const signedUploadData = await cloudinaryService.generateSignedUploadUrl(folder);

    // If vehicleId is provided, verify ownership
    if (validatedData.vehicleId) {
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
    }

    // Log the upload request for audit purposes
    console.log(`Signed upload requested by user ${user.id} for folder: ${folder}`);

    return NextResponse.json({
      success: true,
      signedUpload: {
        ...signedUploadData,
        uploadUrl: `https://api.cloudinary.com/v1_1/${signedUploadData.cloudName}/image/upload`
      },
      // Additional client-side upload parameters
      uploadParams: {
        api_key: signedUploadData.apiKey,
        timestamp: signedUploadData.timestamp,
        signature: signedUploadData.signature,
        upload_preset: signedUploadData.uploadPreset,
        folder: signedUploadData.folder,
        // Additional security and processing parameters
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_file_size: 10485760, // 10MB
        quality: 'auto:best',
        fetch_format: 'auto',
        // Enable AI processing for automotive images
        transformation: [
          { effect: 'gen_remove:prompt_car background,hint_automotive' },
          { effect: 'improve' },
          { quality: 'auto:best', fetch_format: 'auto' }
        ]
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Signed upload error:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed upload URL' },
      { status: 500 }
    );
  }
}

// Get upload presets and configuration
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return upload configuration and limits based on user's subscription
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const subscriptionTier = profile?.subscription_tier || 'free';

    // Define upload limits based on subscription
    const uploadLimits = {
      free: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxImagesPerVehicle: 10,
        allowedFormats: ['jpg', 'jpeg', 'png'],
        aiProcessing: false
      },
      basic: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxImagesPerVehicle: 20,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        aiProcessing: true
      },
      premium: {
        maxFileSize: 25 * 1024 * 1024, // 25MB
        maxImagesPerVehicle: 50,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'tiff'],
        aiProcessing: true
      },
      enterprise: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxImagesPerVehicle: -1, // Unlimited
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'raw'],
        aiProcessing: true
      }
    };

    const userLimits = uploadLimits[subscriptionTier as keyof typeof uploadLimits] || uploadLimits.free;

    return NextResponse.json({
      uploadLimits: userLimits,
      subscriptionTier,
      cloudinaryConfig: {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: 'auto_gen_vehicles'
      },
      processingOptions: {
        backgroundRemoval: userLimits.aiProcessing,
        generativeFill: userLimits.aiProcessing,
        autoEnhancement: userLimits.aiProcessing,
        watermarking: subscriptionTier !== 'free',
        socialCardGeneration: userLimits.aiProcessing
      }
    });

  } catch (error) {
    console.error('Upload configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to get upload configuration' },
      { status: 500 }
    );
  }
}