import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  withRequiredAuth,
  AuthContext,
  APIError,
  ValidationError
} from '@/api/middleware';
import { VehicleService } from '@/vehicle/services/vehicle.service';

const vehicleService = new VehicleService();

// Validation schema for creating vehicles
const createVehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  mileage: z.number().int().min(0).optional(),
  price: z.number().min(0).optional(),
  description: z.string().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  location: z.string().optional(),
  zipCode: z.string().optional(),
  vin: z.string().length(17).optional(),
  transmission: z.string().optional(),
  fuelType: z.string().optional(),
  exteriorColor: z.string().optional(),
  interiorColor: z.string().optional(),
});

// Query parameters schema
const getVehiclesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['created_at', 'price', 'year', 'mileage']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['active', 'pending', 'sold', 'archived']).optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  yearMin: z.coerce.number().int().optional(),
  yearMax: z.coerce.number().int().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
});

// GET /api/vehicles - Get user's vehicles (protected)
async function getVehiclesHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  if (!context.isAuthenticated || !context.user) {
    throw new APIError('Authentication required', 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validatedQuery = getVehiclesQuerySchema.parse(queryParams);
    
    // Build search options
    const searchOptions = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      sortBy: validatedQuery.sortBy,
      sortOrder: validatedQuery.sortOrder,
      filters: {
        ...(validatedQuery.status && { status: validatedQuery.status }),
        ...(validatedQuery.make && { make: validatedQuery.make }),
        ...(validatedQuery.model && { model: validatedQuery.model }),
        ...(validatedQuery.yearMin && { yearMin: validatedQuery.yearMin }),
        ...(validatedQuery.yearMax && { yearMax: validatedQuery.yearMax }),
        ...(validatedQuery.priceMin && { priceMin: validatedQuery.priceMin }),
        ...(validatedQuery.priceMax && { priceMax: validatedQuery.priceMax }),
        ...(validatedQuery.condition && { condition: validatedQuery.condition }),
      }
    };

    const result = await vehicleService.getUserVehicles(context.user.id, searchOptions);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid query parameters', error.errors);
    }
    
    throw new APIError('Failed to fetch vehicles', 500);
  }
}

// POST /api/vehicles - Create new vehicle (protected)
async function createVehicleHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  if (!context.isAuthenticated || !context.user) {
    throw new APIError('Authentication required', 401);
  }

  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = createVehicleSchema.parse(body);

    const vehicle = await vehicleService.createVehicle(context.user.id, validatedData);
    
    return NextResponse.json({
      success: true,
      data: vehicle,
      message: 'Vehicle created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Create vehicle error:', error);
    
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid vehicle data', error.errors);
    }
    
    if (error instanceof Error) {
      throw new APIError(error.message, 500);
    }
    
    throw new APIError('Failed to create vehicle', 500);
  }
}

// Apply middleware to routes
export const GET = withRequiredAuth(getVehiclesHandler);
export const POST = withRequiredAuth(createVehicleHandler);