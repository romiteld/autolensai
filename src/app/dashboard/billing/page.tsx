'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/common/components/ui';
import { AnimatedCounter } from '@/common/components/ui/animated-counter';
import { useAuth } from '@/common/components/providers';
import { 
  CreditCard, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  ExternalLink,
  Crown,
  Zap
} from 'lucide-react';

interface SubscriptionData {
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  usage: {
    vehicles: { used: number; limit: number };
    images: { used: number; limit: number };
    videos: { used: number; limit: number };
  };
}

interface Invoice {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  created: string;
  invoice_pdf?: string;
}

const planFeatures = {
  free: {
    name: 'Free',
    price: 0,
    vehicles: 5,
    images: 10,
    videos: 2,
    features: ['Basic listing', 'AI descriptions', 'Email support']
  },
  basic: {
    name: 'Basic',
    price: 29,
    vehicles: 25,
    images: 20,
    videos: 10,
    features: ['Everything in Free', 'Marketing automation', 'Priority support', 'Analytics']
  },
  premium: {
    name: 'Premium',
    price: 99,
    vehicles: 100,
    images: 50,
    videos: 50,
    features: ['Everything in Basic', 'Advanced AI features', 'Video generation', 'Custom branding']
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    vehicles: 'Unlimited',
    images: 'Unlimited',
    videos: 'Unlimited',
    features: ['Everything in Premium', 'White-label', 'API access', 'Dedicated support']
  }
};

export default function BillingPage() {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
      fetchInvoices();
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data.subscription);
      } else {
        // Mock data for development
        setSubscriptionData({
          plan: 'basic',
          status: 'active',
          currentPeriodStart: '2024-01-01',
          currentPeriodEnd: '2024-02-01',
          cancelAtPeriodEnd: false,
          usage: {
            vehicles: { used: 8, limit: 25 },
            images: { used: 45, limit: 500 },
            videos: { used: 3, limit: 10 }
          }
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setError('Failed to load subscription data');
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/billing/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      } else {
        // Mock data for development
        setInvoices([
          {
            id: 'inv_1',
            amount: 2900,
            status: 'paid',
            created: '2024-01-01T00:00:00Z'
          },
          {
            id: 'inv_2',
            amount: 2900,
            status: 'paid',
            created: '2023-12-01T00:00:00Z'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName: string) => {
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName, mode: 'subscription' })
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError('Failed to process upgrade');
    }
  };

  const handleCustomerPortal = async () => {
    try {
      const response = await fetch('/api/payments/portal', {
        method: 'POST'
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        setError('Failed to access customer portal');
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      setError('Failed to access billing portal');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'canceled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'past_due':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getUsagePercentage = (used: number, limit: number | string) => {
    if (limit === 'Unlimited') return 0;
    return Math.round((used / Number(limit)) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const currentPlan = subscriptionData ? planFeatures[subscriptionData.plan] : planFeatures.free;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">
            Manage your subscription plan and billing information
          </p>
        </div>
        
        <Button onClick={handleCustomerPortal} variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          Billing Portal
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Current Subscription</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">{currentPlan.name} Plan</h3>
                {subscriptionData && getStatusIcon(subscriptionData.status)}
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${currentPlan.price}
                {currentPlan.price > 0 && <span className="text-sm font-normal text-gray-500">/month</span>}
              </p>
              {subscriptionData && (
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p>Status: <span className="capitalize font-medium">{subscriptionData.status}</span></p>
                  <p>Current Period: {new Date(subscriptionData.currentPeriodStart).toLocaleDateString()} - {new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}</p>
                  {subscriptionData.cancelAtPeriodEnd && (
                    <p className="text-red-600 font-medium">Cancels at period end</p>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Plan Features</h4>
              <ul className="space-y-2">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      {subscriptionData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Usage This Month</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Vehicles</span>
                  <span className="text-sm text-gray-500">
                    {subscriptionData.usage.vehicles.used} / {subscriptionData.usage.vehicles.limit === -1 ? 'Unlimited' : subscriptionData.usage.vehicles.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(getUsagePercentage(subscriptionData.usage.vehicles.used, subscriptionData.usage.vehicles.limit), 100)}%` 
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Images Processed</span>
                  <span className="text-sm text-gray-500">
                    {subscriptionData.usage.images.used} / {subscriptionData.usage.images.limit === -1 ? 'Unlimited' : subscriptionData.usage.images.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(getUsagePercentage(subscriptionData.usage.images.used, subscriptionData.usage.images.limit), 100)}%` 
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Videos Generated</span>
                  <span className="text-sm text-gray-500">
                    {subscriptionData.usage.videos.used} / {subscriptionData.usage.videos.limit === -1 ? 'Unlimited' : subscriptionData.usage.videos.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(getUsagePercentage(subscriptionData.usage.videos.used, subscriptionData.usage.videos.limit), 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(planFeatures).map(([planKey, plan]) => (
              <div 
                key={planKey}
                className={`border rounded-lg p-4 ${
                  subscriptionData?.plan === planKey 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{plan.name}</h3>
                  {subscriptionData?.plan === planKey && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Current</span>
                  )}
                </div>
                <p className="text-2xl font-bold mb-4">
                  ${plan.price}
                  {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/mo</span>}
                </p>
                <ul className="space-y-1 text-sm mb-4">
                  <li>{typeof plan.vehicles === 'number' ? plan.vehicles : plan.vehicles} vehicles</li>
                  <li>{typeof plan.images === 'number' ? `${plan.images} images/vehicle` : plan.images}</li>
                  <li>{typeof plan.videos === 'number' ? `${plan.videos} videos/month` : plan.videos}</li>
                </ul>
                {subscriptionData?.plan !== planKey && (
                  <Button 
                    onClick={() => handleUpgrade(planKey)}
                    className="w-full"
                    variant={planKey === 'premium' ? 'default' : 'outline'}
                  >
                    {planKey === 'free' ? 'Downgrade' : 'Upgrade'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Billing History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">${(invoice.amount / 100).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(invoice.created).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs rounded ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : invoice.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status}
                    </span>
                    {invoice.invoice_pdf && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No billing history available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}