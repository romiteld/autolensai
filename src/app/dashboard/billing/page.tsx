'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/common/components/ui';
import { CreditCard, Package, Clock } from 'lucide-react';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-1">
          Manage your subscription plan and billing information
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="text-center py-12">
          <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Billing Portal Coming Soon</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We're building a comprehensive billing system with subscription management and payment processing.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Subscription Plans</h4>
              <p className="text-sm text-gray-600">Choose from flexible pricing tiers</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Payment Methods</h4>
              <p className="text-sm text-gray-600">Secure payment processing with Stripe</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Usage Tracking</h4>
              <p className="text-sm text-gray-600">Monitor your API usage and limits</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}