import { createSupabaseAdmin } from '@/core/database/supabase';
import { StripeService } from './stripe.service';
import type {
  SubscriptionRecord,
  SubscriptionInsert,
  SubscriptionUpdate,
  PaymentEvent,
  SubscriptionPlan,
} from '../models/payment.types';

export class SubscriptionService {
  private supabase = createSupabaseAdmin();
  private stripeService = new StripeService();

  // Predefined subscription plans
  private plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      stripePriceId: '', // No Stripe price for free plan
      price: 0,
      currency: 'usd',
      interval: 'month',
      features: [
        '5 vehicles',
        '10 images per vehicle',
        '2 videos per month',
        'Basic support',
      ],
      limits: {
        vehicles: 5,
        images: 50,
        videos: 2,
        storage_mb: 1000,
        api_calls: 100,
      },
    },
    {
      id: 'basic',
      name: 'Basic',
      description: 'Great for small dealers',
      stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
      price: 29,
      currency: 'usd',
      interval: 'month',
      features: [
        '25 vehicles',
        '20 images per vehicle',
        '10 videos per month',
        'Marketing automation',
        'Analytics dashboard',
        'Email support',
      ],
      limits: {
        vehicles: 25,
        images: 250,
        videos: 10,
        storage_mb: 5000,
        api_calls: 500,
      },
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'For growing dealerships',
      stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
      price: 99,
      currency: 'usd',
      interval: 'month',
      features: [
        '100 vehicles',
        '50 images per vehicle',
        '50 videos per month',
        'Advanced marketing tools',
        'Custom branding',
        'Priority support',
      ],
      limits: {
        vehicles: 100,
        images: 1000,
        videos: 50,
        storage_mb: 20000,
        api_calls: 2000,
      },
    },
    {
      id: 'unlimited',
      name: 'Enterprise',
      description: 'Unlimited everything',
      stripePriceId: process.env.STRIPE_UNLIMITED_PRICE_ID || 'price_unlimited',
      price: 299,
      currency: 'usd',
      interval: 'month',
      features: [
        'Unlimited vehicles',
        'Unlimited images',
        'Unlimited videos',
        'White-label options',
        'API access',
        'Dedicated support',
      ],
      limits: {
        vehicles: -1,
        images: -1,
        videos: -1,
        storage_mb: -1,
        api_calls: -1,
      },
    },
  ];

  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.plans;
  }

  async getPlan(planId: string): Promise<SubscriptionPlan | null> {
    return this.plans.find(plan => plan.id === planId) || null;
  }

  async getUserSubscription(userId: string): Promise<SubscriptionRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserSubscription:', error);
      return null;
    }
  }

  async createSubscription(data: SubscriptionInsert): Promise<SubscriptionRecord | null> {
    try {
      const { data: subscription, error } = await this.supabase
        .from('subscriptions')
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error('Error creating subscription:', error);
        return null;
      }

      return subscription;
    } catch (error) {
      console.error('Error in createSubscription:', error);
      return null;
    }
  }

  async updateSubscription(
    subscriptionId: string,
    data: SubscriptionUpdate
  ): Promise<SubscriptionRecord | null> {
    try {
      const { data: subscription, error } = await this.supabase
        .from('subscriptions')
        .update(data)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating subscription:', error);
        return null;
      }

      return subscription;
    } catch (error) {
      console.error('Error in updateSubscription:', error);
      return null;
    }
  }

  async cancelSubscription(userId: string, immediately = false): Promise<{
    success: boolean;
    subscription?: SubscriptionRecord;
    error?: string;
  }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        return { success: false, error: 'No active subscription found' };
      }

      if (!subscription.stripe_subscription_id) {
        return { success: false, error: 'Invalid subscription data' };
      }

      // Cancel in Stripe
      await this.stripeService.cancelSubscription(
        subscription.stripe_subscription_id,
        immediately
      );

      // Update in database
      const updateData: SubscriptionUpdate = immediately
        ? { status: 'cancelled' }
        : { status: 'active' }; // Keep active until period end

      const updatedSubscription = await this.updateSubscription(
        subscription.id,
        updateData
      );

      // Update user subscription status if immediately cancelled
      if (immediately) {
        await this.supabase
          .from('users')
          .update({ subscription_status: 'cancelled' })
          .eq('id', userId);
      }

      return { success: true, subscription: updatedSubscription || undefined };
    } catch (error) {
      console.error('Error in cancelSubscription:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }
  }

  async reactivateSubscription(userId: string): Promise<{
    success: boolean;
    subscription?: SubscriptionRecord;
    error?: string;
  }> {
    try {
      const { data: subscription, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'cancelled')
        .single();

      if (error || !subscription) {
        return { success: false, error: 'No cancelled subscription found' };
      }

      // Update subscription status
      const updatedSubscription = await this.updateSubscription(
        subscription.id,
        { status: 'active' }
      );

      // Update user status
      await this.supabase
        .from('users')
        .update({ subscription_status: 'active' })
        .eq('id', userId);

      return { success: true, subscription: updatedSubscription || undefined };
    } catch (error) {
      console.error('Error in reactivateSubscription:', error);
      return { success: false, error: 'Failed to reactivate subscription' };
    }
  }

  async logPaymentEvent(event: PaymentEvent): Promise<void> {
    try {
      // You could store payment events in a separate table for auditing
      console.log('Payment event:', event);
      
      // For now, just log to console
      // In production, you might want to store these in a payment_events table
    } catch (error) {
      console.error('Error logging payment event:', error);
    }
  }

  async syncWithStripe(userId: string): Promise<{
    success: boolean;
    subscription?: SubscriptionRecord;
    error?: string;
  }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription || !subscription.stripe_subscription_id) {
        return { success: false, error: 'No Stripe subscription to sync' };
      }

      // Get latest data from Stripe
      const stripeSubscription = await this.stripeService.getSubscription(
        subscription.stripe_subscription_id
      );

      // Update local subscription with Stripe data
      const updateData: SubscriptionUpdate = {
        status: stripeSubscription.status as any,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedSubscription = await this.updateSubscription(
        subscription.id,
        updateData
      );

      // Update user subscription status
      await this.supabase
        .from('users')
        .update({
          subscription_status: stripeSubscription.status === 'active' ? 'active' : 'inactive',
        })
        .eq('id', userId);

      return { success: true, subscription: updatedSubscription || undefined };
    } catch (error) {
      console.error('Error syncing with Stripe:', error);
      return { success: false, error: 'Failed to sync with Stripe' };
    }
  }

  async getUserSubscriptionHistory(userId: string): Promise<SubscriptionRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscription history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserSubscriptionHistory:', error);
      return [];
    }
  }

  async getSubscriptionMetrics(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    revenue: {
      monthly: number;
      yearly: number;
    };
    planDistribution: Record<string, number>;
  }> {
    try {
      const { data: subscriptions, error } = await this.supabase
        .from('subscriptions')
        .select('plan_type, status');

      if (error) {
        console.error('Error fetching subscription metrics:', error);
        return {
          totalSubscriptions: 0,
          activeSubscriptions: 0,
          cancelledSubscriptions: 0,
          revenue: { monthly: 0, yearly: 0 },
          planDistribution: {},
        };
      }

      const total = subscriptions.length;
      const active = subscriptions.filter(sub => sub.status === 'active').length;
      const cancelled = subscriptions.filter(sub => sub.status === 'cancelled').length;

      const planDistribution = subscriptions.reduce((acc, sub) => {
        acc[sub.plan_type] = (acc[sub.plan_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate revenue based on active subscriptions and plan prices
      let monthlyRevenue = 0;
      subscriptions.forEach(sub => {
        if (sub.status === 'active') {
          const plan = this.plans.find(p => p.id === sub.plan_type);
          if (plan) {
            monthlyRevenue += plan.price;
          }
        }
      });

      return {
        totalSubscriptions: total,
        activeSubscriptions: active,
        cancelledSubscriptions: cancelled,
        revenue: {
          monthly: monthlyRevenue,
          yearly: monthlyRevenue * 12,
        },
        planDistribution,
      };
    } catch (error) {
      console.error('Error in getSubscriptionMetrics:', error);
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        cancelledSubscriptions: 0,
        revenue: { monthly: 0, yearly: 0 },
        planDistribution: {},
      };
    }
  }
}