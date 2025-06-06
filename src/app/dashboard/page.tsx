'use client';

import { useAuth } from '@/common/components/providers';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  TrendingUp, 
  Car, 
  Camera, 
  Video, 
  Zap, 
  Star,
  ArrowUpRight,
  Sparkles,
  Brain,
  Target,
  Crown,
  BarChart3,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Plus
} from 'lucide-react';

const statsCards = [
  {
    title: 'Total Vehicles',
    value: '24',
    change: '+12%',
    trend: 'up',
    icon: Car,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'AI Processing',
    value: '89%',
    change: '+5%',
    trend: 'up',
    icon: Brain,
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Total Revenue',
    value: '$45,230',
    change: '+23%',
    trend: 'up',
    icon: DollarSign,
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Active Campaigns',
    value: '12',
    change: '+8%',
    trend: 'up',
    icon: Target,
    gradient: 'from-orange-500 to-red-500'
  }
];

const quickActions = [
  {
    title: 'Add New Vehicle',
    description: 'Upload and process a new vehicle listing',
    icon: Plus,
    href: '/dashboard/vehicles/create',
    gradient: 'from-blue-600 to-purple-600',
    featured: true
  },
  {
    title: 'AI Photo Enhancement',
    description: 'Enhance vehicle photos with AI',
    icon: Camera,
    href: '/dashboard/images/process',
    gradient: 'from-pink-600 to-rose-600'
  },
  {
    title: 'Generate Marketing Video',
    description: 'Create AI-powered promotional videos',
    icon: Video,
    href: '/dashboard/videos/generate',
    gradient: 'from-purple-600 to-indigo-600'
  },
  {
    title: 'Launch Campaign',
    description: 'Start automated marketing campaign',
    icon: Target,
    href: '/dashboard/campaigns/create',
    gradient: 'from-emerald-600 to-teal-600'
  }
];

const recentActivity = [
  {
    title: 'AI Enhanced Photos',
    description: '2024 Tesla Model 3 - Background removed',
    time: '2 minutes ago',
    icon: Camera,
    status: 'completed'
  },
  {
    title: 'Video Generated',
    description: 'BMW X5 promotional video created',
    time: '15 minutes ago',
    icon: Video,
    status: 'completed'
  },
  {
    title: 'Campaign Launched',
    description: 'Facebook Marketplace campaign for Honda Civic',
    time: '1 hour ago',
    icon: Target,
    status: 'active'
  },
  {
    title: 'New Vehicle Listed',
    description: 'Mercedes-Benz C-Class added to inventory',
    time: '3 hours ago',
    icon: Car,
    status: 'completed'
  }
];

export default function DashboardPage() {
  const { user } = useAuth();

  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl border border-white/10 p-8"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                className="text-4xl font-bold text-white mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                Welcome back, {userName}! 
                <motion.span
                  className="inline-block ml-2"
                  animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                >
                  👋
                </motion.span>
              </motion.h1>
              <motion.p 
                className="text-xl text-blue-200 mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Your AI-powered automotive empire awaits
              </motion.p>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link href="/dashboard/vehicles/create">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5" />
                      <span>Create Your First Listing</span>
                      <ArrowUpRight className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </motion.button>
                </Link>
              </motion.div>
            </div>
            
            <motion.div
              className="hidden lg:block"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Crown className="h-16 w-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.5 }}
            className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 group hover:bg-black/60 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-1 text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">{stat.change}</span>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-gray-400 text-sm">{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Zap className="h-6 w-6 text-yellow-400 mr-2" />
            Quick Actions
          </h2>
          <div className="flex items-center space-x-2 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">AI Ready</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <motion.div key={action.title} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href={action.href}>
                <div className={`
                  relative overflow-hidden bg-gradient-to-r ${action.gradient} rounded-2xl p-6 text-white group cursor-pointer
                  ${action.featured ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent' : ''}
                `}>
                  {action.featured && (
                    <div className="absolute top-3 right-3">
                      <Star className="h-5 w-5 text-yellow-300 fill-current" />
                    </div>
                  )}
                  
                  <action.icon className="h-8 w-8 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                  
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <Clock className="h-5 w-5 text-blue-400 mr-2" />
            Recent Activity
          </h2>
          
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className="flex items-center space-x-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <activity.icon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{activity.title}</p>
                  <p className="text-gray-400 text-sm truncate">{activity.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    {activity.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Performance Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <BarChart3 className="h-5 w-5 text-purple-400 mr-2" />
            Performance Overview
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Sales Conversion</span>
              <span className="text-white font-semibold">87%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3">
              <motion.div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '87%' }}
                transition={{ delay: 1.5, duration: 1 }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">AI Processing</span>
              <span className="text-white font-semibold">94%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3">
              <motion.div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '94%' }}
                transition={{ delay: 1.7, duration: 1 }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Campaign ROI</span>
              <span className="text-white font-semibold">156%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3">
              <motion.div 
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 1.9, duration: 1 }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}