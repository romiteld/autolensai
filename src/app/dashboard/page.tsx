'use client';

import { useAuth } from '@/common/components/providers';
import { Button } from '@/common/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/common/components/ui/card';
import { LoadingSpinner } from '@/common/components/ui/loading-spinner';

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.user_metadata?.first_name || user?.email}!
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => signOut()}
            className="ml-4"
          >
            Sign out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manage your vehicle listings and inventory.</p>
              <Button className="mt-4" variant="primary">
                View Listings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">AI-powered image processing and descriptions.</p>
              <Button className="mt-4" variant="primary">
                Process Images
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Marketing Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Automated marketing and social media campaigns.</p>
              <Button className="mt-4" variant="primary">
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Account Created</p>
                <p className="mt-1">{new Date(user?.created_at || '').toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Sign In</p>
                <p className="mt-1">{new Date(user?.last_sign_in_at || '').toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Provider</p>
                <p className="mt-1 capitalize">{user?.app_metadata?.provider || 'email'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}