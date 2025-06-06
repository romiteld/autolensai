'use client';

import { useEffect } from 'react';

export const PerformanceInitializer = () => {
  useEffect(() => {
    // Temporarily disabled performance optimizations to fix SSR issues
    // TODO: Re-enable after fixing SSR compatibility
    console.log('🚀 Performance optimizations temporarily disabled');
    
    // Cleanup function
    return () => {
      console.log('🧹 Performance optimizations cleaned up');
    };
  }, []);

  // This component doesn't render anything
  return null;
};