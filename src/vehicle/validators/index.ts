// Vehicle Validators
export * from './vehicle.validator';
export * from './image.validator';

// Re-export model schemas for convenience
export { VehicleSchema, VehicleImageSchema } from '@/vehicle/models/vehicle.model';

// Common validation utilities
export const ValidationUtils = {
  /**
   * Format validation errors for API responses
   */
  formatErrors(errors: string[]): { field: string; message: string }[] {
    return errors.map(error => {
      const [field, ...messageParts] = error.split(': ');
      return {
        field: field || 'unknown',
        message: messageParts.join(': ') || 'Invalid value'
      };
    });
  },

  /**
   * Check if a string is a valid UUID
   */
  isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Sanitize input string
   */
  sanitizeString(input: string, maxLength: number = 1000): string {
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>]/g, ''); // Basic XSS prevention
  },

  /**
   * Validate file size
   */
  validateFileSize(base64Data: string, maxSizeMB: number = 10): { valid: boolean; sizeMB: number; error?: string } {
    try {
      // Calculate size from base64 string
      const sizeBytes = (base64Data.length * 3) / 4;
      const sizeMB = sizeBytes / (1024 * 1024);
      
      if (sizeMB > maxSizeMB) {
        return {
          valid: false,
          sizeMB,
          error: `File size (${sizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
        };
      }
      
      return { valid: true, sizeMB };
    } catch (error) {
      return { valid: false, sizeMB: 0, error: 'Invalid file data' };
    }
  },

  /**
   * Validate image dimensions from base64
   */
  validateImageDimensions(base64Data: string, maxWidth: number = 4000, maxHeight: number = 4000): Promise<{
    valid: boolean;
    width?: number;
    height?: number;
    error?: string;
  }> {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          if (img.width > maxWidth || img.height > maxHeight) {
            resolve({
              valid: false,
              width: img.width,
              height: img.height,
              error: `Image dimensions (${img.width}x${img.height}) exceed maximum allowed (${maxWidth}x${maxHeight})`
            });
          } else {
            resolve({
              valid: true,
              width: img.width,
              height: img.height
            });
          }
        };
        img.onerror = () => {
          resolve({ valid: false, error: 'Invalid image data' });
        };
        img.src = `data:image/jpeg;base64,${base64Data}`;
      } catch (error) {
        resolve({ valid: false, error: 'Failed to validate image dimensions' });
      }
    });
  },

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number format (US format)
   */
  isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate URL format
   */
  isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  },

  /**
   * Validate and normalize zip code
   */
  normalizeZipCode(zipCode: string): { valid: boolean; normalized?: string; error?: string } {
    const cleaned = zipCode.replace(/\D/g, '');
    
    if (cleaned.length === 5) {
      return { valid: true, normalized: cleaned };
    } else if (cleaned.length === 9) {
      return { valid: true, normalized: `${cleaned.slice(0, 5)}-${cleaned.slice(5)}` };
    } else {
      return { valid: false, error: 'Invalid zip code format' };
    }
  },

  /**
   * Validate price format and convert to cents
   */
  validateAndConvertPrice(price: string | number): { valid: boolean; cents?: number; error?: string } {
    try {
      const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[$,]/g, '')) : price;
      
      if (isNaN(numPrice) || numPrice < 0) {
        return { valid: false, error: 'Invalid price format' };
      }
      
      if (numPrice > 10000000) { // Max $10M
        return { valid: false, error: 'Price exceeds maximum allowed value' };
      }
      
      return { valid: true, cents: Math.round(numPrice * 100) };
    } catch {
      return { valid: false, error: 'Price validation failed' };
    }
  }
};

// Common error messages
export const ErrorMessages = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_FORMAT: 'Invalid format',
  INVALID_UUID: 'Invalid ID format',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number format',
  INVALID_URL: 'Invalid URL format',
  INVALID_ZIP: 'Invalid zip code format',
  INVALID_VIN: 'Invalid VIN format',
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_TYPE: 'Unsupported file type',
  UNAUTHORIZED: 'Access denied',
  NOT_FOUND: 'Resource not found',
  DUPLICATE_ENTRY: 'This entry already exists',
  PROCESSING_ERROR: 'Processing failed',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  SUBSCRIPTION_REQUIRED: 'Subscription upgrade required',
  INSUFFICIENT_CREDITS: 'Insufficient credits',
} as const;

// Validation result types
export interface ValidationResult<T = any> {
  valid: boolean;
  data?: T;
  errors?: string[];
  error?: string;
}

export interface FileValidationResult {
  valid: boolean;
  sizeMB: number;
  width?: number;
  height?: number;
  error?: string;
}