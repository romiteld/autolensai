import type { Database } from '@/common/types/database.types';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';
export type UserSubscriptionStatus = 'active' | 'inactive' | 'cancelled';

export interface SubscriptionRecord extends Database['public']['Tables']['subscriptions']['Row'] {}
export interface SubscriptionInsert extends Database['public']['Tables']['subscriptions']['Insert'] {}
export interface SubscriptionUpdate extends Database['public']['Tables']['subscriptions']['Update'] {}

export interface UserRecord extends Database['public']['Tables']['users']['Row'] {}

export interface CreateCheckoutRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutResponse {
  sessionId: string;
  url: string | null;
}

export interface CreatePortalRequest {
  returnUrl: string;
}

export interface CreatePortalResponse {
  url: string;
}

export interface SubscriptionData {
  id: string;
  planType: string;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeData?: {
    status: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  } | null;
}

export interface GetSubscriptionResponse {
  subscription: SubscriptionData | null;
  hasActiveSubscription: boolean;
  subscriptionStatus: string;
}

export interface CancelSubscriptionRequest {
  immediately?: boolean;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  subscription: {
    id: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: Date;
    cancelledImmediately: boolean;
  };
  message: string;
}

export interface UsageStats {
  vehicles: number;
  images: number;
  videos: number;
  storage_mb: number;
  api_calls: number;
}

export interface PlanLimits {
  vehicles: number;
  images: number;
  videos: number;
  storage_mb: number;
  api_calls: number;
}

export interface UsagePercentages {
  vehicles: number;
  images: number;
  videos: number;
  storage: number;
  apiCalls: number;
}

export interface OverLimitFlags {
  vehicles: boolean;
  images: boolean;
  videos: boolean;
  storage: boolean;
  apiCalls: boolean;
}

export interface BillingPeriod {
  start: Date;
  end: string | null;
}

export interface GetUsageResponse {
  usage: UsageStats;
  limits: PlanLimits;
  plan: string;
  billingPeriod: BillingPeriod;
  usagePercentages: UsagePercentages;
  isOverLimit: OverLimitFlags;
}

export interface PaymentEvent {
  type: 'subscription_created' | 'subscription_updated' | 'subscription_cancelled' | 'payment_succeeded' | 'payment_failed';
  userId: string;
  subscriptionId?: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  stripePriceId: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: PlanLimits;
  popular?: boolean;
}

// Stripe webhook event types we handle
export type StripeWebhookEventType = 
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed';

export interface StripeWebhookResult {
  userId?: string;
  subscriptionId?: string;
  status?: string;
  currentPeriodEnd?: Date;
  cancelledAt?: Date;
  invoiceId?: string;
  amountPaid?: number;
  amountDue?: number;
  customerEmail?: string | null;
}

// Feature access control
export interface FeatureAccess {
  canCreateVehicles: boolean;
  canUploadImages: boolean;
  canGenerateVideos: boolean;
  canAccessMarketing: boolean;
  canScheduleTestDrives: boolean;
  canAccessAnalytics: boolean;
  maxVehicles: number;
  maxImagesPerVehicle: number;
  maxVideosPerMonth: number;
}

export interface SubscriptionFeatures {
  [planType: string]: FeatureAccess;
}