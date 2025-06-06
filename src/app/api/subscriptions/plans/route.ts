import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/payment/services/subscription.service';
import { createSupabaseClient } from '@/core/database/supabase';
import { getUserSubscriptionInfo, getUpgradeRecommendation } from '@/payment/utils/subscription.utils';

const subscriptionService = new SubscriptionService();

export async function GET(request: NextRequest) {
  try {
    // Get all available plans
    const plans = await subscriptionService.getPlans();
    
    // Check if user is authenticated to provide personalized recommendations
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let currentPlan = null;
    let recommendation = null;
    
    if (user) {
      const { subscriptionTier } = await getUserSubscriptionInfo(user.id);
      currentPlan = subscriptionTier;
      recommendation = getUpgradeRecommendation(subscriptionTier);
    }
    
    return NextResponse.json({
      plans,
      currentPlan,
      recommendation,
    });
  } catch (error) {
    console.error('Get plans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}