import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/core/config/env';

export interface CloudinaryTransformation {
  effect?: string;
  quality?: string;
  format?: string;
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
}

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: env.get('CLOUDINARY_CLOUD_NAME'),
      api_key: env.get('CLOUDINARY_API_KEY'),
      api_secret: env.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadVehicleImage(
    imagePath: string,
    folder: string,
    transformations?: CloudinaryTransformation[]
  ) {
    try {
      const automotiveTransformations = [
        { effect: 'gen_remove:prompt_car background,hint_automotive' },
        { effect: 'gen_fill:prompt_luxury car showroom background' },
        { quality: 'auto:best', format: 'auto' },
        { width: 1920, height: 1080, crop: 'pad', gravity: 'center' },
      ];

      const finalTransformations = transformations !== undefined 
        ? (transformations.length > 0 ? transformations : [{ quality: 'auto:best', format: 'auto' }])
        : automotiveTransformations;

      const result = await cloudinary.uploader.upload(imagePath, {
        folder,
        transformation: finalTransformations,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      });

      return {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  async removeBackground(imageUrl: string, folder: string) {
    return this.uploadVehicleImage(imageUrl, folder, [
      { effect: 'gen_remove:prompt_car background,hint_automotive' },
      { quality: 'auto:best', format: 'auto' },
    ]);
  }

  async enhanceVehicleImage(imageUrl: string, folder: string) {
    return this.uploadVehicleImage(imageUrl, folder, [
      { effect: 'gen_remove:prompt_car background,hint_automotive' },
      { effect: 'gen_fill:prompt_luxury car showroom background' },
      { effect: 'improve' },
      { effect: 'sharpen:100' },
      { quality: 'auto:best', format: 'auto' },
      { width: 1920, height: 1080, crop: 'pad', gravity: 'center' },
    ]);
  }

  async createThumbnail(publicId: string, width = 400, height = 300) {
    return cloudinary.url(publicId, {
      transformation: [
        { width, height, crop: 'fill', gravity: 'auto' },
        { quality: 'auto', format: 'auto' },
      ],
    });
  }

  async deleteImage(publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  generateOptimizedUrl(publicId: string, options?: CloudinaryTransformation) {
    const defaultOptions = {
      quality: 'auto',
      format: 'auto',
      dpr: 'auto',
      responsive: true,
      width: 'auto',
    };

    return cloudinary.url(publicId, {
      transformation: [{ ...defaultOptions, ...options }],
    });
  }
}