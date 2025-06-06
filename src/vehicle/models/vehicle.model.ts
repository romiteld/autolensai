import { z } from 'zod';

export const VehicleCondition = z.enum(['excellent', 'good', 'fair', 'poor']);
export const VehicleStatus = z.enum(['active', 'pending', 'sold', 'archived']);
export const TransmissionType = z.enum(['automatic', 'manual', 'cvt']);
export const FuelType = z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']);

export const VehicleSchema = z.object({
  make: z.string().min(2, 'Make must be at least 2 characters'),
  model: z.string().min(2, 'Model must be at least 2 characters'),
  year: z.number()
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  mileage: z.number().min(0, 'Mileage must be positive').optional(),
  price: z.number().min(0, 'Price must be positive'),
  description: z.string().optional(),
  condition: VehicleCondition.optional(),
  location: z.string().optional(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid zip code').optional(),
  vin: z.string().length(17, 'VIN must be 17 characters').optional(),
  transmission: TransmissionType.optional(),
  fuelType: FuelType.optional(),
  exteriorColor: z.string().optional(),
  interiorColor: z.string().optional(),
});

export type VehicleInput = z.infer<typeof VehicleSchema>;

export const VehicleImageSchema = z.object({
  file: z.instanceof(File),
  isPrimary: z.boolean().default(false),
  orderIndex: z.number().min(0).default(0),
});

export type VehicleImageInput = z.infer<typeof VehicleImageSchema>;

export interface VehicleWithImages {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  mileage?: number;
  price?: number;
  description?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  location?: string;
  zipCode?: string;
  status: 'active' | 'pending' | 'sold' | 'archived';
  featured: boolean;
  vin?: string;
  transmission?: string;
  fuelType?: string;
  exteriorColor?: string;
  interiorColor?: string;
  cloudinaryFolder?: string;
  images: VehicleImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleImage {
  id: string;
  vehicleId: string;
  originalUrl: string;
  processedUrl?: string;
  cloudinaryPublicId?: string;
  orderIndex?: number;
  isPrimary: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
}