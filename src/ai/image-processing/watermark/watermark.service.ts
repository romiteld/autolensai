import { CloudinaryService } from '@/ai/services/cloudinary.service';

export interface WatermarkOptions {
  text?: string;
  logoUrl?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' | 'bottom-center' | 'top-center';
  opacity?: number; // 0-100
  size?: number; // Scale factor
  color?: string; // For text watermarks
  font?: string; // For text watermarks
  padding?: number; // Distance from edges
}

export interface WatermarkResult {
  originalUrl: string;
  watermarkedUrl: string;
  cloudinaryPublicId: string;
  watermarkType: 'text' | 'logo';
  position: string;
  processingTime: number;
  success: boolean;
  error?: string;
}

export class WatermarkService {
  private cloudinaryService = new CloudinaryService();

  /**
   * Add text watermark to an image
   */
  async addTextWatermark(
    imageUrl: string,
    vehicleFolder: string,
    text: string,
    options: WatermarkOptions = {}
  ): Promise<WatermarkResult> {
    const startTime = Date.now();
    
    try {
      const {
        position = 'bottom-right',
        opacity = 70,
        size = 40,
        color = 'white',
        font = 'Arial',
        padding = 20
      } = options;

      // Convert position to Cloudinary gravity and coordinates
      const { gravity, x, y } = this.getPositionCoordinates(position, padding);

      const transformations = [
        {
          overlay: {
            text: text,
            font_family: font,
            font_size: size,
            font_weight: 'bold',
            color: color,
          },
          gravity,
          x,
          y,
          opacity,
        },
        { quality: 'auto:best', format: 'auto' }
      ];

      const result = await this.cloudinaryService.uploadVehicleImage(
        imageUrl,
        `${vehicleFolder}/watermarked`,
        transformations
      );

      const processingTime = Date.now() - startTime;

      return {
        originalUrl: imageUrl,
        watermarkedUrl: result.url,
        cloudinaryPublicId: result.publicId,
        watermarkType: 'text',
        position,
        processingTime,
        success: true,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Text watermark error:', error);
      
      return {
        originalUrl: imageUrl,
        watermarkedUrl: '',
        cloudinaryPublicId: '',
        watermarkType: 'text',
        position: options.position || 'bottom-right',
        processingTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Add logo watermark to an image
   */
  async addLogoWatermark(
    imageUrl: string,
    vehicleFolder: string,
    logoUrl: string,
    options: WatermarkOptions = {}
  ): Promise<WatermarkResult> {
    const startTime = Date.now();
    
    try {
      const {
        position = 'bottom-right',
        opacity = 80,
        size = 0.15, // 15% of image size
        padding = 20
      } = options;

      // Convert position to Cloudinary gravity and coordinates
      const { gravity, x, y } = this.getPositionCoordinates(position, padding);

      const transformations = [
        {
          overlay: logoUrl,
          gravity,
          x,
          y,
          opacity,
          width: `${size * 100}%`,
          flags: 'relative',
        },
        { quality: 'auto:best', format: 'auto' }
      ];

      const result = await this.cloudinaryService.uploadVehicleImage(
        imageUrl,
        `${vehicleFolder}/watermarked`,
        transformations
      );

      const processingTime = Date.now() - startTime;

      return {
        originalUrl: imageUrl,
        watermarkedUrl: result.url,
        cloudinaryPublicId: result.publicId,
        watermarkType: 'logo',
        position,
        processingTime,
        success: true,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Logo watermark error:', error);
      
      return {
        originalUrl: imageUrl,
        watermarkedUrl: '',
        cloudinaryPublicId: '',
        watermarkType: 'logo',
        position: options.position || 'bottom-right',
        processingTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Add dealership branding watermark with logo and text
   */
  async addDealershipWatermark(
    imageUrl: string,
    vehicleFolder: string,
    dealershipName: string,
    logoUrl?: string,
    options: WatermarkOptions = {}
  ): Promise<WatermarkResult> {
    const {
      position = 'bottom-right',
      opacity = 75,
      color = 'white',
      padding = 20
    } = options;

    if (logoUrl) {
      // Use logo watermark for dealerships with logos
      return this.addLogoWatermark(imageUrl, vehicleFolder, logoUrl, {
        position,
        opacity,
        size: 0.12,
        padding,
      });
    } else {
      // Use text watermark for dealerships without logos
      return this.addTextWatermark(imageUrl, vehicleFolder, dealershipName, {
        position,
        opacity,
        size: 36,
        color,
        font: 'Arial',
        padding,
      });
    }
  }

  /**
   * Add copyright protection watermark
   */
  async addCopyrightWatermark(
    imageUrl: string,
    vehicleFolder: string,
    copyrightText?: string,
    options: WatermarkOptions = {}
  ): Promise<WatermarkResult> {
    const defaultCopyright = `© ${new Date().getFullYear()} AutoLensAI`;
    const text = copyrightText || defaultCopyright;

    return this.addTextWatermark(imageUrl, vehicleFolder, text, {
      position: 'bottom-left',
      opacity: 60,
      size: 24,
      color: 'white',
      font: 'Arial',
      padding: 15,
      ...options,
    });
  }

  /**
   * Add subtle website URL watermark
   */
  async addWebsiteWatermark(
    imageUrl: string,
    vehicleFolder: string,
    websiteUrl: string,
    options: WatermarkOptions = {}
  ): Promise<WatermarkResult> {
    return this.addTextWatermark(imageUrl, vehicleFolder, websiteUrl, {
      position: 'bottom-center',
      opacity: 50,
      size: 28,
      color: 'white',
      font: 'Arial',
      padding: 20,
      ...options,
    });
  }

  /**
   * Batch add watermarks to multiple images
   */
  async batchWatermark(
    images: Array<{ url: string; id: string }>,
    vehicleFolder: string,
    watermarkType: 'text' | 'logo',
    watermarkContent: string, // Text or logo URL
    options: WatermarkOptions = {}
  ): Promise<Array<WatermarkResult & { imageId: string }>> {
    const results = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (image) => {
          let result: WatermarkResult;
          
          if (watermarkType === 'text') {
            result = await this.addTextWatermark(
              image.url,
              vehicleFolder,
              watermarkContent,
              options
            );
          } else {
            result = await this.addLogoWatermark(
              image.url,
              vehicleFolder,
              watermarkContent,
              options
            );
          }
          
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
   * Create a transparent watermark overlay for future use
   */
  async createWatermarkOverlay(
    text: string,
    options: {
      width?: number;
      height?: number;
      fontSize?: number;
      color?: string;
      font?: string;
      backgroundColor?: string;
    } = {}
  ): Promise<{ overlayUrl: string; publicId: string }> {
    try {
      const {
        width = 400,
        height = 100,
        fontSize = 36,
        color = 'white',
        font = 'Arial',
        backgroundColor = 'transparent'
      } = options;

      // Create a transparent image with text
      const transformations = [
        {
          width,
          height,
          background: backgroundColor,
          crop: 'pad',
          color,
          overlay: {
            text: text,
            font_family: font,
            font_size: fontSize,
            font_weight: 'bold',
          },
          gravity: 'center',
        },
        { format: 'png' } // PNG supports transparency
      ];

      // Create a base transparent image and add text
      const result = await this.cloudinaryService.uploadVehicleImage(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // 1x1 transparent PNG
        'watermarks/overlays',
        transformations
      );

      return {
        overlayUrl: result.url,
        publicId: result.publicId,
      };
    } catch (error) {
      console.error('Watermark overlay creation error:', error);
      throw error;
    }
  }

  /**
   * Remove watermark from image (for premium users)
   */
  async removeWatermark(
    watermarkedImageUrl: string,
    vehicleFolder: string
  ): Promise<{ success: boolean; cleanUrl?: string; error?: string }> {
    try {
      // This would use AI-powered watermark removal
      // For now, we'll use Cloudinary's restoration features
      const transformations = [
        { effect: 'improve' },
        { effect: 'restore' },
        { quality: 'auto:best', format: 'auto' }
      ];

      const result = await this.cloudinaryService.uploadVehicleImage(
        watermarkedImageUrl,
        `${vehicleFolder}/unwatermarked`,
        transformations
      );

      return {
        success: true,
        cleanUrl: result.url,
      };
    } catch (error) {
      console.error('Watermark removal error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Convert position string to Cloudinary coordinates
   */
  private getPositionCoordinates(
    position: string,
    padding: number
  ): { gravity: string; x: number; y: number } {
    const positionMap = {
      'top-left': { gravity: 'north_west', x: padding, y: padding },
      'top-center': { gravity: 'north', x: 0, y: padding },
      'top-right': { gravity: 'north_east', x: -padding, y: padding },
      'center': { gravity: 'center', x: 0, y: 0 },
      'bottom-left': { gravity: 'south_west', x: padding, y: -padding },
      'bottom-center': { gravity: 'south', x: 0, y: -padding },
      'bottom-right': { gravity: 'south_east', x: -padding, y: -padding },
    };

    return positionMap[position as keyof typeof positionMap] || positionMap['bottom-right'];
  }

  /**
   * Generate watermark recommendations based on image characteristics
   */
  getWatermarkRecommendations(
    imageInfo: {
      width: number;
      height: number;
      brightness: number;
      dominantColors: string[];
    },
    purpose: 'protection' | 'branding' | 'attribution'
  ): WatermarkOptions {
    const { width, height, brightness, dominantColors } = imageInfo;
    
    // Determine optimal color based on image brightness
    const textColor = brightness > 128 ? 'black' : 'white';
    
    // Determine optimal size based on image dimensions
    const size = Math.max(24, Math.min(48, width * 0.025));
    
    // Determine optimal opacity based on purpose
    const opacity = purpose === 'protection' ? 75 : purpose === 'branding' ? 60 : 50;
    
    // Determine optimal position based on image characteristics
    let position: WatermarkOptions['position'] = 'bottom-right';
    if (dominantColors.includes('white') && brightness > 150) {
      position = 'bottom-left'; // Avoid light areas
    }

    return {
      color: textColor,
      size,
      opacity,
      position,
      padding: Math.max(15, width * 0.01),
      font: 'Arial',
    };
  }
}