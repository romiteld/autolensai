import { NextRequest, NextResponse } from 'next/server';
import { 
  protectedApiMiddleware, 
  publicApiMiddleware,
  withRequiredAuth,
  AuthContext,
  APIError,
  ValidationError
} from '@/api/middleware';

// GET /api/vehicles - Get user's vehicles (protected)
async function getVehiclesHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  if (!context.isAuthenticated || !context.user) {
    throw new APIError('Authentication required', 401);
  }

  // Mock response - would use actual VehicleService
  const vehicles = [
    {
      id: '1',
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      price: 25000,
      userId: context.user.id
    }
  ];
  
  return NextResponse.json({ 
    vehicles,
    total: vehicles.length,
    user: context.user.id 
  });
}

// POST /api/vehicles - Create new vehicle (protected)
async function createVehicleHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  if (!context.isAuthenticated || !context.user) {
    throw new APIError('Authentication required', 401);
  }

  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.make || !body.model || !body.year) {
      throw new ValidationError('Missing required fields: make, model, year');
    }

    // Mock vehicle creation - would use actual VehicleService
    const vehicle = {
      id: Math.random().toString(36).substr(2, 9),
      ...body,
      userId: context.user.id,
      createdAt: new Date().toISOString()
    };
    
    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new APIError('Failed to create vehicle', 500);
  }
}

// Apply middleware to routes
export const GET = withRequiredAuth(getVehiclesHandler);
export const POST = withRequiredAuth(createVehicleHandler);