import { v2 as cloudinary, TransformationOptions } from 'cloudinary';
import { env } from '@/core/config/env';

export interface CloudinaryTransformation {
  effect?: string;
  quality?: string;
  format?: string;
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
  overlay?: any;
  background?: string;
  color?: string;
  opacity?: number;
  x?: number;
  y?: number;
}

export interface TextOverlayOptions {
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  background?: string;
  gravity?: string;
  x?: number;
  y?: number;
  width?: number;
  textAlign?: string;
}

export interface BrandOverlayOptions {
  watermarkId: string;
  gravity?: string;
  x?: number;
  y?: number;
  width?: number;
  opacity?: number;
  effect?: string;
}

export interface GenerativeAIOptions {
  backgroundRemoval?: {
    prompt?: string;
    hint?: string;
  };
  generativeFill?: {
    prompt?: string;
    width?: number;
    height?: number;
  };
  objectReplacement?: {
    from: string;
    to: string;
    prompt?: string;
  };
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

  // Generative AI Background Removal
  async removeBackgroundWithAI(publicId: string, options?: GenerativeAIOptions['backgroundRemoval']) {
    const prompt = options?.prompt || 'car background';
    const hint = options?.hint || 'automotive';
    
    return cloudinary.url(publicId, {
      transformation: [
        { effect: `gen_remove:prompt_${prompt},hint_${hint}` },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });
  }

  // Generative Fill for Background
  async generativeFillBackground(publicId: string, options?: GenerativeAIOptions['generativeFill']) {
    const prompt = options?.prompt || 'luxury car showroom background';
    const width = options?.width || 1200;
    const height = options?.height || 800;
    
    return cloudinary.url(publicId, {
      transformation: [
        { width, height, crop: 'fill' },
        { effect: `gen_fill:prompt_${prompt}` },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });
  }

  // Object Replacement with AI
  async replaceObjectWithAI(publicId: string, options: GenerativeAIOptions['objectReplacement']) {
    if (!options?.from || !options?.to) {
      throw new Error('Both from and to parameters are required for object replacement');
    }
    
    const prompt = options.prompt ? `;prompt_${options.prompt}` : '';
    
    return cloudinary.url(publicId, {
      transformation: [
        { effect: `gen_replace:from_${options.from};to_${options.to}${prompt}` },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });
  }

  // Complete Automotive Enhancement Pipeline
  async enhanceVehicleWithAI(publicId: string, includeBackground: boolean = true) {
    const transformations: any[] = [
      { effect: 'gen_remove:prompt_car background,hint_automotive' },
      { effect: 'improve:outline' },
      { effect: 'auto_contrast' },
      { effect: 'sharpen:100' }
    ];

    if (includeBackground) {
      transformations.splice(1, 0, { effect: 'gen_fill:prompt_luxury showroom background' });
    }

    transformations.push(
      { quality: 'auto', fetch_format: 'auto' },
      { width: 1920, height: 1080, crop: 'pad', gravity: 'center' }
    );

    return cloudinary.url(publicId, {
      transformation: transformations
    });
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

  // Dynamic Branding and Watermark System
  async applyBrandOverlay(publicId: string, options?: BrandOverlayOptions) {
    const watermarkId = options?.watermarkId || 'autolensai/watermark';
    const gravity = options?.gravity || 'south_east';
    const x = options?.x || 20;
    const y = options?.y || 20;
    const width = options?.width || 300;
    const opacity = options?.opacity || 70;
    const effect = options?.effect || 'shadow:40';

    return cloudinary.url(publicId, {
      transformation: [
        {
          overlay: {
            public_id: watermarkId,
            type: 'private'
          },
          width,
          gravity,
          x,
          y,
          opacity
        },
        { effect }
      ]
    });
  }

  // Text Overlay for Pricing and Information
  async addTextOverlay(publicId: string, options: TextOverlayOptions) {
    const fontFamily = options.fontFamily || 'Montserrat';
    const fontSize = options.fontSize || 72;
    const fontWeight = options.fontWeight || 'bold';
    const color = options.color || '#ffffff';
    const background = options.background || 'rgba(0,0,0,0.5)';
    const gravity = options.gravity || 'north_west';
    const x = options.x || 50;
    const y = options.y || 50;
    const width = options.width || 400;
    const textAlign = options.textAlign || 'left';

    return cloudinary.url(publicId, {
      transformation: [
        {
          overlay: {
            font_family: fontFamily,
            font_size: fontSize,
            font_weight: fontWeight,
            text: options.text,
            text_align: textAlign
          },
          color,
          background,
          gravity,
          x,
          y,
          width,
          crop: 'fit'
        }
      ]
    });
  }

  // Vehicle-Specific Pricing Overlay
  async generatePricingOverlay(publicId: string, price: string) {
    return this.addTextOverlay(publicId, {
      text: `$${price}`,
      fontFamily: 'Montserrat',
      fontSize: 72,
      fontWeight: 'bold',
      color: '#ffffff',
      background: 'rgba(0,0,0,0.7)',
      gravity: 'north_west',
      x: 50,
      y: 50,
      width: 400,
      textAlign: 'left'
    });
  }

  // Social Media Card Generation
  async generateSocialCard(publicId: string, vehicleInfo: {
    make: string;
    model: string;
    year: number;
    price: string;
  }) {
    const title = `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`;
    const priceText = `$${vehicleInfo.price}`;

    return cloudinary.url(publicId, {
      transformation: [
        { width: 1200, height: 630, crop: 'fill', gravity: 'auto' },
        {
          overlay: {
            font_family: 'Montserrat',
            font_size: 48,
            font_weight: 'bold',
            text: title
          },
          color: '#ffffff',
          background: 'rgba(0,0,0,0.8)',
          gravity: 'south_west',
          x: 50,
          y: 120,
          width: 800,
          crop: 'fit'
        },
        {
          overlay: {
            font_family: 'Montserrat',
            font_size: 36,
            font_weight: 'bold',
            text: priceText
          },
          color: '#10B981',
          background: 'rgba(0,0,0,0.8)',
          gravity: 'south_west',
          x: 50,
          y: 50,
          width: 400,
          crop: 'fit'
        },
        {
          overlay: {
            public_id: 'autolensai/logo-white',
            type: 'private'
          },
          width: 200,
          gravity: 'north_east',
          x: 50,
          y: 50
        }
      ]
    });
  }

  // Responsive Image Breakpoints
  async generateResponsiveBreakpoints(publicId: string) {
    const breakpoints = {
      thumbnail: this.generateOptimizedUrl(publicId, { width: 300, height: 200, crop: 'fill' }),
      small: this.generateOptimizedUrl(publicId, { width: 640, height: 427, crop: 'fill' }),
      medium: this.generateOptimizedUrl(publicId, { width: 768, height: 512, crop: 'fill' }),
      large: this.generateOptimizedUrl(publicId, { width: 1024, height: 683, crop: 'fill' }),
      xlarge: this.generateOptimizedUrl(publicId, { width: 1280, height: 853, crop: 'fill' }),
      original: this.generateOptimizedUrl(publicId, { quality: 'auto', format: 'auto' })
    };

    return breakpoints;
  }

  // Signed Upload for Security
  async generateSignedUploadUrl(folder?: string) {
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const uploadPreset = 'auto_gen_vehicles';
      
      const params: any = {
        timestamp,
        upload_preset: uploadPreset
      };

      if (folder) {
        params.folder = folder;
      }

      const signature = cloudinary.utils.api_sign_request(
        params,
        env.get('CLOUDINARY_API_SECRET')
      );

      return {
        signature,
        timestamp,
        uploadPreset,
        folder,
        cloudName: env.get('CLOUDINARY_CLOUD_NAME'),
        apiKey: env.get('CLOUDINARY_API_KEY')
      };
    } catch (error) {
      console.error('Cloudinary signed upload error:', error);
      throw new Error('Failed to generate signed upload URL');
    }
  }

  // Before/After Comparison URLs
  async generateBeforeAfterUrls(publicId: string) {
    const beforeUrl = this.generateOptimizedUrl(publicId, {
      quality: 'auto',
      format: 'auto'
    });

    const afterUrl = cloudinary.url(publicId, {
      transformation: [
        { effect: 'gen_remove:prompt_car background,hint_automotive' },
        { effect: 'gen_fill:prompt_luxury showroom background' },
        { effect: 'improve:outline' },
        { effect: 'auto_contrast' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    return {
      before: beforeUrl,
      after: afterUrl
    };
  }

  // Cost Optimization Helper
  async optimizeDelivery(publicId: string, options?: {
    quality?: string;
    format?: string;
    width?: number | string;
    dpr?: string;
  }) {
    const defaults = {
      quality: 'auto',
      fetch_format: 'auto',
      width: 'auto',
      dpr: 'auto'
    };

    return cloudinary.url(publicId, {
      transformation: [{ ...defaults, ...options }]
    });
  }
}