import Stripe from 'stripe';
import { env } from '@/core/config/env';

export interface CreateCheckoutSessionParams {
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface CreatePortalSessionParams {
  customerId: string;
  returnUrl: string;
}

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(env.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2024-04-10',
    });
  }

  async createCustomer(email: string, name: string, metadata?: Record<string, string>) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata,
      });
      return customer;
    } catch (error) {
      console.error('Stripe create customer error:', error);
      throw new Error('Failed to create Stripe customer');
    }
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams) {
    try {
      const sessionData: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          userId: params.userId,
          ...params.metadata,
        },
        subscription_data: {
          metadata: {
            userId: params.userId,
          },
        },
      };

      // Add customer if provided
      if (params.customerId) {
        sessionData.customer = params.customerId;
      }

      const session = await this.stripe.checkout.sessions.create(sessionData);
      return session;
    } catch (error) {
      console.error('Stripe checkout session error:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  async createPortalSession(params: CreatePortalSessionParams) {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
      });
      return session;
    } catch (error) {
      console.error('Stripe portal session error:', error);
      throw new Error('Failed to create portal session');
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Stripe get subscription error:', error);
      throw new Error('Failed to retrieve subscription');
    }
  }

  async cancelSubscription(subscriptionId: string, immediately = false) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: !immediately,
      });
      
      if (immediately) {
        await this.stripe.subscriptions.cancel(subscriptionId);
      }
      
      return subscription;
    } catch (error) {
      console.error('Stripe cancel subscription error:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  async constructWebhookEvent(payload: string | Buffer, signature: string) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        env.get('STRIPE_WEBHOOK_SECRET')
      );
      return event;
    } catch (error) {
      console.error('Stripe webhook error:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        return this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      
      case 'customer.subscription.deleted':
        return this.handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
      
      case 'invoice.payment_succeeded':
        return this.handlePaymentSuccess(event.data.object as Stripe.Invoice);
      
      case 'invoice.payment_failed':
        return this.handlePaymentFailure(event.data.object as Stripe.Invoice);
      
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    // Update subscription in database
    console.log(`Updating subscription for user ${userId}`);
    return {
      userId,
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };
  }

  private async handleSubscriptionCancellation(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    // Handle subscription cancellation
    console.log(`Cancelling subscription for user ${userId}`);
    return {
      userId,
      subscriptionId: subscription.id,
      cancelledAt: new Date(),
    };
  }

  private async handlePaymentSuccess(invoice: Stripe.Invoice) {
    console.log(`Payment succeeded for invoice ${invoice.id}`);
    return {
      invoiceId: invoice.id,
      amountPaid: invoice.amount_paid,
      customerEmail: invoice.customer_email,
    };
  }

  private async handlePaymentFailure(invoice: Stripe.Invoice) {
    console.log(`Payment failed for invoice ${invoice.id}`);
    return {
      invoiceId: invoice.id,
      amountDue: invoice.amount_due,
      customerEmail: invoice.customer_email,
    };
  }
}