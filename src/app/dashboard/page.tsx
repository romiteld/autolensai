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
    <div className="h-full flex flex-col space-y-2 sm:space-y-3 overflow-hidden">
      {/* Compact Welcome Header - Mobile Responsive */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-black/20 backdrop-blur-xl rounded-lg border border-white/10 p-2 sm:p-3 flex-shrink-0 gap-2 sm:gap-0"
      >
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center">
            <span className="truncate">Welcome back, {userName}!</span>
            <motion.span
              className="inline-block ml-2 flex-shrink-0"
              animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
              transition={{ duration: 1.5, delay: 0.5 }}
            >
              👋
            </motion.span>
          </h1>
          <p className="text-blue-200 text-xs sm:text-sm">Your AI-powered automotive command center</p>
        </div>
        <Link href="/dashboard/vehicles/create" className="flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all group text-xs sm:text-sm w-full sm:w-auto"
          >
            <div className="flex items-center justify-center space-x-2">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Add Vehicle</span>
            </div>
          </motion.button>
        </Link>
      </motion.div>

      {/* KPI Metrics Section - Mobile Responsive Grid */}
      <div id="kpi-metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 flex-shrink-0">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-black/40 backdrop-blur-xl rounded-lg sm:rounded-xl border border-white/10 p-2 sm:p-4 group hover:bg-black/60 transition-all"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r ${stat.gradient} rounded-md sm:rounded-lg flex items-center justify-center`}>
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="flex items-center space-x-1 text-green-400">
                <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3" />
                <span className="text-xs font-medium">{stat.change}</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-gray-400 text-xs leading-tight">{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions - Mobile Responsive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-black/40 backdrop-blur-xl rounded-lg sm:rounded-xl border border-white/10 p-2 sm:p-4 flex-shrink-0"
      >
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mr-2" />
            <span className="hidden sm:inline">Quick Actions</span>
            <span className="sm:hidden">Actions</span>
          </h2>
          <div className="flex items-center space-x-1 sm:space-x-2 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs hidden sm:inline">AI Ready</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {quickActions.map((action, index) => (
            <motion.div key={action.title} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href={action.href}>
                <div className={`
                  relative overflow-hidden bg-gradient-to-r ${action.gradient} rounded-md sm:rounded-lg p-2 sm:p-3 text-white group cursor-pointer
                  ${action.featured ? 'ring-1 ring-yellow-400' : ''}
                `}>
                  {action.featured && (
                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                      <Star className="h-2 w-2 sm:h-3 sm:w-3 text-yellow-300 fill-current" />
                    </div>
                  )}
                  
                  <action.icon className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold mb-1 text-xs sm:text-sm leading-tight">{action.title}</h3>
                  <p className="text-xs opacity-90 line-clamp-2 leading-tight hidden sm:block">{action.description}</p>
                  
                  <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="h-2 w-2 sm:h-3 sm:w-3" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity & Performance - Mobile Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 flex-1 min-h-0">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-black/40 backdrop-blur-xl rounded-lg sm:rounded-xl border border-white/10 p-2 sm:p-3 flex flex-col min-h-0"
        >
          <h2 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 flex items-center flex-shrink-0">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 mr-2" />
            <span className="hidden sm:inline">Recent Activity</span>
            <span className="sm:hidden">Activity</span>
          </h2>
          
          <div className="space-y-1 sm:space-y-2 overflow-y-auto flex-1">
            {recentActivity.slice(0, 3).map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/10 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                  <activity.icon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-xs sm:text-sm leading-tight">{activity.title}</p>
                  <p className="text-gray-400 text-xs truncate leading-tight hidden sm:block">{activity.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {activity.status === 'completed' ? (
                    <CheckCircle2 className="h-2 w-2 sm:h-3 sm:w-3 text-green-400" />
                  ) : (
                    <AlertCircle className="h-2 w-2 sm:h-3 sm:w-3 text-yellow-400" />
                  )}
                  <p className="text-xs text-gray-500 hidden sm:block">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Performance Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-black/40 backdrop-blur-xl rounded-lg sm:rounded-xl border border-white/10 p-2 sm:p-3 flex flex-col"
        >
          <h2 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 flex items-center flex-shrink-0">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 mr-2" />
            <span className="hidden sm:inline">Performance</span>
            <span className="sm:hidden">Stats</span>
          </h2>
          
          <div className="space-y-2 sm:space-y-3 flex-1">
            {[
              { label: "Sales", shortLabel: "Sales", value: "87%", width: "87%", color: "from-green-500 to-emerald-500" },
              { label: "AI Processing", shortLabel: "AI", value: "94%", width: "94%", color: "from-blue-500 to-purple-500" },
              { label: "Campaign ROI", shortLabel: "ROI", value: "156%", width: "100%", color: "from-yellow-500 to-orange-500" }
            ].map((metric, index) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-xs sm:text-sm">
                    <span className="sm:hidden">{metric.shortLabel}</span>
                    <span className="hidden sm:inline">{metric.label}</span>
                  </span>
                  <span className="text-white font-semibold text-xs sm:text-sm">{metric.value}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 sm:h-2">
                  <motion.div 
                    className={`bg-gradient-to-r ${metric.color} h-1.5 sm:h-2 rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: metric.width }}
                    transition={{ delay: 0.6 + index * 0.2, duration: 1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}