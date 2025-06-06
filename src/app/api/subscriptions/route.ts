import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/payment/services/stripe.service';
import { createSupabaseClient, createSupabaseAdmin } from '@/core/database/supabase';

const stripeService = new StripeService();

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription from database
    const supabaseAdmin = createSupabaseAdmin();
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        users!inner(
          subscription_status,
          subscription_tier,
          stripe_customer_id
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError) {
      // No active subscription found
      return NextResponse.json({
        subscription: null,
        hasActiveSubscription: false,
        subscriptionStatus: 'none',
      });
    }

    // Get latest subscription data from Stripe if available
    let stripeSubscription = null;
    if (subscription.stripe_subscription_id) {
      try {
        stripeSubscription = await stripeService.getSubscription(
          subscription.stripe_subscription_id
        );
      } catch (error) {
        console.error('Failed to fetch Stripe subscription:', error);
      }
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        planType: subscription.plan_type,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        stripePriceId: subscription.stripe_price_id,
        stripeData: stripeSubscription ? {
          status: stripeSubscription.status,
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        } : null,
      },
      hasActiveSubscription: subscription.status === 'active',
      subscriptionStatus: subscription.status,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}