import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/payment/services/stripe.service';
import { SubscriptionService } from '@/payment/services/subscription.service';
import { createSupabaseAdmin } from '@/core/database/supabase';
import type { StripeWebhookResult, PaymentEvent } from '@/payment/models/payment.types';

const stripeService = new StripeService();
const subscriptionService = new SubscriptionService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    const event = await stripeService.constructWebhookEvent(body, signature);
    
    // Handle the webhook event
    const result = await stripeService.handleWebhookEvent(event);
    
    // Update database based on event
    if (result) {
      await updateDatabase(event.type, result);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

async function updateDatabase(eventType: string, result: StripeWebhookResult) {
  const supabase = createSupabaseAdmin();
  
  try {
    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        if (result.userId && result.subscriptionId) {
          // Get the subscription from Stripe to get more details
          const stripeSubscription = await stripeService.getSubscription(result.subscriptionId);
          
          // Determine plan type from price ID
          const plans = await subscriptionService.getPlans();
          const plan = plans.find(p => 
            stripeSubscription.items.data.some(item => item.price.id === p.stripePriceId)
          );
          const planType = plan?.id || 'basic';
          
          // Upsert subscription record
          await supabase
            .from('subscriptions')
            .upsert({
              user_id: result.userId,
              stripe_subscription_id: result.subscriptionId,
              stripe_price_id: stripeSubscription.items.data[0]?.price.id,
              status: result.status as any,
              plan_type: planType,
              current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
              current_period_end: result.currentPeriodEnd?.toISOString(),
              updated_at: new Date().toISOString(),
            });
            
          // Update user subscription status and tier
          await supabase
            .from('users')
            .update({
              subscription_status: result.status === 'active' ? 'active' : 'inactive',
              subscription_tier: planType,
            })
            .eq('id', result.userId);
            
          // Log the event
          const paymentEvent: PaymentEvent = {
            type: eventType === 'customer.subscription.created' ? 'subscription_created' : 'subscription_updated',
            userId: result.userId,
            subscriptionId: result.subscriptionId,
            data: result,
            timestamp: new Date(),
          };
          await subscriptionService.logPaymentEvent(paymentEvent);
        }
        break;
        
      case 'customer.subscription.deleted':
        if (result.userId && result.subscriptionId) {
          // Update subscription status to cancelled
          await supabase
            .from('subscriptions')
            .update({
              status: 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', result.userId)
            .eq('stripe_subscription_id', result.subscriptionId);
            
          // Update user to free tier
          await supabase
            .from('users')
            .update({
              subscription_status: 'cancelled',
              subscription_tier: 'free',
            })
            .eq('id', result.userId);
            
          // Log the event
          const paymentEvent: PaymentEvent = {
            type: 'subscription_cancelled',
            userId: result.userId,
            subscriptionId: result.subscriptionId,
            data: result,
            timestamp: new Date(),
          };
          await subscriptionService.logPaymentEvent(paymentEvent);
        }
        break;
        
      case 'invoice.payment_succeeded':
        if (result.customerEmail) {
          // Log successful payment
          const paymentEvent: PaymentEvent = {
            type: 'payment_succeeded',
            userId: '', // Would need to look up user by email
            data: result,
            timestamp: new Date(),
          };
          await subscriptionService.logPaymentEvent(paymentEvent);
        }
        break;
        
      case 'invoice.payment_failed':
        if (result.customerEmail) {
          // Log failed payment - could trigger email notifications
          const paymentEvent: PaymentEvent = {
            type: 'payment_failed',
            userId: '', // Would need to look up user by email
            data: result,
            timestamp: new Date(),
          };
          await subscriptionService.logPaymentEvent(paymentEvent);
          
          // Could add logic here to:
          // 1. Send failed payment notification
          // 2. Update subscription status after multiple failures
          // 3. Trigger dunning management
        }
        break;
    }
  } catch (error) {
    console.error('Error updating database for webhook event:', eventType, error);
    throw error; // Re-throw to ensure webhook fails and Stripe retries
  }
}