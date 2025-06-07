// Image Processing Services
import { BackgroundRemovalService } from './background-removal/background-removal.service';
import { ImageEnhancementService } from './enhancement/image-enhancement.service';
import { ImageOptimizationService } from './optimization/image-optimization.service';
import { WatermarkService } from './watermark/watermark.service';

export {
  BackgroundRemovalService,
  ImageEnhancementService,
  ImageOptimizationService,
  WatermarkService
};
export type {
  BackgroundRemovalOptions,
  BackgroundRemovalResult
} from './background-removal/background-removal.service';
export type {
  EnhancementOptions,
  EnhancementResult
} from './enhancement/image-enhancement.service';
export type {
  OptimizationOptions,
  OptimizationResult,
  ResponsiveImageSet
} from './optimization/image-optimization.service';
export type {
  WatermarkOptions,
  WatermarkResult
} from './watermark/watermark.service';

// Unified Image Processing Service
export class ImageProcessingService {
  public backgroundRemoval = new BackgroundRemovalService();
  public enhancement = new ImageEnhancementService();
  public optimization = new ImageOptimizationService();
  public watermark = new WatermarkService();

  /**
   * Complete vehicle image processing pipeline
   */
  async processVehicleImage(
    imageUrl: string,
    vehicleFolder: string,
    options: {
      removeBackground?: boolean;
      enhance?: boolean;
      optimize?: boolean;
      addWatermark?: boolean;
      watermarkText?: string;
      backgroundPrompt?: string;
    } = {}
  ) {
    const {
      removeBackground = true,
      enhance = true,
      optimize = true,
      addWatermark = false,
      watermarkText,
      backgroundPrompt = 'luxury car showroom background'
    } = options;

    const results = {
      original: imageUrl,
      processed: imageUrl,
      backgroundRemoved: null as any,
      enhanced: null as any,
      optimized: null as any,
      watermarked: null as any,
      processingSteps: [] as string[],
    };

    let currentUrl = imageUrl;

    try {
      // Step 1: Background removal
      if (removeBackground) {
        const bgResult = await this.backgroundRemoval.removeAndReplaceBackground(
          currentUrl,
          vehicleFolder,
          backgroundPrompt
        );
        
        if (bgResult.success) {
          currentUrl = bgResult.processedUrl;
          results.backgroundRemoved = bgResult;
          results.processingSteps.push('Background Removal');
        }
      }

      // Step 2: Enhancement
      if (enhance) {
        const enhanceResult = await this.enhancement.enhanceVehicleImage(
          currentUrl,
          vehicleFolder,
          {
            autoImprove: true,
            contrast: 15,
            saturation: 15,
            sharpness: 45,
            removeNoise: true,
          }
        );
        
        if (enhanceResult.success) {
          currentUrl = enhanceResult.enhancedUrl;
          results.enhanced = enhanceResult;
          results.processingSteps.push('Enhancement');
        }
      }

      // Step 3: Optimization
      if (optimize) {
        const optimizeResult = await this.optimization.optimizeImage(
          currentUrl,
          vehicleFolder,
          {
            quality: 'auto:best',
            format: 'webp',
            progressive: true,
          }
        );
        
        if (optimizeResult.success) {
          currentUrl = optimizeResult.optimizedUrl;
          results.optimized = optimizeResult;
          results.processingSteps.push('Optimization');
        }
      }

      // Step 4: Watermark (optional)
      if (addWatermark && watermarkText) {
        const watermarkResult = await this.watermark.addTextWatermark(
          currentUrl,
          vehicleFolder,
          watermarkText,
          {
            position: 'bottom-right',
            opacity: 70,
            size: 32,
            color: 'white',
          }
        );
        
        if (watermarkResult.success) {
          currentUrl = watermarkResult.watermarkedUrl;
          results.watermarked = watermarkResult;
          results.processingSteps.push('Watermark');
        }
      }

      results.processed = currentUrl;
      return results;
    } catch (error) {
      console.error('Image processing pipeline error:', error);
      throw error;
    }
  }

  /**
   * Create a complete set of image variants for a vehicle
   */
  async createVehicleImageSet(
    imageUrl: string,
    vehicleFolder: string
  ) {
    const [
      responsiveSet,
      modernFormats,
      enhancedVariants,
      backgroundRemoved
    ] = await Promise.all([
      this.optimization.createResponsiveImageSet(imageUrl, vehicleFolder),
      this.optimization.generateModernFormats(imageUrl, vehicleFolder),
      this.enhancement.createImageVariants(imageUrl, vehicleFolder),
      this.backgroundRemoval.removeBackground(imageUrl, vehicleFolder)
    ]);

    return {
      responsive: responsiveSet,
      modernFormats,
      enhanced: enhancedVariants,
      backgroundRemoved,
    };
  }
}