import { CloudinaryService } from '@/ai/services/cloudinary.service';

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: 'auto' | 'auto:low' | 'auto:good' | 'auto:best' | number;
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
  progressive?: boolean;
  dpr?: number; // Device pixel ratio
  fetchFormat?: 'auto';
}

export interface OptimizationResult {
  originalUrl: string;
  optimizedUrl: string;
  cloudinaryPublicId: string;
  originalSize?: number;
  optimizedSize?: number;
  compressionRatio?: number;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
  processingTime: number;
  success: boolean;
  error?: string;
}

export interface ResponsiveImageSet {
  thumbnail: OptimizationResult;
  small: OptimizationResult;
  medium: OptimizationResult;
  large: OptimizationResult;
  original: OptimizationResult;
}

export class ImageOptimizationService {
  private cloudinaryService = new CloudinaryService();

  /**
   * Optimize a single image with specified parameters
   */
  async optimizeImage(
    imageUrl: string,
    vehicleFolder: string,
    options: OptimizationOptions = {}
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    
    try {
      const {
        maxWidth,
        maxHeight,
        quality = 'auto:best',
        format = 'auto',
        progressive = true,
        dpr = 1,
        fetchFormat = 'auto'
      } = options;

      const transformations = [];

      // Resize if dimensions specified
      if (maxWidth || maxHeight) {
        transformations.push({
          width: maxWidth,
          height: maxHeight,
          crop: 'limit', // Don't upscale, only downscale
          quality: quality,
          format: format,
          dpr: dpr.toString(),
          fetch_format: fetchFormat
        });
      } else {
        // Just apply quality and format optimization
        transformations.push({
          quality: quality,
          format: format,
          dpr: dpr.toString(),
          fetch_format: fetchFormat
        });
      }

      // Enable progressive loading for JPEG
      if (progressive && (format === 'jpg' || format === 'auto')) {
        transformations.push({ flags: 'progressive' });
      }

      const result = await this.cloudinaryService.uploadVehicleImage(
        imageUrl,
        `${vehicleFolder}/optimized`,
        transformations
      );

      const processingTime = Date.now() - startTime;

      return {
        originalUrl: imageUrl,
        optimizedUrl: result.url,
        cloudinaryPublicId: result.publicId,
        format: result.format || format.toString(),
        dimensions: {
          width: result.width || 0,
          height: result.height || 0,
        },
        processingTime,
        success: true,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Image optimization error:', error);
      
      return {
        originalUrl: imageUrl,
        optimizedUrl: '',
        cloudinaryPublicId: '',
        format: 'unknown',
        dimensions: { width: 0, height: 0 },
        processingTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create a responsive image set with multiple sizes
   */
  async createResponsiveImageSet(
    imageUrl: string,
    vehicleFolder: string
  ): Promise<ResponsiveImageSet> {
    const baseOptions: OptimizationOptions = {
      quality: 'auto:best',
      format: 'webp',
      progressive: true,
      fetchFormat: 'auto',
    };

    const [thumbnail, small, medium, large, original] = await Promise.all([
      // Thumbnail (400x300)
      this.optimizeImage(imageUrl, vehicleFolder, {
        ...baseOptions,
        maxWidth: 400,
        maxHeight: 300,
        quality: 'auto:good',
      }),
      
      // Small (800x600)
      this.optimizeImage(imageUrl, vehicleFolder, {
        ...baseOptions,
        maxWidth: 800,
        maxHeight: 600,
      }),
      
      // Medium (1200x900)
      this.optimizeImage(imageUrl, vehicleFolder, {
        ...baseOptions,
        maxWidth: 1200,
        maxHeight: 900,
      }),
      
      // Large (1920x1440)
      this.optimizeImage(imageUrl, vehicleFolder, {
        ...baseOptions,
        maxWidth: 1920,
        maxHeight: 1440,
      }),
      
      // Original (no resize, just format optimization)
      this.optimizeImage(imageUrl, vehicleFolder, baseOptions),
    ]);

    return { thumbnail, small, medium, large, original };
  }

  /**
   * Optimize for specific use cases
   */
  async optimizeForUseCase(
    imageUrl: string,
    vehicleFolder: string,
    useCase: 'web' | 'mobile' | 'print' | 'social' | 'email'
  ): Promise<OptimizationResult> {
    const useCaseConfigs: Record<'web' | 'mobile' | 'print' | 'social' | 'email', OptimizationOptions> = {
      web: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 'auto:best',
        format: 'webp' as const,
        progressive: true,
      },
      mobile: {
        maxWidth: 800,
        maxHeight: 600,
        quality: 'auto:good',
        format: 'webp' as const,
        dpr: 2, // For retina displays
      },
      print: {
        quality: 100,
        format: 'png' as const,
        progressive: false,
      },
      social: {
        maxWidth: 1080,
        maxHeight: 1080,
        quality: 'auto:best',
        format: 'jpg' as const,
        progressive: true,
      },
      email: {
        maxWidth: 600,
        maxHeight: 400,
        quality: 'auto:good',
        format: 'jpg' as const,
        progressive: false,
      },
    };

    return this.optimizeImage(
      imageUrl,
      vehicleFolder,
      useCaseConfigs[useCase]
    );
  }

  /**
   * Batch optimize multiple images
   */
  async batchOptimize(
    images: Array<{ url: string; id: string }>,
    vehicleFolder: string,
    options: OptimizationOptions = {}
  ): Promise<Array<OptimizationResult & { imageId: string }>> {
    const results = [];
    
    // Process in batches of 5 to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (image) => {
          const result = await this.optimizeImage(
            image.url,
            vehicleFolder,
            options
          );
          return { ...result, imageId: image.id };
        })
      );
      
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < images.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  }

