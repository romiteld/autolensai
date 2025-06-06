import { createSupabaseAdmin } from '@/core/database/supabase';
import type { FeatureAccess, SubscriptionFeatures } from '../models/payment.types';

// Define subscription features and limits
export const SUBSCRIPTION_FEATURES: SubscriptionFeatures = {
  free: {
    canCreateVehicles: true,
    canUploadImages: true,
    canGenerateVideos: true,
    canAccessMarketing: false,
    canScheduleTestDrives: true,
    canAccessAnalytics: false,
    maxVehicles: 5,
    maxImagesPerVehicle: 10,
    maxVideosPerMonth: 2,
  },
  basic: {
    canCreateVehicles: true,
    canUploadImages: true,
    canGenerateVideos: true,
    canAccessMarketing: true,
    canScheduleTestDrives: true,
    canAccessAnalytics: true,
    maxVehicles: 25,
    maxImagesPerVehicle: 20,
    maxVideosPerMonth: 10,
  },
  premium: {
    canCreateVehicles: true,
    canUploadImages: true,
    canGenerateVideos: true,
    canAccessMarketing: true,
    canScheduleTestDrives: true,
    canAccessAnalytics: true,
    maxVehicles: 100,
    maxImagesPerVehicle: 50,
    maxVideosPerMonth: 50,
  },
  unlimited: {
    canCreateVehicles: true,
    canUploadImages: true,
    canGenerateVideos: true,
    canAccessMarketing: true,
    canScheduleTestDrives: true,
    canAccessAnalytics: true,
    maxVehicles: -1, // Unlimited
    maxImagesPerVehicle: -1,
    maxVideosPerMonth: -1,
  },
};

export async function getUserSubscriptionInfo(userId: string) {
  const supabase = createSupabaseAdmin();
  
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_status, subscription_tier')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { subscriptionTier: 'free', subscriptionStatus: 'inactive' };
    }

    return {
      subscriptionTier: user.subscription_tier || 'free',
      subscriptionStatus: user.subscription_status || 'inactive',
    };
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return { subscriptionTier: 'free', subscriptionStatus: 'inactive' };
  }
}

export async function getUserFeatureAccess(userId: string): Promise<FeatureAccess> {
  const { subscriptionTier, subscriptionStatus } = await getUserSubscriptionInfo(userId);
  
  // If subscription is not active, default to free tier
  const effectiveTier = subscriptionStatus === 'active' ? subscriptionTier : 'free';
  
  return SUBSCRIPTION_FEATURES[effectiveTier] || SUBSCRIPTION_FEATURES.free;
}

export async function checkFeatureAccess(
  userId: string, 
  feature: keyof FeatureAccess
): Promise<boolean> {
  const access = await getUserFeatureAccess(userId);
  
  if (typeof access[feature] === 'boolean') {
    return access[feature] as boolean;
  }
  
  return false;
}

export async function checkUsageLimit(
  userId: string,
  limitType: 'maxVehicles' | 'maxImagesPerVehicle' | 'maxVideosPerMonth',
  currentUsage: number
): Promise<{ allowed: boolean; limit: number; usage: number }> {
  const access = await getUserFeatureAccess(userId);
  const limit = access[limitType] as number;
  
  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit, usage: currentUsage };
  }
  
  return {
    allowed: currentUsage < limit,
    limit,
    usage: currentUsage,
  };
}

