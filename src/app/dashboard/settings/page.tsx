'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/common/components/ui';
import { Settings, User, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account preferences and application settings
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="text-center py-12">
          <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Settings Page Coming Soon</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We're building comprehensive settings to help you customize your AutoLensAI experience.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-blue-50 rounded-lg">
              <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Profile Settings</h4>
              <p className="text-sm text-gray-600">Update your personal information</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <Bell className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Notifications</h4>
              <p className="text-sm text-gray-600">Configure email and push notifications</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Privacy & Security</h4>
              <p className="text-sm text-gray-600">Manage your privacy preferences</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}