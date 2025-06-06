// Services
export { StripeService } from './services/stripe.service';
export { SubscriptionService } from './services/subscription.service';

// Types
export type {
  SubscriptionStatus,
  UserSubscriptionStatus,
  SubscriptionRecord,
  SubscriptionInsert,
  SubscriptionUpdate,
  UserRecord,
  CreateCheckoutRequest,
  CreateCheckoutResponse,
  CreatePortalRequest,
  CreatePortalResponse,
  SubscriptionData,
  GetSubscriptionResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  UsageStats,
  PlanLimits,
  UsagePercentages,
  OverLimitFlags,
  BillingPeriod,
  GetUsageResponse,
  PaymentEvent,
  SubscriptionPlan,
  StripeWebhookEventType,
  StripeWebhookResult,
  FeatureAccess,
  SubscriptionFeatures,
} from './models/payment.types';

// Utilities
export {
  SUBSCRIPTION_FEATURES,
  getUserSubscriptionInfo,
  getUserFeatureAccess,
  checkFeatureAccess,
  checkUsageLimit,
  getUserVehicleCount,
  canCreateVehicle,
  canUploadImages,
  canGenerateVideo,
  requireSubscriptionAccess,
  getUpgradeRecommendation,
} from './utils/subscription.utils';

// Middleware
export {
  withSubscriptionCheck,
  createProtectedHandler,
  requireBasicSubscription,
  requirePremiumSubscription,
  requireVideoGeneration,
  requireImageUpload,
  createVehicleCheck,
  createVideoCheck,
  withUsageLimit,
  createSubscriptionErrorResponse,
  checkAndEnforceUsageLimit,
} from './middleware/subscription.middleware';

export type { SubscriptionMiddlewareOptions } from './middleware/subscription.middleware';