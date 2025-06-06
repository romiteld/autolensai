import { z } from 'zod';

// File upload validation
export const ImageFileSchema = z.object({
  name: z.string().min(1),
  type: z.string().refine(
    (type) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(type),
    { message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' }
  ),
  data: z.string().min(1), // Base64 encoded image
});

// Image upload request validation
export const ImageUploadSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  files: z.array(ImageFileSchema).min(1).max(20, 'Maximum 20 images allowed'),
  folder: z.string().optional().default('autolensai/vehicles'),
  applyEnhancements: z.boolean().optional().default(false),
  orderIndex: z.number().min(0).optional(),
  isPrimary: z.boolean().optional().default(false),
});

// Image processing request validation
export const ImageProcessSchema = z.object({
  imageId: z.string().uuid('Invalid image ID'),
  operation: z.enum(['remove_background', 'enhance', 'create_thumbnail', 'optimize', 'add_watermark', 'create_variants'], {
    errorMap: () => ({ message: 'Invalid operation' })
  }),
  async: z.boolean().optional().default(true),
  options: z.object({
    width: z.number().min(50).max(4000).optional(),
    height: z.number().min(50).max(4000).optional(),
    quality: z.enum(['auto', 'auto:low', 'auto:good', 'auto:best']).optional(),
    backgroundPrompt: z.string().max(500).optional(),
    watermarkText: z.string().max(100).optional(),
    format: z.enum(['auto', 'webp', 'png', 'jpg', 'avif']).optional(),
  }).optional(),
});

// Image workflow validation
export const ImageWorkflowSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  workflow: z.object({
    removeBackground: z.boolean().optional().default(false),
    replaceBackground: z.boolean().optional().default(false),
    backgroundPrompt: z.string().max(500).optional(),
    enhance: z.boolean().optional().default(true),
    optimize: z.boolean().optional().default(true),
    createVariants: z.boolean().optional().default(false),
    addWatermark: z.boolean().optional().default(false),
    watermarkText: z.string().max(100).optional(),
  }),
  async: z.boolean().optional().default(true),
});

// Batch processing options validation
export const BatchProcessingSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  options: z.object({
    batchSize: z.number().min(1).max(10).optional().default(3),
    concurrency: z.number().min(1).max(5).optional().default(2),
    priority: z.number().min(1).max(10).optional().default(5),
    removeBackground: z.boolean().optional().default(false),
    replaceBackground: z.boolean().optional().default(false),
    backgroundPrompt: z.string().max(500).optional(),
    enhance: z.boolean().optional().default(true),
    optimize: z.boolean().optional().default(true),
    createVariants: z.boolean().optional().default(false),
    addWatermark: z.boolean().optional().default(false),
    watermarkText: z.string().max(100).optional(),
  }),
});

// Bulk processing request validation
export const BulkProcessSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  imageIds: z.array(z.string().uuid()).min(1).max(50, 'Maximum 50 images per bulk operation'),
  operation: z.enum(['remove_background', 'enhance', 'create_thumbnails'], {
    errorMap: () => ({ message: 'Invalid operation' })
  }),
  options: z.object({
    width: z.number().min(50).max(4000).optional(),
    height: z.number().min(50).max(4000).optional(),
    quality: z.enum(['auto', 'best', 'good', 'eco']).optional(),
    priority: z.number().min(1).max(10).optional().default(5),
  }).optional(),
});

// Image update request validation
export const ImageUpdateSchema = z.object({
  isPrimary: z.boolean().optional(),
  orderIndex: z.number().min(0).optional(),
});

// Query parameters validation
export const ImageQuerySchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID').optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100).optional(),
  offset: z.string().transform(Number).refine(n => n >= 0).optional(),
});

// Queue action validation
export const QueueActionSchema = z.object({
  action: z.enum(['pause', 'resume', 'clean', 'stats'], {
    errorMap: () => ({ message: 'Invalid queue action' })
  }),
  olderThan: z.number().min(0).optional(),
});

// Validation helper functions
export function validateImageFile(file: any): { valid: boolean; error?: string } {
  try {
    ImageFileSchema.parse(file);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid file' };
    }
    return { valid: false, error: 'Validation failed' };
  }
}

export function validateImageUpload(data: any): { valid: boolean; data?: any; error?: string } {
  try {
    const validatedData = ImageUploadSchema.parse(data);
    return { valid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid upload data' };
    }
    return { valid: false, error: 'Validation failed' };
  }
}

export function validateImageProcess(data: any): { valid: boolean; data?: any; error?: string } {
  try {
    const validatedData = ImageProcessSchema.parse(data);
    return { valid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid process data' };
    }
    return { valid: false, error: 'Validation failed' };
  }
}

export function validateBulkProcess(data: any): { valid: boolean; data?: any; error?: string } {
  try {
    const validatedData = BulkProcessSchema.parse(data);
    return { valid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid bulk process data' };
    }
    return { valid: false, error: 'Validation failed' };
  }
}

// Additional validation functions
export function validateImageWorkflow(data: any): { valid: boolean; data?: any; error?: string } {
  try {
    const validatedData = ImageWorkflowSchema.parse(data);
    return { valid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid workflow data' };
    }
    return { valid: false, error: 'Validation failed' };
  }
}

export function validateBatchProcessing(data: any): { valid: boolean; data?: any; error?: string } {
  try {
    const validatedData = BatchProcessingSchema.parse(data);
    return { valid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid batch processing data' };
    }
    return { valid: false, error: 'Validation failed' };
  }
}

// Type exports for TypeScript
export type ImageFile = z.infer<typeof ImageFileSchema>;
export type ImageUpload = z.infer<typeof ImageUploadSchema>;
export type ImageProcess = z.infer<typeof ImageProcessSchema>;
export type ImageWorkflow = z.infer<typeof ImageWorkflowSchema>;
export type BatchProcessingOptions = z.infer<typeof BatchProcessingSchema>;
export type BulkProcess = z.infer<typeof BulkProcessSchema>;
export type ImageUpdate = z.infer<typeof ImageUpdateSchema>;
export type ImageQuery = z.infer<typeof ImageQuerySchema>;
export type QueueAction = z.infer<typeof QueueActionSchema>;