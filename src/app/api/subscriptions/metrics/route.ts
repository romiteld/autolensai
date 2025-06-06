import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/payment/services/subscription.service';
import { createSupabaseClient } from '@/core/database/supabase';

const subscriptionService = new SubscriptionService();

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here
    // For now, allow any authenticated user to see basic metrics
    // In production, you'd check if user has admin role
    
    const metrics = await subscriptionService.getSubscriptionMetrics();
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Get subscription metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription metrics' },
      { status: 500 }
    );
  }
}