export async function getUserVehicleCount(userId: string): Promise<number> {
  const supabase = createSupabaseAdmin();
  
  try {
    const { count, error } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .neq('status', 'archived');

    if (error) {
      console.error('Error counting vehicles:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error counting vehicles:', error);
    return 0;
  }
}

export async function canCreateVehicle(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxAllowed: number;
}> {
  const [access, currentCount] = await Promise.all([
    getUserFeatureAccess(userId),
    getUserVehicleCount(userId),
  ]);

  if (!access.canCreateVehicles) {
    return {
      allowed: false,
      reason: 'Vehicle creation not available in your current plan',
      currentCount,
      maxAllowed: access.maxVehicles,
    };
  }

  const limitCheck = await checkUsageLimit(userId, 'maxVehicles', currentCount);
  
  if (!limitCheck.allowed) {
    return {
      allowed: false,
      reason: `Vehicle limit reached (${limitCheck.limit} vehicles)`,
      currentCount,
      maxAllowed: limitCheck.limit,
    };
  }

  return {
    allowed: true,
    currentCount,
    maxAllowed: limitCheck.limit,
  };
}

export async function canUploadImages(
  userId: string,
  vehicleId: string,
  additionalImages: number = 1
): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxAllowed: number;
}> {
  const supabase = createSupabaseAdmin();
  const access = await getUserFeatureAccess(userId);

  if (!access.canUploadImages) {
    return {
      allowed: false,
      reason: 'Image upload not available in your current plan',
      currentCount: 0,
      maxAllowed: access.maxImagesPerVehicle,
    };
  }

  try {
    const { count, error } = await supabase
      .from('vehicle_images')
      .select('id', { count: 'exact' })
      .eq('vehicle_id', vehicleId);

    if (error) {
      console.error('Error counting images:', error);
      return {
        allowed: false,
        reason: 'Unable to verify image count',
        currentCount: 0,
        maxAllowed: access.maxImagesPerVehicle,
      };
    }

    const currentCount = count || 0;
    const newTotal = currentCount + additionalImages;

    if (access.maxImagesPerVehicle !== -1 && newTotal > access.maxImagesPerVehicle) {
      return {
        allowed: false,
        reason: `Image limit reached (${access.maxImagesPerVehicle} images per vehicle)`,
        currentCount,
        maxAllowed: access.maxImagesPerVehicle,
      };
    }

    return {
      allowed: true,
      currentCount,
      maxAllowed: access.maxImagesPerVehicle,
    };
  } catch (error) {
    console.error('Error checking image upload limit:', error);
    return {
      allowed: false,
      reason: 'Unable to verify image limit',
      currentCount: 0,
      maxAllowed: access.maxImagesPerVehicle,
    };
  }
}

export async function canGenerateVideo(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxAllowed: number;
}> {
  const supabase = createSupabaseAdmin();
  const access = await getUserFeatureAccess(userId);

  if (!access.canGenerateVideos) {
    return {
      allowed: false,
      reason: 'Video generation not available in your current plan',
      currentCount: 0,
      maxAllowed: access.maxVideosPerMonth,
    };
  }

  try {
    // Count videos generated this month
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const { count, error } = await supabase
      .from('videos')
      .select('id', { count: 'exact' })
      .eq('vehicle_id', userId) // This would need to be joined with vehicles table
      .gte('created_at', firstDayOfMonth.toISOString());

    if (error) {
      console.error('Error counting videos:', error);
      return {
        allowed: false,
        reason: 'Unable to verify video count',
        currentCount: 0,
        maxAllowed: access.maxVideosPerMonth,
      };
    }

    const currentCount = count || 0;

    if (access.maxVideosPerMonth !== -1 && currentCount >= access.maxVideosPerMonth) {
      return {
        allowed: false,
        reason: `Monthly video limit reached (${access.maxVideosPerMonth} videos per month)`,
        currentCount,
        maxAllowed: access.maxVideosPerMonth,
      };
    }

    return {
      allowed: true,
      currentCount,
      maxAllowed: access.maxVideosPerMonth,
    };
  } catch (error) {
    console.error('Error checking video generation limit:', error);
    return {
      allowed: false,
      reason: 'Unable to verify video limit',
      currentCount: 0,
      maxAllowed: access.maxVideosPerMonth,
    };
  }
}

// Middleware function to check subscription access
export async function requireSubscriptionAccess(
  userId: string,
  feature: keyof FeatureAccess
): Promise<{ success: true } | { success: false; error: string; status: number }> {
  const hasAccess = await checkFeatureAccess(userId, feature);
  
  if (!hasAccess) {
    return {
      success: false,
      error: 'This feature requires a paid subscription',
      status: 403,
    };
  }
  
  return { success: true };
}

// Helper to get upgrade recommendation
export function getUpgradeRecommendation(currentTier: string): {
  recommendedTier: string;
  reason: string;
  benefits: string[];
} {
  switch (currentTier) {
    case 'free':
      return {
        recommendedTier: 'basic',
        reason: 'Unlock marketing automation and analytics',
        benefits: [
          'Marketing automation',
          'Advanced analytics',
          '25 vehicles',
          '20 images per vehicle',
          '10 videos per month',
        ],
      };
    case 'basic':
      return {
        recommendedTier: 'premium',
        reason: 'Scale your business with higher limits',
        benefits: [
          '100 vehicles',
          '50 images per vehicle',
          '50 videos per month',
          'Priority support',
        ],
      };
    case 'premium':
      return {
        recommendedTier: 'unlimited',
        reason: 'Unlimited everything for enterprise use',
        benefits: [
          'Unlimited vehicles',
          'Unlimited images',
          'Unlimited videos',
          'White-label options',
          'Dedicated support',
        ],
      };
    default:
      return {
        recommendedTier: 'basic',
        reason: 'Get started with our most popular plan',
        benefits: ['All essential features', 'Marketing tools', 'Analytics'],
      };
  }
}