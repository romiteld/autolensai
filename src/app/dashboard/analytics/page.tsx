'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/common/components/ui';
import { BarChart3, TrendingUp, Eye, DollarSign } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Track your vehicle listing performance and marketing metrics
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Analytics Dashboard Coming Soon</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We're building comprehensive analytics to help you track views, engagement, and performance of your vehicle listings.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">View Tracking</h4>
              <p className="text-sm text-gray-600">Monitor how many people view your listings</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Performance Metrics</h4>
              <p className="text-sm text-gray-600">Track engagement and conversion rates</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Revenue Insights</h4>
              <p className="text-sm text-gray-600">Analyze pricing and sales performance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}