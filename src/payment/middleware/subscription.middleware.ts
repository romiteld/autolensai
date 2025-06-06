import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/core/database/supabase';
import { requireSubscriptionAccess, getUserFeatureAccess } from '../utils/subscription.utils';
import type { FeatureAccess } from '../models/payment.types';

export interface SubscriptionMiddlewareOptions {
  requiredFeature?: keyof FeatureAccess;
  allowFreeAccess?: boolean;
  customCheck?: (access: FeatureAccess, userId: string) => Promise<boolean>;
}

export async function withSubscriptionCheck(
  request: NextRequest,
  options: SubscriptionMiddlewareOptions = {}
): Promise<{ success: true; userId: string } | { success: false; response: NextResponse }> {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    // If no specific feature required and free access allowed, skip subscription check
    if (options.allowFreeAccess && !options.requiredFeature && !options.customCheck) {
      return { success: true, userId: user.id };
    }

    // Check required feature access
    if (options.requiredFeature) {
      const accessCheck = await requireSubscriptionAccess(user.id, options.requiredFeature);
      
      if (!accessCheck.success) {
        return {
          success: false,
          response: NextResponse.json(
            { 
              error: accessCheck.error,
              feature: options.requiredFeature,
              upgradeRequired: true,
            }, 
            { status: accessCheck.status }
          ),
        };
      }
    }

    // Custom access check
    if (options.customCheck) {
      const access = await getUserFeatureAccess(user.id);
      const hasAccess = await options.customCheck(access, user.id);
      
      if (!hasAccess) {
        return {
          success: false,
          response: NextResponse.json(
            { 
              error: 'This feature is not available in your current plan',
              upgradeRequired: true,
            }, 
            { status: 403 }
          ),
        };
      }
    }

    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Subscription middleware error:', error);
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      ),
    };
  }
}

// Helper function to create subscription-protected API handlers
export function createProtectedHandler<T = any>(
  handler: (request: NextRequest, context: { userId: string }) => Promise<NextResponse<T>>,
  options: SubscriptionMiddlewareOptions = {}
) {
  return async function protectedHandler(request: NextRequest): Promise<NextResponse<T>> {
    const middlewareResult = await withSubscriptionCheck(request, options);
    
    if (!middlewareResult.success) {
      return middlewareResult.response as NextResponse<T>;
    }
    
    return handler(request, { userId: middlewareResult.userId });
  };
}

// Specific middleware functions for common use cases
export const requireBasicSubscription = (request: NextRequest) =>
  withSubscriptionCheck(request, { requiredFeature: 'canAccessMarketing' });

export const requirePremiumSubscription = (request: NextRequest) =>
  withSubscriptionCheck(request, { requiredFeature: 'canAccessAnalytics' });

export const requireVideoGeneration = (request: NextRequest) =>
  withSubscriptionCheck(request, { requiredFeature: 'canGenerateVideos' });

export const requireImageUpload = (request: NextRequest) =>
  withSubscriptionCheck(request, { requiredFeature: 'canUploadImages' });

// Usage example functions
export const createVehicleCheck = async (request: NextRequest) =>
  withSubscriptionCheck(request, {
    customCheck: async (access, userId) => {
      // This would check vehicle count limits
      return access.canCreateVehicles;
    },
  });

export const createVideoCheck = async (request: NextRequest) =>
  withSubscriptionCheck(request, {
    customCheck: async (access, userId) => {
      if (!access.canGenerateVideos) return false;
      
      // Additional check for monthly video limits would go here
      // const { allowed } = await canGenerateVideo(userId);
      // return allowed;
      
      return true;
    },
  });

// Higher-order function for creating usage-limited endpoints
export function withUsageLimit<T = any>(
  limitType: 'vehicles' | 'images' | 'videos',
  handler: (request: NextRequest, context: { userId: string }) => Promise<NextResponse<T>>
) {
  return async function limitedHandler(request: NextRequest): Promise<NextResponse<T>> {
    const middlewareResult = await withSubscriptionCheck(request);
    
    if (!middlewareResult.success) {
      return middlewareResult.response as NextResponse<T>;
    }
    
    const { userId } = middlewareResult;
    
    // Check specific usage limits based on the limit type
    // This is where you'd implement the specific logic for each type
    // For now, just proceed to the handler
    
    return handler(request, { userId });
  };
}

// Response helper for subscription errors
export function createSubscriptionErrorResponse(
  feature: string,
  currentPlan: string,
  recommendedPlan?: string
): NextResponse {
  return NextResponse.json(
    {
      error: `${feature} is not available in your current plan`,
      currentPlan,
      recommendedPlan,
      upgradeRequired: true,
      upgradeUrl: '/dashboard/billing',
    },
    { status: 403 }
  );
}

// Helper to check if user can perform action based on current usage
export async function checkAndEnforceUsageLimit(
  userId: string,
  limitType: 'vehicles' | 'images' | 'videos',
  additionalUsage: number = 1
): Promise<{ allowed: boolean; error?: NextResponse }> {
  try {
    const access = await getUserFeatureAccess(userId);
    
    // Implementation would depend on the specific limit type
    // For now, return allowed
    return { allowed: true };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return {
      allowed: false,
      error: NextResponse.json(
        { error: 'Unable to verify usage limits' },
        { status: 500 }
      ),
    };
  }
}