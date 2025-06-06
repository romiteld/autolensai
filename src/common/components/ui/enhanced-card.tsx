'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';
import { cn } from '@/common/utils/cn';

interface EnhancedCardProps extends Omit<HTMLMotionProps<"div">, 'variants'> {
  children: ReactNode;
  variant?: 'glass' | 'premium' | 'neon' | 'gradient' | 'minimal';
  glow?: boolean;
  floating?: boolean;
  tilt?: boolean;
  className?: string;
}

const EnhancedCard = forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ 
    children, 
    variant = 'glass', 
    glow = false,
    floating = false,
    tilt = false,
    className = '',
    ...props 
  }, ref) => {
    const variants = {
      glass: 'backdrop-blur-md bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]',
      premium: 'bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-amber-500/20 shadow-2xl',
      neon: 'bg-black/50 border border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]',
      gradient: 'bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 border border-white/10',
      minimal: 'bg-white/5 border border-white/10 backdrop-blur-sm',
    };

    const floatingAnimation = floating ? {
      y: [-5, 5, -5],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    } : {};

    const tiltProps = tilt ? {
      whileHover: {
        rotateX: 5,
        rotateY: 5,
        scale: 1.02,
      },
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      }
    } : {
      whileHover: { scale: 1.02 },
      transition: { duration: 0.2 }
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative rounded-2xl p-6 overflow-hidden',
          'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300',
          'hover:before:opacity-100',
          variants[variant],
          glow && 'animate-pulse',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          ...floatingAnimation
        }}
        {...tiltProps}
        style={{
          transformStyle: tilt ? 'preserve-3d' : undefined,
          ...(glow && {
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.1)',
          })
        }}
        {...props}
      >
        {/* Animated border gradient */}
        {variant === 'premium' && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.1), transparent)',
            }}
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}

        {/* Neon glow effect */}
        {variant === 'neon' && (
          <motion.div
            className="absolute inset-0 rounded-2xl border border-blue-500"
            animate={{
              boxShadow: [
                '0 0 20px rgba(59, 130, 246, 0.3)',
                '0 0 40px rgba(59, 130, 246, 0.5)',
                '0 0 20px rgba(59, 130, 246, 0.3)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Content container */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Shimmer effect */}
        <motion.div
          className="absolute -top-1 -left-1 h-full w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12"
          initial={{ x: '-200%' }}
          animate={{ x: '400%' }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 4,
            ease: 'linear',
          }}
        />
      </motion.div>
    );
  }
);

EnhancedCard.displayName = 'EnhancedCard';

const EnhancedCardHeader = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={cn('space-y-1.5 pb-4', className)} {...props}>
      {children}
    </div>
  )
);

EnhancedCardHeader.displayName = 'EnhancedCardHeader';

const EnhancedCardTitle = forwardRef<HTMLHeadingElement, { children: ReactNode; className?: string }>(
  ({ children, className = '', ...props }, ref) => (
    <motion.h3
      ref={ref}
      className={cn('text-2xl font-bold leading-none tracking-tight', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      {...props}
    >
      {children}
    </motion.h3>
  )
);

EnhancedCardTitle.displayName = 'EnhancedCardTitle';

const EnhancedCardDescription = forwardRef<HTMLParagraphElement, { children: ReactNode; className?: string }>(
  ({ children, className = '', ...props }, ref) => (
    <motion.p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      {...props}
    >
      {children}
    </motion.p>
  )
);

EnhancedCardDescription.displayName = 'EnhancedCardDescription';

const EnhancedCardContent = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(
  ({ children, className = '', ...props }, ref) => (
    <motion.div
      ref={ref}
      className={cn('pt-0', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  )
);

EnhancedCardContent.displayName = 'EnhancedCardContent';

export { 
  EnhancedCard, 
  EnhancedCardHeader, 
  EnhancedCardTitle, 
  EnhancedCardDescription, 
  EnhancedCardContent 
};