import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, createSupabaseAdmin } from '@/core/database/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    
    // Get current billing period start
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('current_period_start, current_period_end, plan_type')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const billingPeriodStart = subscription?.current_period_start 
      ? new Date(subscription.current_period_start)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // Default to current month start

    // Get usage statistics for current billing period
    const [vehiclesCount, imagesCount, videosCount] = await Promise.all([
      // Count vehicles created this billing period
      supabaseAdmin
        .from('vehicles')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', billingPeriodStart.toISOString()),

      // Count images processed this billing period
      supabaseAdmin
        .from('vehicle_images')
        .select('id')
        .eq('vehicle_id', user.id) // This would need to be joined with vehicles table
        .gte('created_at', billingPeriodStart.toISOString()),

      // Count videos generated this billing period
      supabaseAdmin
        .from('videos')
        .select('id')
        .eq('vehicle_id', user.id) // This would need to be joined with vehicles table
        .gte('created_at', billingPeriodStart.toISOString()),
    ]);

    // Get better usage stats with proper joins
    const { data: detailedUsage, error: usageError } = await supabaseAdmin
      .rpc('get_user_usage_stats', {
        p_user_id: user.id,
        p_period_start: billingPeriodStart.toISOString(),
      })
      .single();

    // Fallback if RPC doesn't exist
    let usage = {
      vehicles: vehiclesCount.data?.length || 0,
      images: 0,
      videos: 0,
      storage_mb: 0,
      api_calls: 0,
    };

    if (!usageError && detailedUsage && typeof detailedUsage === 'object') {
      const typedUsage = detailedUsage as any;
      usage = {
        vehicles: typedUsage.vehicles || usage.vehicles,
        images: typedUsage.images || usage.images,
        videos: typedUsage.videos || usage.videos,
        storage_mb: typedUsage.storage_mb || usage.storage_mb,
        api_calls: typedUsage.api_calls || usage.api_calls,
      };
    } else {
      // Manual calculation as fallback
      const { data: vehicleImages } = await supabaseAdmin
        .from('vehicle_images')
        .select('id')
        .in('vehicle_id', (vehiclesCount.data || []).map(v => v.id));

      const { data: vehicleVideos } = await supabaseAdmin
        .from('videos')
        .select('id')
        .in('vehicle_id', (vehiclesCount.data || []).map(v => v.id));

      usage.images = vehicleImages?.length || 0;
      usage.videos = vehicleVideos?.length || 0;
    }

    // Define plan limits
    const planLimits = {
      free: {
        vehicles: 5,
        images: 50,
        videos: 2,
        storage_mb: 1000,
        api_calls: 100,
      },
      basic: {
        vehicles: 25,
        images: 250,
        videos: 10,
        storage_mb: 5000,
        api_calls: 500,
      },
      premium: {
        vehicles: 100,
        images: 1000,
        videos: 50,
        storage_mb: 20000,
        api_calls: 2000,
      },
      unlimited: {
        vehicles: -1, // Unlimited
        images: -1,
        videos: -1,
        storage_mb: -1,
        api_calls: -1,
      },
    };

    const currentPlan = subscription?.plan_type || 'free';
    const limits = planLimits[currentPlan as keyof typeof planLimits] || planLimits.free;

    // Calculate usage percentages
    const calculateUsagePercentage = (used: number, limit: number) => {
      if (limit === -1) return 0; // Unlimited
      return Math.min((used / limit) * 100, 100);
    };

    return NextResponse.json({
      usage,
      limits,
      plan: currentPlan,
      billingPeriod: {
        start: billingPeriodStart,
        end: subscription?.current_period_end || null,
      },
      usagePercentages: {
        vehicles: calculateUsagePercentage(usage.vehicles, limits.vehicles),
        images: calculateUsagePercentage(usage.images, limits.images),
        videos: calculateUsagePercentage(usage.videos, limits.videos),
        storage: calculateUsagePercentage(usage.storage_mb, limits.storage_mb),
        apiCalls: calculateUsagePercentage(usage.api_calls, limits.api_calls),
      },
      isOverLimit: {
        vehicles: limits.vehicles !== -1 && usage.vehicles > limits.vehicles,
        images: limits.images !== -1 && usage.images > limits.images,
        videos: limits.videos !== -1 && usage.videos > limits.videos,
        storage: limits.storage_mb !== -1 && usage.storage_mb > limits.storage_mb,
        apiCalls: limits.api_calls !== -1 && usage.api_calls > limits.api_calls,
      },
    });
  } catch (error) {
    console.error('Get usage error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
}