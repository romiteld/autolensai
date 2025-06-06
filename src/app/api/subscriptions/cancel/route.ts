import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/payment/services/stripe.service';
import { createSupabaseClient, createSupabaseAdmin } from '@/core/database/supabase';
import { z } from 'zod';

const stripeService = new StripeService();

const CancelSchema = z.object({
  immediately: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CancelSchema.parse(body);

    // Get user's active subscription
    const supabaseAdmin = createSupabaseAdmin();
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Cancel subscription in Stripe
    const cancelledSubscription = await stripeService.cancelSubscription(
      subscription.stripe_subscription_id,
      validatedData.immediately
    );

    // Update subscription in database
    const updateData = validatedData.immediately
      ? { status: 'cancelled' as const }
      : { 
          status: 'active' as const, // Keep active until period end
          // Stripe webhook will handle the final cancellation
        };

    await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscription.id);

    // Update user subscription status if immediately cancelled
    if (validatedData.immediately) {
      await supabaseAdmin
        .from('users')
        .update({ subscription_status: 'cancelled' })
        .eq('id', user.id);
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: cancelledSubscription.status,
        cancelAtPeriodEnd: cancelledSubscription.cancel_at_period_end,
        currentPeriodEnd: new Date(cancelledSubscription.current_period_end * 1000),
        cancelledImmediately: validatedData.immediately,
      },
      message: validatedData.immediately
        ? 'Subscription cancelled immediately'
        : 'Subscription will cancel at the end of the current billing period',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}