  /**
   * Generate WebP and AVIF variants for modern browsers
   */
  async generateModernFormats(
    imageUrl: string,
    vehicleFolder: string,
    options: OptimizationOptions = {}
  ): Promise<{
    webp: OptimizationResult;
    avif: OptimizationResult;
    fallback: OptimizationResult;
  }> {
    const baseOptions = {
      maxWidth: options.maxWidth || 1920,
      maxHeight: options.maxHeight || 1080,
      quality: options.quality || 'auto:best',
      progressive: true,
    };

    const [webp, avif, fallback] = await Promise.all([
      // WebP variant
      this.optimizeImage(imageUrl, vehicleFolder, {
        ...baseOptions,
        format: 'webp',
      }),
      
      // AVIF variant (most modern, best compression)
      this.optimizeImage(imageUrl, vehicleFolder, {
        ...baseOptions,
        format: 'avif',
      }),
      
      // JPEG fallback
      this.optimizeImage(imageUrl, vehicleFolder, {
        ...baseOptions,
        format: 'jpg',
      }),
    ]);

    return { webp, avif, fallback };
  }

  /**
   * Generate srcset string for responsive images
   */
  generateSrcSet(responsiveSet: ResponsiveImageSet): string {
    const srcsetEntries = [
      `${responsiveSet.thumbnail.optimizedUrl} 400w`,
      `${responsiveSet.small.optimizedUrl} 800w`,
      `${responsiveSet.medium.optimizedUrl} 1200w`,
      `${responsiveSet.large.optimizedUrl} 1920w`,
    ];

    return srcsetEntries.join(', ');
  }

  /**
   * Generate picture element HTML with modern format support
   */
  generatePictureElement(
    modernFormats: {
      webp: OptimizationResult;
      avif: OptimizationResult;
      fallback: OptimizationResult;
    },
    alt: string,
    className?: string
  ): string {
    return `
      <picture${className ? ` class="${className}"` : ''}>
        <source srcset="${modernFormats.avif.optimizedUrl}" type="image/avif">
        <source srcset="${modernFormats.webp.optimizedUrl}" type="image/webp">
        <img src="${modernFormats.fallback.optimizedUrl}" alt="${alt}" loading="lazy">
      </picture>
    `.trim();
  }

  /**
   * Calculate optimization metrics
   */
  calculateOptimizationMetrics(results: OptimizationResult[]): {
    totalOriginalSize: number;
    totalOptimizedSize: number;
    averageCompressionRatio: number;
    totalSavings: number;
    successRate: number;
  } {
    const successful = results.filter(r => r.success);
    const totalOriginalSize = successful.reduce((sum, r) => sum + (r.originalSize || 0), 0);
    const totalOptimizedSize = successful.reduce((sum, r) => sum + (r.optimizedSize || 0), 0);
    
    return {
      totalOriginalSize,
      totalOptimizedSize,
      averageCompressionRatio: totalOriginalSize > 0 ? totalOptimizedSize / totalOriginalSize : 0,
      totalSavings: totalOriginalSize - totalOptimizedSize,
      successRate: results.length > 0 ? successful.length / results.length : 0,
    };
  }

  /**
   * Get optimization recommendations based on image characteristics
   */
  getOptimizationRecommendations(
    imageInfo: {
      width: number;
      height: number;
      format: string;
      size: number;
      usage: 'hero' | 'gallery' | 'thumbnail' | 'social';
    }
  ): OptimizationOptions {
    const { width, height, format, size, usage } = imageInfo;
    
    const recommendations: OptimizationOptions = {
      format: 'auto',
      quality: 'auto:best',
      progressive: true,
      fetchFormat: 'auto',
    };

    // Size-based recommendations
    if (size > 5 * 1024 * 1024) { // > 5MB
      recommendations.quality = 'auto:good';
      recommendations.format = 'webp';
    }

    // Dimension-based recommendations
    if (width > 3000 || height > 3000) {
      recommendations.maxWidth = 2400;
      recommendations.maxHeight = 1800;
    }

    // Usage-specific recommendations
    switch (usage) {
      case 'hero':
        recommendations.maxWidth = 1920;
        recommendations.maxHeight = 1080;
        recommendations.quality = 'auto:best';
        break;
      case 'gallery':
        recommendations.maxWidth = 1200;
        recommendations.maxHeight = 900;
        recommendations.quality = 'auto:best';
        break;
      case 'thumbnail':
        recommendations.maxWidth = 400;
        recommendations.maxHeight = 300;
        recommendations.quality = 'auto:good';
        break;
      case 'social':
        recommendations.maxWidth = 1080;
        recommendations.maxHeight = 1080;
        recommendations.quality = 'auto:best';
        break;
    }

    return recommendations;
  }
}