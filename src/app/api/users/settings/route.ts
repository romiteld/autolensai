import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/core/database/supabase';
import { withAuth, AuthContext, ValidationError, APIError } from '@/api/middleware';

interface UserSettings {
  notifications: {
    email: {
      marketing: boolean;
      vehicleUpdates: boolean;
      inquiries: boolean;
      systemAlerts: boolean;
    };
    push: {
      inquiries: boolean;
      marketing: boolean;
    };
  };
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    profileVisibility: 'public' | 'private' | 'dealers_only';
  };
  preferences: {
    language: string;
    timezone: string;
    currency: string;
    dateFormat: string;
    autoSave: boolean;
  };
  marketing: {
    enableAutomation: boolean;
    platforms: string[];
    postingSchedule: 'immediate' | 'optimal' | 'custom';
  };
}

const defaultSettings: UserSettings = {
  notifications: {
    email: {
      marketing: true,
      vehicleUpdates: true,
      inquiries: true,
      systemAlerts: true
    },
    push: {
      inquiries: true,
      marketing: false
    }
  },
  privacy: {
    showEmail: false,
    showPhone: false,
    profileVisibility: 'public'
  },
  preferences: {
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    autoSave: true
  },
  marketing: {
    enableAutomation: false,
    platforms: [],
    postingSchedule: 'optimal'
  }
};

// GET /api/users/settings - Get user settings
async function getSettingsHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  try {
    const supabase = createSupabaseClient();
    
    const { data: user, error } = await supabase
      .from('users')
      .select('preferences, settings')
      .eq('id', context.user!.id)
      .single();

    if (error) {
      console.error('Error fetching user settings:', error);
      throw new APIError('Failed to fetch settings', 500);
    }

    // Merge user settings with defaults
    const userSettings = user?.settings || {};
    const mergedSettings = {
      ...defaultSettings,
      ...userSettings,
      notifications: {
        ...defaultSettings.notifications,
        ...userSettings.notifications,
        email: {
          ...defaultSettings.notifications.email,
          ...userSettings.notifications?.email
        },
        push: {
          ...defaultSettings.notifications.push,
          ...userSettings.notifications?.push
        }
      },
      privacy: {
        ...defaultSettings.privacy,
        ...userSettings.privacy
      },
      preferences: {
        ...defaultSettings.preferences,
        ...userSettings.preferences
      },
      marketing: {
        ...defaultSettings.marketing,
        ...userSettings.marketing
      }
    };

    return NextResponse.json({
      settings: mergedSettings,
      message: 'Settings retrieved successfully'
    });

  } catch (error) {
    console.error('Error in getSettingsHandler:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to fetch settings', 500);
  }
}

// PUT /api/users/settings - Update user settings
async function updateSettingsHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  try {
    const body = await request.json();
    const supabase = createSupabaseClient();

    // Validate settings structure
    if (body.preferences?.language && !/^[a-z]{2}(-[A-Z]{2})?$/.test(body.preferences.language)) {
      throw new ValidationError('Invalid language format');
    }

    if (body.preferences?.timezone && !Intl.supportedValuesOf('timeZone').includes(body.preferences.timezone)) {
      throw new ValidationError('Invalid timezone');
    }

    if (body.preferences?.currency && !/^[A-Z]{3}$/.test(body.preferences.currency)) {
      throw new ValidationError('Invalid currency code');
    }

    if (body.privacy?.profileVisibility && !['public', 'private', 'dealers_only'].includes(body.privacy.profileVisibility)) {
      throw new ValidationError('Invalid profile visibility setting');
    }

    if (body.marketing?.postingSchedule && !['immediate', 'optimal', 'custom'].includes(body.marketing.postingSchedule)) {
      throw new ValidationError('Invalid posting schedule setting');
    }

    // Get current settings
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('settings')
      .eq('id', context.user!.id)
      .single();

    if (fetchError) {
      console.error('Error fetching current settings:', fetchError);
      throw new APIError('Failed to fetch current settings', 500);
    }

    // Deep merge new settings with existing ones
    const currentSettings = currentUser?.settings || {};
    const updatedSettings = deepMerge(currentSettings, body);

    // Update settings in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        settings: updatedSettings,
        updated_at: new Date().toISOString()
      })
      .eq('id', context.user!.id)
      .select('settings')
      .single();

    if (updateError) {
      console.error('Error updating settings:', updateError);
      throw new APIError('Failed to update settings', 500);
    }

    return NextResponse.json({
      settings: updatedUser.settings,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Error in updateSettingsHandler:', error);
    if (error instanceof ValidationError || error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to update settings', 500);
  }
}

// POST /api/users/settings/reset - Reset settings to defaults
async function resetSettingsHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  try {
    const supabase = createSupabaseClient();

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        settings: defaultSettings,
        updated_at: new Date().toISOString()
      })
      .eq('id', context.user!.id)
      .select('settings')
      .single();

    if (updateError) {
      console.error('Error resetting settings:', updateError);
      throw new APIError('Failed to reset settings', 500);
    }

    return NextResponse.json({
      settings: updatedUser.settings,
      message: 'Settings reset to defaults successfully'
    });

  } catch (error) {
    console.error('Error in resetSettingsHandler:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to reset settings', 500);
  }
}

// Helper function for deep merging objects
function deepMerge(target: any, source: any): any {
  if (source === null || typeof source !== 'object') {
    return source;
  }

  if (Array.isArray(source)) {
    return source;
  }

  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

// Apply authentication middleware
export const GET = withAuth(getSettingsHandler);
export const PUT = withAuth(updateSettingsHandler);
export const POST = withAuth(resetSettingsHandler);