import { NextRequest, NextResponse } from 'next/server';
import { 
  withRequiredRoles,
  AuthContext,
  adminApiMiddleware,
  ValidationError,
  APIError 
} from '@/api/middleware';

// GET /api/admin/users - List all users (admin only)
async function getUsersHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  if (page < 1 || limit < 1 || limit > 100) {
    throw new ValidationError('Invalid pagination parameters');
  }

  // Mock user data - would use actual UserService
  const users = [
    {
      id: '1',
      email: 'user1@example.com',
      created_at: '2024-01-01T00:00:00Z',
      roles: ['user'],
      status: 'active'
    },
    {
      id: '2',
      email: 'admin@example.com',
      created_at: '2024-01-01T00:00:00Z',
      roles: ['admin'],
      status: 'active'
    }
  ].filter(user => 
    search ? user.email.toLowerCase().includes(search.toLowerCase()) : true
  );

  const total = users.length;
  const start = (page - 1) * limit;
  const paginatedUsers = users.slice(start, start + limit);

  return NextResponse.json({
    users: paginatedUsers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    requestedBy: context.user!.id
  });
}

// POST /api/admin/users - Create user (admin only)
async function createUserHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    if (!body.email || !body.password) {
      throw new ValidationError('Email and password are required');
    }

    if (!body.email.includes('@')) {
      throw new ValidationError('Invalid email format');
    }

    if (body.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    // Mock user creation - would use actual AuthProvider
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email: body.email,
      roles: body.roles || ['user'],
      status: 'active',
      created_at: new Date().toISOString(),
      created_by: context.user!.id
    };

    return NextResponse.json({
      user: newUser,
      message: 'User created successfully'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new APIError('Failed to create user', 500);
  }
}

// PATCH /api/admin/users - Update user roles/status (admin only)
async function updateUsersHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    if (!body.userId) {
      throw new ValidationError('User ID is required');
    }

    if (body.userId === context.user!.id && body.roles && !body.roles.includes('admin')) {
      throw new APIError('Cannot remove admin role from yourself', 403);
    }

    // Mock user update - would use actual UserService
    const updatedUser = {
      id: body.userId,
      email: 'user@example.com',
      roles: body.roles || ['user'],
      status: body.status || 'active',
      updated_at: new Date().toISOString(),
      updated_by: context.user!.id
    };

    return NextResponse.json({
      user: updatedUser,
      message: 'User updated successfully'
    });

  } catch (error) {
    if (error instanceof ValidationError || error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to update user', 500);
  }
}

// Apply admin middleware and role requirements
export const GET = withRequiredRoles(['admin', 'super_admin'])(getUsersHandler);
export const POST = withRequiredRoles(['admin', 'super_admin'])(createUserHandler);
export const PATCH = withRequiredRoles(['admin', 'super_admin'])(updateUsersHandler);