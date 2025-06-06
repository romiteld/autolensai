import { CloudinaryService } from '@/ai/services/cloudinary.service';
import type { VehicleImage } from '@/vehicle/models/vehicle.model';

export interface BackgroundRemovalOptions {
  prompt?: string;
  quality?: 'auto' | 'auto:low' | 'auto:good' | 'auto:best';
  format?: 'auto' | 'webp' | 'png' | 'jpg';
  outputSize?: {
    width: number;
    height: number;
  };
}

export interface BackgroundRemovalResult {
  originalUrl: string;
  processedUrl: string;
  cloudinaryPublicId: string;
  processingTime: number;
  success: boolean;
  error?: string;
}

export class BackgroundRemovalService {
  private cloudinaryService = new CloudinaryService();

  /**
   * Remove background from a vehicle image using Cloudinary AI
   */
  async removeBackground(
    imageUrl: string,
    vehicleFolder: string,
    options: BackgroundRemovalOptions = {}
  ): Promise<BackgroundRemovalResult> {
    const startTime = Date.now();
    
    try {
      const {
        prompt = 'car background,hint_automotive',
        quality = 'auto:best',
        format = 'auto',
        outputSize
      } = options;

      const transformations = [
        { effect: `gen_remove:prompt_${prompt}` },
        { quality, format },
        ...(outputSize ? [{ width: outputSize.width, height: outputSize.height, crop: 'pad', gravity: 'center' }] : [])
      ];

      const result = await this.cloudinaryService.uploadVehicleImage(
        imageUrl,
        `${vehicleFolder}/background-removed`,
        transformations
      );

      const processingTime = Date.now() - startTime;

      return {
        originalUrl: imageUrl,
        processedUrl: result.url,
        cloudinaryPublicId: result.publicId,
        processingTime,
        success: true,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Background removal error:', error);
      
      return {
        originalUrl: imageUrl,
        processedUrl: '',
        cloudinaryPublicId: '',
        processingTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Remove background and replace with custom background
   */
  async removeAndReplaceBackground(
    imageUrl: string,
    vehicleFolder: string,
    backgroundPrompt: string,
    options: BackgroundRemovalOptions = {}
  ): Promise<BackgroundRemovalResult> {
    const startTime = Date.now();
    
    try {
      const {
        quality = 'auto:best',
        format = 'auto',
        outputSize
      } = options;

      const transformations = [
        { effect: 'gen_remove:prompt_car background,hint_automotive' },
        { effect: `gen_fill:prompt_${backgroundPrompt}` },
        { quality, format },
        ...(outputSize ? [{ width: outputSize.width, height: outputSize.height, crop: 'pad', gravity: 'center' }] : [])
      ];

      const result = await this.cloudinaryService.uploadVehicleImage(
        imageUrl,
        `${vehicleFolder}/background-replaced`,
        transformations
      );

      const processingTime = Date.now() - startTime;

      return {
        originalUrl: imageUrl,
        processedUrl: result.url,
        cloudinaryPublicId: result.publicId,
        processingTime,
        success: true,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Background replacement error:', error);
      
      return {
        originalUrl: imageUrl,
        processedUrl: '',
        cloudinaryPublicId: '',
        processingTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Batch process multiple images for background removal
   */
  async batchRemoveBackground(
    images: VehicleImage[],
    vehicleFolder: string,
    options: BackgroundRemovalOptions = {}
  ): Promise<BackgroundRemovalResult[]> {
    const results: BackgroundRemovalResult[] = [];
    
    // Process images sequentially to avoid rate limits
    for (const image of images) {
      try {
        const result = await this.removeBackground(
          image.originalUrl,
          vehicleFolder,
          options
        );
        results.push(result);
        
        // Add small delay between processing to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to process image ${image.id}:`, error);
        results.push({
          originalUrl: image.originalUrl,
          processedUrl: '',
          cloudinaryPublicId: '',
          processingTime: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }
    
    return results;
  }

  /**
   * Create a transparent background version optimized for overlays
   */
  async createTransparentVersion(
    imageUrl: string,
    vehicleFolder: string,
    options: BackgroundRemovalOptions = {}
  ): Promise<BackgroundRemovalResult> {
    return this.removeBackground(
      imageUrl,
      vehicleFolder,
      {
        ...options,
        format: 'png', // PNG supports transparency
        quality: 'auto:best',
      }
    );
  }

  /**
   * Get processing quality recommendations based on image size and usage
   */
  getQualityRecommendations(imageWidth: number, imageHeight: number, usage: 'thumbnail' | 'gallery' | 'hero' | 'print') {
    const area = imageWidth * imageHeight;
    
    switch (usage) {
      case 'thumbnail':
        return {
          quality: 'auto:good' as const,
          outputSize: { width: 400, height: 300 },
          format: 'webp' as const,
        };
      case 'gallery':
        return {
          quality: 'auto:best' as const,
          outputSize: area > 2000000 ? { width: 1200, height: 900 } : undefined,
          format: 'webp' as const,
        };
      case 'hero':
        return {
          quality: 'auto:best' as const,
          outputSize: { width: 1920, height: 1080 },
          format: 'webp' as const,
        };
      case 'print':
        return {
          quality: 'auto:best' as const,
          format: 'png' as const,
        };
      default:
        return {
          quality: 'auto:best' as const,
          format: 'auto' as const,
        };
    }
  }
}