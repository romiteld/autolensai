'use client';

import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  from: number;
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export const AnimatedCounter = ({ 
  from, 
  to, 
  duration = 2, 
  className = '',
  suffix = '',
  prefix = ''
}: AnimatedCounterProps) => {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, to, { duration });
      return controls.stop;
    }
  }, [count, to, duration, isInView]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
};

interface StatisticCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  description?: string;
  className?: string;
}

export const StatisticCard = ({
  icon,
  value,
  label,
  suffix = '',
  prefix = '',
  description,
  className = ''
}: StatisticCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      className={`relative p-6 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ 
        duration: 0.6, 
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: Math.random() * 0.3 
      }}
      whileHover={{ 
        scale: 1.05,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        transition: { duration: 0.2 }
      }}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        style={{ backgroundSize: '200% 200%' }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <motion.div
          className="mb-4 p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 w-fit"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {icon}
        </motion.div>

        {/* Value */}
        <div className="mb-2">
          <AnimatedCounter
            from={0}
            to={value}
            duration={2}
            prefix={prefix}
            suffix={suffix}
            className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
          />
        </div>

        {/* Label */}
        <h3 className="text-lg font-semibold text-white mb-1">{label}</h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-300">{description}</p>
        )}
      </div>

      {/* Hover effect overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Shine effect */}
      <motion.div
        className="absolute -top-1 -left-1 h-full w-6 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12"
        initial={{ x: '-200%' }}
        animate={{ x: '400%' }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 5,
          ease: 'linear',
        }}
      />
    </motion.div>
  );
};