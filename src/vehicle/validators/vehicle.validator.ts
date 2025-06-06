import { z } from 'zod';
import { VehicleSchema } from '@/vehicle/models/vehicle.model';

// Enhanced vehicle validation schemas
export const VehicleCreateSchema = VehicleSchema.extend({
  // Additional validation for vehicle creation
  userId: z.string().uuid('Invalid user ID'),
  generateDescription: z.boolean().optional().default(true),
  processImages: z.boolean().optional().default(true),
});

export const VehicleUpdateSchema = VehicleSchema.partial().extend({
  // For updates, all fields are optional except ID constraints
  status: z.enum(['active', 'pending', 'sold', 'archived']).optional(),
  featured: z.boolean().optional(),
  regenerateDescription: z.boolean().optional().default(false),
});

export const VehicleSearchSchema = z.object({
  // Search and filtering parameters
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  sortBy: z.enum(['created_at', 'price', 'year', 'mileage', 'make', 'model']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  
  // Filter parameters
  make: z.string().optional(),
  model: z.string().optional(),
  yearMin: z.coerce.number().min(1900).max(new Date().getFullYear() + 2).optional(),
  yearMax: z.coerce.number().min(1900).max(new Date().getFullYear() + 2).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  mileageMin: z.coerce.number().min(0).optional(),
  mileageMax: z.coerce.number().min(0).optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  transmission: z.enum(['automatic', 'manual', 'cvt']).optional(),
  fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']).optional(),
  location: z.string().optional(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid zip code').optional(),
  status: z.enum(['active', 'pending', 'sold', 'archived']).optional(),
  featured: z.boolean().optional(),
  
  // Search query
  q: z.string().optional(), // General search query
});

export const VehicleStatusUpdateSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  status: z.enum(['active', 'pending', 'sold', 'archived'], {
    errorMap: () => ({ message: 'Invalid status' })
  }),
  reason: z.string().max(500).optional(),
});

export const VehicleFeaturedToggleSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  featured: z.boolean().optional(), // If not provided, will toggle current state
});

export const VehicleBulkActionSchema = z.object({
  vehicleIds: z.array(z.string().uuid()).min(1).max(50, 'Maximum 50 vehicles per bulk action'),
  action: z.enum(['activate', 'deactivate', 'feature', 'unfeature', 'delete', 'archive'], {
    errorMap: () => ({ message: 'Invalid bulk action' })
  }),
  reason: z.string().max(500).optional(),
});

export const VehicleImportSchema = z.object({
  vehicles: z.array(VehicleSchema).min(1).max(100, 'Maximum 100 vehicles per import'),
  skipDuplicates: z.boolean().optional().default(true),
  generateDescriptions: z.boolean().optional().default(true),
  defaultStatus: z.enum(['active', 'pending']).optional().default('pending'),
});

export const VehicleExportSchema = z.object({
  vehicleIds: z.array(z.string().uuid()).optional(), // If not provided, exports all user vehicles
  format: z.enum(['csv', 'json', 'xlsx']).optional().default('csv'),
  includeImages: z.boolean().optional().default(false),
  includeStats: z.boolean().optional().default(true),
});

export const VehicleAnalyticsSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID').optional(), // If not provided, gets all vehicles
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  metrics: z.array(z.enum(['views', 'inquiries', 'shares', 'saves', 'clicks'])).optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
});

// VIN validation schema
export const VINValidationSchema = z.object({
  vin: z.string().length(17, 'VIN must be exactly 17 characters')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format'),
  validateWithAPI: z.boolean().optional().default(false), // Whether to validate with external VIN API
});

// Vehicle comparison schema
export const VehicleComparisonSchema = z.object({
  vehicleIds: z.array(z.string().uuid()).min(2).max(4, 'Can compare 2-4 vehicles'),
  compareFields: z.array(z.enum([
    'price', 'year', 'mileage', 'condition', 'fuelType', 
    'transmission', 'features', 'specifications'
  ])).optional(),
});

