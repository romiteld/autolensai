import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/core/database/supabase';
import { withAuth, AuthContext, ValidationError, APIError } from '@/api/middleware';

// GET /api/users/profile - Get current user profile
async function getProfileHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  try {
    const supabase = createSupabaseClient();
    
    const { data: profile, error } = await supabase
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
        phone,
        bio,
        website,
        location,
        preferences,
        (
          SELECT COUNT(*) 
          FROM vehicles 
          WHERE vehicles.user_id = users.id AND vehicles.status = 'active'
        ) as active_vehicles_count,
        (
          SELECT COUNT(*) 
          FROM vehicles 
          WHERE vehicles.user_id = users.id AND vehicles.status = 'sold'
        ) as sold_vehicles_count
      `)
      .eq('id', context.user!.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw new APIError('Failed to fetch profile', 500);
    }

    if (!profile) {
      throw new APIError('Profile not found', 404);
    }

    return NextResponse.json({
      profile,
      message: 'Profile retrieved successfully'
    });

  } catch (error) {
    console.error('Error in getProfileHandler:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to fetch profile', 500);
  }
}

// PUT /api/users/profile - Update current user profile
async function updateProfileHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  try {
    const body = await request.json();
    const supabase = createSupabaseClient();

    // Validate input
    if (body.email && !body.email.includes('@')) {
      throw new ValidationError('Invalid email format');
    }

    if (body.phone && !/^[\+]?[\d\s\-\(\)]+$/.test(body.phone)) {
      throw new ValidationError('Invalid phone number format');
    }

    if (body.website && !body.website.match(/^https?:\/\/.+/)) {
      throw new ValidationError('Website must start with http:// or https://');
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only update provided fields
    const allowedFields = [
      'full_name', 
      'phone', 
      'bio', 
      'website', 
      'location', 
      'avatar_url',
      'preferences'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', context.user!.id)
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        phone,
        bio,
        website,
        location,
        preferences,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw new APIError('Failed to update profile', 500);
    }

    // If email is being updated, handle it through Supabase Auth
    if (body.email && body.email !== context.user!.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: body.email
      });

      if (emailError) {
        console.error('Error updating email:', emailError);
        // Don't fail the whole operation, just log the error
        return NextResponse.json({
          profile: updatedProfile,
          message: 'Profile updated successfully, but email update failed. Please try updating email separately.',
          emailUpdateFailed: true
        });
      }
    }

    return NextResponse.json({
      profile: updatedProfile,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error in updateProfileHandler:', error);
    if (error instanceof ValidationError || error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to update profile', 500);
  }
}

// DELETE /api/users/profile - Delete user account
async function deleteAccountHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  try {
    const supabase = createSupabaseClient();
    
    // First, soft delete all user's vehicles
    const { error: vehiclesError } = await supabase
      .from('vehicles')
      .update({ 
        status: 'deleted',
        deleted_at: new Date().toISOString()
      })
      .eq('user_id', context.user!.id);

    if (vehiclesError) {
      console.error('Error deleting user vehicles:', vehiclesError);
    }

    // Soft delete user profile
    const { error: profileError } = await supabase
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        email: `deleted_${Date.now()}@autolensai.com`, // Anonymize email
        full_name: 'Deleted User',
        phone: null,
        bio: null,
        website: null,
        location: null,
        avatar_url: null,
        preferences: null
      })
      .eq('id', context.user!.id);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      throw new APIError('Failed to delete account', 500);
    }

    // Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(context.user!.id);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      // Don't fail the operation, profile is already anonymized
    }

    return NextResponse.json({
      message: 'Account deleted successfully',
      deletedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in deleteAccountHandler:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to delete account', 500);
  }
}

// Apply authentication middleware
export const GET = withAuth(getProfileHandler);
export const PUT = withAuth(updateProfileHandler);
export const DELETE = withAuth(deleteAccountHandler);