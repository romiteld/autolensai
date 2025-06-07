'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/common/components/ui';
import { AnimatedCounter } from '@/common/components/ui/animated-counter';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  DollarSign, 
  Car, 
  Users, 
  Calendar,
  Filter,
  Download
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalVehicles: number;
    totalViews: number;
    totalInquiries: number;
    averagePrice: number;
    totalRevenue: number;
    conversionRate: number;
  };
  vehiclePerformance: Array<{
    id: string;
    make: string;
    model: string;
    year: number;
    views: number;
    inquiries: number;
    price: number;
    status: string;
  }>;
  monthlyData: Array<{
    month: string;
    views: number;
    inquiries: number;
    sales: number;
  }>;
  topPerformers: Array<{
    id: string;
    vehicle: string;
    metric: string;
    value: number;
  }>;
}

// Mock data - in production this would come from API
const mockAnalyticsData: AnalyticsData = {
  overview: {
    totalVehicles: 12,
    totalViews: 2847,
    totalInquiries: 156,
    averagePrice: 28500,
    totalRevenue: 87400,
    conversionRate: 5.5
  },
  vehiclePerformance: [
    { id: '1', make: 'Toyota', model: 'Camry', year: 2022, views: 342, inquiries: 23, price: 25900, status: 'active' },
    { id: '2', make: 'BMW', model: 'X5', year: 2021, views: 287, inquiries: 18, price: 45200, status: 'active' },
    { id: '3', make: 'Ford', model: 'F-150', year: 2020, views: 456, inquiries: 31, price: 32800, status: 'sold' },
    { id: '4', make: 'Honda', model: 'Civic', year: 2023, views: 198, inquiries: 12, price: 22500, status: 'active' },
    { id: '5', make: 'Tesla', model: 'Model 3', year: 2022, views: 523, inquiries: 42, price: 48900, status: 'active' },
  ],
  monthlyData: [
    { month: 'Jan', views: 420, inquiries: 25, sales: 2 },
    { month: 'Feb', views: 380, inquiries: 28, sales: 1 },
    { month: 'Mar', views: 520, inquiries: 35, sales: 3 },
    { month: 'Apr', views: 610, inquiries: 42, sales: 2 },
    { month: 'May', views: 580, inquiries: 38, sales: 4 },
    { month: 'Jun', views: 720, inquiries: 48, sales: 3 },
  ],
  topPerformers: [
    { id: '1', vehicle: '2022 Tesla Model 3', metric: 'Views', value: 523 },
    { id: '2', vehicle: '2020 Ford F-150', metric: 'Inquiries', value: 31 },
    { id: '3', vehicle: '2021 BMW X5', metric: 'Engagement', value: 8.2 },
  ]
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(mockAnalyticsData);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    // In production, fetch real analytics data from API
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // const response = await fetch(`/api/analytics?timeframe=${timeframe}`);
        // const analyticsData = await response.json();
        // setData(analyticsData);
        
        // For now, use mock data
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        setData(mockAnalyticsData);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeframe]);

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'blue',
    format = 'number' 
  }: {
    title: string;
    value: number;
    change?: number;
    icon: any;
    color?: string;
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency':
          return `$${val.toLocaleString()}`;
        case 'percentage':
          return `${val}%`;
        default:
          return val.toLocaleString();
      }
    };

    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
      red: 'bg-red-50 text-red-600',
      gray: 'bg-gray-50 text-gray-600'
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <div className="flex items-center space-x-2">
                <AnimatedCounter 
                  value={value} 
                  className="text-2xl font-bold text-gray-900"
                  format={format}
                />
                {change !== undefined && (
                  <span className={`text-sm ${
                    change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change >= 0 ? '+' : ''}{change}%
                  </span>
                )}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const SimpleBarChart = ({ data, dataKey, color = 'blue' }: {
    data: any[];
    dataKey: string;
    color?: string;
  }) => {
    const maxValue = Math.max(...data.map(item => item[dataKey]));
    
    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-12 text-sm text-gray-600">{item.month}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div 
                  className={`h-6 bg-${color}-500 rounded`}
                  style={{ 
                    width: `${(item[dataKey] / maxValue) * 100}%`,
                    minWidth: '4px'
                  }}
                />
                <span className="text-sm font-medium">{item[dataKey]}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Track your vehicle listing performance and marketing metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
          
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <Download className="h-4 w-4" />
            <span className="text-sm">Export</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total Vehicles"
          value={data.overview.totalVehicles}
          change={8.2}
          icon={Car}
          color="blue"
        />
        <StatCard
          title="Total Views"
          value={data.overview.totalViews}
          change={12.5}
          icon={Eye}
          color="green"
        />
        <StatCard
          title="Inquiries"
          value={data.overview.totalInquiries}
          change={-2.1}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Avg Price"
          value={data.overview.averagePrice}
          change={5.7}
          icon={DollarSign}
          color="orange"
          format="currency"
        />
        <StatCard
          title="Revenue"
          value={data.overview.totalRevenue}
          change={15.3}
          icon={TrendingUp}
          color="green"
          format="currency"
        />
        <StatCard
          title="Conversion"
          value={data.overview.conversionRate}
          change={1.2}
          icon={BarChart3}
          color="gray"
          format="percentage"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Views Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Monthly Views</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={data.monthlyData} dataKey="views" color="blue" />
          </CardContent>
        </Card>

        {/* Monthly Inquiries Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Monthly Inquiries</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={data.monthlyData} dataKey="inquiries" color="green" />
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Vehicle</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Views</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Inquiries</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {data.vehiclePerformance.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      ${vehicle.price.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {vehicle.views.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {vehicle.inquiries}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        vehicle.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : vehicle.status === 'sold'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {((vehicle.inquiries / vehicle.views) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topPerformers.map((performer, index) => (
              <div key={performer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{performer.vehicle}</div>
                    <div className="text-sm text-gray-600">{performer.metric}</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {performer.metric === 'Engagement' ? `${performer.value}%` : performer.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}