// Validation helper functions
export function validateVehicleCreate(data: any): { valid: boolean; data?: any; errors?: string[] } {
  try {
    const validatedData = VehicleCreateSchema.parse(data);
    return { valid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { valid: false, errors: ['Validation failed'] };
  }
}

export function validateVehicleUpdate(data: any): { valid: boolean; data?: any; errors?: string[] } {
  try {
    const validatedData = VehicleUpdateSchema.parse(data);
    return { valid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { valid: false, errors: ['Validation failed'] };
  }
}

export function validateVehicleSearch(data: any): { valid: boolean; data?: any; errors?: string[] } {
  try {
    const validatedData = VehicleSearchSchema.parse(data);
    
    // Additional validation logic
    if (validatedData.yearMin && validatedData.yearMax && validatedData.yearMin > validatedData.yearMax) {
      return { valid: false, errors: ['yearMin cannot be greater than yearMax'] };
    }
    
    if (validatedData.priceMin && validatedData.priceMax && validatedData.priceMin > validatedData.priceMax) {
      return { valid: false, errors: ['priceMin cannot be greater than priceMax'] };
    }
    
    if (validatedData.mileageMin && validatedData.mileageMax && validatedData.mileageMin > validatedData.mileageMax) {
      return { valid: false, errors: ['mileageMin cannot be greater than mileageMax'] };
    }
    
    return { valid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { valid: false, errors: ['Validation failed'] };
  }
}

export function validateVIN(vin: string, useAPI: boolean = false): { valid: boolean; error?: string; data?: any } {
  try {
    const validatedData = VINValidationSchema.parse({ vin, validateWithAPI: useAPI });
    
    // Basic VIN checksum validation (simplified)
    if (!isValidVINChecksum(vin)) {
      return { valid: false, error: 'Invalid VIN checksum' };
    }
    
    return { valid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid VIN' };
    }
    return { valid: false, error: 'VIN validation failed' };
  }
}

export function validateBulkAction(data: any): { valid: boolean; data?: any; errors?: string[] } {
  try {
    const validatedData = VehicleBulkActionSchema.parse(data);
    return { valid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { valid: false, errors: ['Validation failed'] };
  }
}

// VIN checksum validation (simplified implementation)
function isValidVINChecksum(vin: string): boolean {
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  const transliteration: Record<string, number> = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9
  };
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = vin[i];
    const value = isNaN(parseInt(char)) ? transliteration[char] : parseInt(char);
    sum += value * weights[i];
  }
  
  const remainder = sum % 11;
  const checkDigit = remainder === 10 ? 'X' : remainder.toString();
  
  return checkDigit === vin[8];
}

// Price validation helper
export function validatePriceRange(min?: number, max?: number): { valid: boolean; error?: string } {
  if (min !== undefined && max !== undefined) {
    if (min > max) {
      return { valid: false, error: 'Minimum price cannot be greater than maximum price' };
    }
    if (min < 0 || max < 0) {
      return { valid: false, error: 'Price cannot be negative' };
    }
  }
  return { valid: true };
}

// Year validation helper
export function validateYearRange(min?: number, max?: number): { valid: boolean; error?: string } {
  const currentYear = new Date().getFullYear();
  const minValidYear = 1900;
  const maxValidYear = currentYear + 2;
  
  if (min !== undefined && (min < minValidYear || min > maxValidYear)) {
    return { valid: false, error: `Year must be between ${minValidYear} and ${maxValidYear}` };
  }
  
  if (max !== undefined && (max < minValidYear || max > maxValidYear)) {
    return { valid: false, error: `Year must be between ${minValidYear} and ${maxValidYear}` };
  }
  
  if (min !== undefined && max !== undefined && min > max) {
    return { valid: false, error: 'Minimum year cannot be greater than maximum year' };
  }
  
  return { valid: true };
}

// Type exports
export type VehicleCreate = z.infer<typeof VehicleCreateSchema>;
export type VehicleUpdate = z.infer<typeof VehicleUpdateSchema>;
export type VehicleSearch = z.infer<typeof VehicleSearchSchema>;
export type VehicleStatusUpdate = z.infer<typeof VehicleStatusUpdateSchema>;
export type VehicleFeaturedToggle = z.infer<typeof VehicleFeaturedToggleSchema>;
export type VehicleBulkAction = z.infer<typeof VehicleBulkActionSchema>;
export type VehicleImport = z.infer<typeof VehicleImportSchema>;
export type VehicleExport = z.infer<typeof VehicleExportSchema>;
export type VehicleAnalytics = z.infer<typeof VehicleAnalyticsSchema>;
export type VINValidation = z.infer<typeof VINValidationSchema>;
export type VehicleComparison = z.infer<typeof VehicleComparisonSchema>;