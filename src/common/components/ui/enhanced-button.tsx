'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';
import { cn } from '@/common/utils/cn';

interface EnhancedButtonProps extends Omit<HTMLMotionProps<"button">, 'variants'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'premium' | 'magnetic';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  ripple?: boolean;
  magnetic?: boolean;
  className?: string;
}

const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    glow = false,
    ripple = true,
    magnetic = false,
    className = '',
    ...props 
  }, ref) => {
    const variants = {
      primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-blue-500/25',
      secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg hover:shadow-gray-500/25',
      ghost: 'bg-transparent border border-white/20 text-white hover:bg-white/10',
      destructive: 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg hover:shadow-red-500/25',
      premium: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black shadow-lg hover:shadow-amber-500/25 font-bold',
      magnetic: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg hover:shadow-purple-500/25',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
      xl: 'px-10 py-5 text-xl',
    };

    const glowEffect = glow ? 'animate-pulse shadow-2xl' : '';
    const magneticEffect = magnetic ? 'hover:scale-105 active:scale-95' : 'hover:scale-102 active:scale-98';

    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-xl font-semibold transition-all duration-300',
          'backdrop-blur-sm border border-white/10',
          'before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300',
          'hover:before:opacity-100',
          variants[variant],
          sizes[size],
          glowEffect,
          className
        )}
        whileHover={{ 
          scale: magnetic ? 1.05 : 1.02,
          boxShadow: glow ? '0 0 30px rgba(59, 130, 246, 0.5)' : undefined
        }}
        whileTap={{ scale: magnetic ? 0.95 : 0.98 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 17,
        }}
        {...props}
      >
        {/* Ripple effect */}
        {ripple && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-xl"
            initial={{ scale: 0, opacity: 1 }}
            whileTap={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
        
        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
        
        {/* Shine effect */}
        <motion.div
          className="absolute -top-1 -left-1 h-full w-6 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12"
          initial={{ x: '-200%' }}
          animate={{ x: '400%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: 'linear',
          }}
        />
      </motion.button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

export { EnhancedButton };