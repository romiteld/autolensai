// Client-safe Cloudinary utilities that only handle URL generation
// This does not use the Node.js SDK which requires 'fs'

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

export class CloudinaryClientService {
  private cloudName: string;

  constructor() {
    // Get cloud name from environment - must be NEXT_PUBLIC_ prefixed for client-side access
    this.cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
  }

  // Generate Cloudinary URL without using the SDK
  private buildCloudinaryUrl(publicId: string, transformations?: any[]): string {
    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload`;
    
    if (!transformations || transformations.length === 0) {
      return `${baseUrl}/${publicId}`;
    }

    // Build transformation string
    const transformString = transformations.map(t => {
      const parts = [];
      
      if (t.width) parts.push(`w_${t.width}`);
      if (t.height) parts.push(`h_${t.height}`);
      if (t.crop) parts.push(`c_${t.crop}`);
      if (t.gravity) parts.push(`g_${t.gravity}`);
      if (t.quality) parts.push(`q_${t.quality}`);
      if (t.format) parts.push(`f_${t.format}`);
      if (t.effect) parts.push(`e_${t.effect}`);
      if (t.opacity) parts.push(`o_${t.opacity}`);
      if (t.x) parts.push(`x_${t.x}`);
      if (t.y) parts.push(`y_${t.y}`);
      
      return parts.join(',');
    }).join('/');

    return `${baseUrl}/${transformString}/${publicId}`;
  }

  generateOptimizedUrl(publicId: string, options?: CloudinaryTransformation): string {
    const defaultOptions = {
      quality: 'auto',
      format: 'auto',
    };

    return this.buildCloudinaryUrl(publicId, [{ ...defaultOptions, ...options }]);
  }

  async generateBeforeAfterUrls(publicId: string) {
    const beforeUrl = this.generateOptimizedUrl(publicId, {
      quality: 'auto',
      format: 'auto'
    });

    const afterUrl = this.buildCloudinaryUrl(publicId, [
      { effect: 'gen_remove:prompt_car background,hint_automotive' },
      { effect: 'gen_fill:prompt_luxury showroom background' },
      { effect: 'improve:outline' },
      { effect: 'auto_contrast' },
      { quality: 'auto', format: 'auto' }
    ]);

    return {
      before: beforeUrl,
      after: afterUrl
    };
  }

  generateResponsiveBreakpoints(publicId: string) {
    return {
      thumbnail: this.generateOptimizedUrl(publicId, { width: 300, height: 200, crop: 'fill' }),
      small: this.generateOptimizedUrl(publicId, { width: 640, height: 427, crop: 'fill' }),
      medium: this.generateOptimizedUrl(publicId, { width: 768, height: 512, crop: 'fill' }),
      large: this.generateOptimizedUrl(publicId, { width: 1024, height: 683, crop: 'fill' }),
      xlarge: this.generateOptimizedUrl(publicId, { width: 1280, height: 853, crop: 'fill' }),
      original: this.generateOptimizedUrl(publicId, { quality: 'auto', format: 'auto' })
    };
  }
}