import { NextRequest, NextResponse } from 'next/server';
import { 
  withRequiredRoles,
  AuthContext,
  adminApiMiddleware,
  ValidationError,
  APIError 
} from '@/api/middleware';
import { createSupabaseClient } from '@/core/database/supabase';

// GET /api/admin/users - List all users (admin only)
async function getUsersHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  if (page < 1 || limit < 1 || limit > 100) {
    throw new ValidationError('Invalid pagination parameters');
  }

  const supabase = createSupabaseClient();
  
  try {
    // Build the query with filters
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        role,
        subscription_tier,
        created_at,
        updated_at,
        last_sign_in_at,
        email_confirmed_at,
        (
          SELECT COUNT(*) 
          FROM vehicles 
          WHERE vehicles.user_id = users.id
        ) as vehicle_count
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Apply status filter
    if (status) {
      if (status === 'active') {
        query = query.not('email_confirmed_at', 'is', null);
      } else if (status === 'inactive') {
        query = query.is('email_confirmed_at', null);
      }
    }

    // Apply pagination
    const start = (page - 1) * limit;
    query = query.range(start, start + limit - 1);

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data: users, count, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      throw new APIError('Failed to fetch users', 500);
    }

    // Get summary statistics
    const { data: stats } = await supabase
      .from('users')
      .select('role, subscription_tier, email_confirmed_at')
      .then(result => {
        if (!result.data) return { data: null };
        
        const summary = result.data.reduce((acc, user) => {
          // Count by role
          acc.byRole[user.role] = (acc.byRole[user.role] || 0) + 1;
          
          // Count by subscription tier
          acc.byTier[user.subscription_tier] = (acc.byTier[user.subscription_tier] || 0) + 1;
          
          // Count active/inactive
          if (user.email_confirmed_at) {
            acc.active++;
          } else {
            acc.inactive++;
          }
          
          return acc;
        }, {
          byRole: {},
          byTier: {},
          active: 0,
          inactive: 0,
          total: result.data.length
        });
        
        return { data: summary };
      });

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      stats: stats || {
        byRole: {},
        byTier: {},
        active: 0,
        inactive: 0,
        total: 0
      },
      filters: {
        search,
        status
      },
      requestedBy: context.user!.id
    });

  } catch (error) {
    console.error('Error in getUsersHandler:', error);
    if (error instanceof ValidationError || error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to fetch users', 500);
  }
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

    const supabase = createSupabaseClient();

    // Create user through Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm for admin created users
      user_metadata: {
        full_name: body.full_name || '',
        created_by_admin: context.user!.id
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw new APIError(`Failed to create user: ${authError.message}`, 400);
    }

    if (!authData.user) {
      throw new APIError('User creation failed', 500);
    }

    // Update user profile in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({
        full_name: body.full_name || '',
        role: body.role || 'user',
        subscription_tier: body.subscription_tier || 'free',
        email_confirmed_at: new Date().toISOString()
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (userError) {
      console.error('User profile update error:', userError);
      // Don't fail the whole operation, just log the error
    }

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: body.full_name || '',
        role: body.role || 'user',
        subscription_tier: body.subscription_tier || 'free',
        created_at: authData.user.created_at,
        created_by: context.user!.id
      },
      message: 'User created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in createUserHandler:', error);
    if (error instanceof ValidationError || error instanceof APIError) {
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

    // Prevent admin from removing their own admin role
    if (body.userId === context.user!.id && body.role && body.role !== 'admin') {
      throw new APIError('Cannot remove admin role from yourself', 403);
    }

    const supabase = createSupabaseClient();

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role, subscription_tier')
      .eq('id', body.userId)
      .single();

    if (fetchError || !existingUser) {
      throw new APIError('User not found', 404);
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.role) {
      updateData.role = body.role;
    }

    if (body.subscription_tier) {
      updateData.subscription_tier = body.subscription_tier;
    }

    if (body.full_name !== undefined) {
      updateData.full_name = body.full_name;
    }

    // Handle user status changes
    if (body.status === 'suspended') {
      // Suspend user in Supabase Auth
      const { error: suspendError } = await supabase.auth.admin.updateUserById(
        body.userId,
        { ban_duration: '876000h' } // ~100 years = effectively permanent
      );

      if (suspendError) {
        console.error('Error suspending user:', suspendError);
      }
    } else if (body.status === 'active') {
      // Reactivate user in Supabase Auth
      const { error: reactivateError } = await supabase.auth.admin.updateUserById(
        body.userId,
        { ban_duration: 'none' }
      );

      if (reactivateError) {
        console.error('Error reactivating user:', reactivateError);
      }
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', body.userId)
      .select(`
        id,
        email,
        full_name,
        role,
        subscription_tier,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      throw new APIError('Failed to update user', 500);
    }

    return NextResponse.json({
      user: updatedUser,
      message: 'User updated successfully',
      updatedBy: context.user!.id
    });

  } catch (error) {
    console.error('Error in updateUsersHandler:', error);
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