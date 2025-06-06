'use client';

import { useAuth } from '@/common/components/providers';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '@/common/components/ui';
import { 
  Car, 
  Home, 
  Plus, 
  Settings, 
  BarChart3, 
  CreditCard,
  Menu,
  X,
  LogOut,
  Sparkles,
  Zap,
  Camera,
  Video,
  Target,
  Crown,
  Palette,
  Brain
} from 'lucide-react';

const sidebarItems = [
  { 
    href: '/dashboard', 
    label: 'Command Center', 
    icon: Home,
    gradient: 'from-blue-500 to-purple-600',
    description: 'Your AI-powered overview'
  },
  { 
    href: '/dashboard/vehicles', 
    label: 'Vehicle Fleet', 
    icon: Car,
    gradient: 'from-green-500 to-teal-600',
    description: 'Manage your inventory'
  },
  { 
    href: '/dashboard/vehicles/create', 
    label: 'Add Vehicle', 
    icon: Plus,
    gradient: 'from-orange-500 to-pink-600',
    description: 'Create new listing'
  },
  { 
    href: '/dashboard/analytics', 
    label: 'AI Insights', 
    icon: BarChart3,
    gradient: 'from-purple-500 to-indigo-600',
    description: 'Performance analytics'
  },
  { 
    href: '/dashboard/billing', 
    label: 'Billing Hub', 
    icon: CreditCard,
    gradient: 'from-yellow-500 to-orange-600',
    description: 'Subscription & usage'
  },
  { 
    href: '/dashboard/settings', 
    label: 'Preferences', 
    icon: Settings,
    gradient: 'from-gray-500 to-blue-600',
    description: 'Customize your experience'
  },
];

const quickActions = [
  { icon: Camera, label: 'AI Photo Edit', color: 'bg-gradient-to-r from-pink-500 to-rose-500' },
  { icon: Video, label: 'Generate Video', color: 'bg-gradient-to-r from-purple-500 to-violet-500' },
  { icon: Target, label: 'Launch Campaign', color: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
  { icon: Brain, label: 'AI Optimize', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500 mx-auto mb-4"></div>
            <Sparkles className="w-8 h-8 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-blue-200 font-medium">Initializing AI Systems...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div 
        className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-black/90 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-80 lg:flex-shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
          <Link href="/" className="flex items-center group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-2 w-2 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">AutoLensAI</span>
              <div className="flex items-center space-x-1">
                <Crown className="h-3 w-3 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-medium">PRO</span>
              </div>
            </div>
          </Link>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-6 border-b border-white/10">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${action.color} p-3 rounded-xl text-white text-xs font-medium shadow-lg hover:shadow-xl transition-all group`}
              >
                <action.icon className="h-4 w-4 mb-1 group-hover:scale-110 transition-transform" />
                <div>{action.label}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-6">
          <div className="space-y-2">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className={`
                      relative flex items-center px-4 py-3 rounded-xl transition-all duration-200 group overflow-hidden
                      ${active 
                        ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 shadow-lg' 
                        : 'hover:bg-white/10 border border-transparent'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    
                    <div className={`
                      relative z-10 p-2 rounded-lg mr-3 transition-all
                      ${active 
                        ? `bg-gradient-to-r ${item.gradient} shadow-lg` 
                        : 'bg-white/10 group-hover:bg-white/20'
                      }
                    `}>
                      <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-300'}`} />
                    </div>
                    
                    <div className="relative z-10 flex-1">
                      <div className={`font-medium ${active ? 'text-white' : 'text-gray-300'}`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.description}
                      </div>
                    </div>
                    
                    {active && (
                      <div className="relative z-10">
                        <Zap className="h-4 w-4 text-yellow-400" />
                      </div>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user.user_metadata?.first_name?.[0] || user.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
            </div>
            
            <div className="flex-1 ml-3 min-w-0">
              <p className="text-white font-medium truncate">
                {user.user_metadata?.first_name && user.user_metadata?.last_name 
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                  : user.email
                }
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user.email}
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={signOut}
              className="ml-2 p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-black/20 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5 text-gray-300" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">
                  AI Systems Online
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-2 sm:p-4 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}