'use client';

import { useEffect } from 'react';
import { initializePerformanceOptimizations } from '@/common/utils/performance';

export const PerformanceInitializer = () => {
  useEffect(() => {
    // Initialize performance optimizations when component mounts
    initializePerformanceOptimizations();
    
    // Cleanup function
    return () => {
      // Any cleanup needed for performance monitoring
      console.log('🧹 Performance optimizations cleaned up');
    };
  }, []);

  // This component doesn't render anything
  return null;
};