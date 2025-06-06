import { CloudinaryService } from '@/ai/services/cloudinary.service';
import type { VehicleImage } from '@/vehicle/models/vehicle.model';

export interface EnhancementOptions {
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
  sharpness?: number; // 0 to 100
  quality?: 'auto' | 'auto:low' | 'auto:good' | 'auto:best';
  format?: 'auto' | 'webp' | 'png' | 'jpg';
  removeNoise?: boolean;
  autoImprove?: boolean;
  hdr?: boolean;
}

export interface EnhancementResult {
  originalUrl: string;
  enhancedUrl: string;
  cloudinaryPublicId: string;
  appliedEffects: string[];
  processingTime: number;
  success: boolean;
  error?: string;
}

export class ImageEnhancementService {
  private cloudinaryService = new CloudinaryService();

  /**
   * Enhance a vehicle image with automotive-specific optimizations
   */
  async enhanceVehicleImage(
    imageUrl: string,
    vehicleFolder: string,
    options: EnhancementOptions = {}
  ): Promise<EnhancementResult> {
    const startTime = Date.now();
    
    try {
      const {
        brightness = 0,
        contrast = 10,
        saturation = 15,
        sharpness = 50,
        quality = 'auto:best',
        format = 'auto',
        removeNoise = true,
        autoImprove = true,
        hdr = false
      } = options;

      const transformations = [];
      const appliedEffects: string[] = [];

      // Auto improvement first (works well for automotive images)
      if (autoImprove) {
        transformations.push({ effect: 'improve' });
        appliedEffects.push('Auto Improve');
      }

      // HDR effect for better dynamic range
      if (hdr) {
        transformations.push({ effect: 'hdr' });
        appliedEffects.push('HDR');
      }

      // Color adjustments
      if (brightness !== 0) {
        transformations.push({ effect: `brightness:${brightness}` });
        appliedEffects.push(`Brightness: ${brightness > 0 ? '+' : ''}${brightness}`);
      }

      if (contrast !== 0) {
        transformations.push({ effect: `contrast:${contrast}` });
        appliedEffects.push(`Contrast: ${contrast > 0 ? '+' : ''}${contrast}`);
      }

      if (saturation !== 0) {
        transformations.push({ effect: `saturation:${saturation}` });
        appliedEffects.push(`Saturation: ${saturation > 0 ? '+' : ''}${saturation}`);
      }

      // Sharpening (important for automotive details)
      if (sharpness > 0) {
        transformations.push({ effect: `sharpen:${sharpness}` });
        appliedEffects.push(`Sharpen: ${sharpness}`);
      }

      // Noise reduction
      if (removeNoise) {
        transformations.push({ effect: 'noise' });
        appliedEffects.push('Noise Reduction');
      }

      // Quality and format optimization
      transformations.push({ quality, format });

      const result = await this.cloudinaryService.uploadVehicleImage(
        imageUrl,
        `${vehicleFolder}/enhanced`,
        transformations
      );

      const processingTime = Date.now() - startTime;

      return {
        originalUrl: imageUrl,
        enhancedUrl: result.url,
        cloudinaryPublicId: result.publicId,
        appliedEffects,
        processingTime,
        success: true,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Image enhancement error:', error);
      
      return {
        originalUrl: imageUrl,
        enhancedUrl: '',
        cloudinaryPublicId: '',
        appliedEffects: [],
        processingTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create multiple variants of an image for different use cases
   */
  async createImageVariants(
    imageUrl: string,
    vehicleFolder: string
  ): Promise<{
    thumbnail: EnhancementResult;
    gallery: EnhancementResult;
    hero: EnhancementResult;
    social: EnhancementResult;
  }> {
    const baseOptions: EnhancementOptions = {
      autoImprove: true,
      contrast: 15,
      saturation: 10,
      sharpness: 30,
      removeNoise: true,
    };

    const [thumbnail, gallery, hero, social] = await Promise.all([
      // Thumbnail variant (400x300)
      this.enhanceVehicleImage(imageUrl, vehicleFolder, {
        ...baseOptions,
        quality: 'auto:good',
        format: 'webp',
      }),
      
      // Gallery variant (1200x900)
      this.enhanceVehicleImage(imageUrl, vehicleFolder, {
        ...baseOptions,
        quality: 'auto:best',
        format: 'webp',
        sharpness: 50,
      }),
      
      // Hero variant (1920x1080)
      this.enhanceVehicleImage(imageUrl, vehicleFolder, {
        ...baseOptions,
        quality: 'auto:best',
        format: 'webp',
        hdr: true,
        contrast: 20,
        saturation: 20,
      }),
      
      // Social media variant (1080x1080)
      this.enhanceVehicleImage(imageUrl, vehicleFolder, {
        ...baseOptions,
        quality: 'auto:best',
        format: 'webp',
        saturation: 25,
        contrast: 25,
      }),
    ]);

    return { thumbnail, gallery, hero, social };
  }

  /**
   * Batch enhance multiple images with consistent settings
   */
  async batchEnhanceImages(
    images: VehicleImage[],
    vehicleFolder: string,
    options: EnhancementOptions = {}
  ): Promise<EnhancementResult[]> {
    const results: EnhancementResult[] = [];
    
    // Process images sequentially to avoid rate limits
    for (const image of images) {
      try {
        const result = await this.enhanceVehicleImage(
          image.originalUrl,
          vehicleFolder,
          options
        );
        results.push(result);
        
        // Add small delay between processing
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to enhance image ${image.id}:`, error);
        results.push({
          originalUrl: image.originalUrl,
          enhancedUrl: '',
          cloudinaryPublicId: '',
          appliedEffects: [],
          processingTime: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }
    
    return results;
  }

  /**
   * Apply automotive-specific color grading
   */
  async applyAutomotiveColorGrading(
    imageUrl: string,
    vehicleFolder: string,
    style: 'luxury' | 'sporty' | 'classic' | 'modern' = 'modern'
  ): Promise<EnhancementResult> {
    const stylePresets = {
      luxury: {
        brightness: 5,
        contrast: 20,
        saturation: 5,
        sharpness: 40,
        hdr: true,
        autoImprove: true,
      },
      sporty: {
        brightness: -5,
        contrast: 30,
        saturation: 25,
        sharpness: 60,
        hdr: false,
        autoImprove: true,
      },
      classic: {
        brightness: 10,
        contrast: 15,
        saturation: -10,
        sharpness: 30,
        hdr: false,
        autoImprove: false,
      },
      modern: {
        brightness: 0,
        contrast: 15,
        saturation: 15,
        sharpness: 45,
        hdr: true,
        autoImprove: true,
      },
    };

    return this.enhanceVehicleImage(
      imageUrl,
      vehicleFolder,
      {
        ...stylePresets[style],
        quality: 'auto:best',
        format: 'webp',
        removeNoise: true,
      }
    );
  }

  /**
   * Create a comparison preview showing before/after
   */
  async createComparisonPreview(
    originalUrl: string,
    enhancedUrl: string,
    vehicleFolder: string
  ): Promise<{ comparisonUrl: string; publicId: string }> {
    try {
      // This would use Cloudinary's overlay feature to create a side-by-side comparison
      const comparisonTransformation = [
        { width: 800, height: 400, crop: 'fill' },
        { overlay: enhancedUrl, width: 400, height: 400, crop: 'fill', x: 200 },
        { quality: 'auto:best', format: 'webp' }
      ];

      const result = await this.cloudinaryService.uploadVehicleImage(
        originalUrl,
        `${vehicleFolder}/comparisons`,
        comparisonTransformation
      );

      return {
        comparisonUrl: result.url,
        publicId: result.publicId,
      };
    } catch (error) {
      console.error('Comparison preview creation error:', error);
      throw error;
    }
  }

  /**
   * Get enhancement recommendations based on image analysis
   */
  getEnhancementRecommendations(imageMetadata: {
    brightness?: number;
    contrast?: number;
    colors?: string[];
    quality?: number;
  }): EnhancementOptions {
    const recommendations: EnhancementOptions = {
      autoImprove: true,
      removeNoise: true,
      quality: 'auto:best',
      format: 'webp',
    };

    // Adjust based on detected brightness
    if (imageMetadata.brightness !== undefined) {
      if (imageMetadata.brightness < 30) {
        recommendations.brightness = 15;
        recommendations.contrast = 20;
      } else if (imageMetadata.brightness > 70) {
        recommendations.brightness = -10;
        recommendations.contrast = 10;
      }
    }

    // Adjust based on detected contrast
    if (imageMetadata.contrast !== undefined) {
      if (imageMetadata.contrast < 20) {
        recommendations.contrast = 25;
        recommendations.sharpness = 60;
      }
    }

    // Adjust saturation based on dominant colors
    if (imageMetadata.colors?.includes('gray') || imageMetadata.colors?.includes('black')) {
      recommendations.saturation = 20;
    } else if (imageMetadata.colors?.includes('red') || imageMetadata.colors?.includes('blue')) {
      recommendations.saturation = 10;
    }

    return recommendations;
  }
}