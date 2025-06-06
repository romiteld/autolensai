'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  speed?: number;
}

export const FloatingElement = ({
  children,
  className,
  intensity = 1,
  speed = 4,
}: FloatingElementProps) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-10 * intensity, 10 * intensity, -10 * intensity],
        rotateZ: [-2 * intensity, 2 * intensity, -2 * intensity],
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

export const GlassmorphicCard = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      className={`
        backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6
        shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
        ${className}
      `}
      whileHover={{
        scale: 1.02,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        transition: { duration: 0.3 },
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
};

export const ParticleField = ({ count = 50 }: { count?: number }) => {
  const particles = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, -100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            ease: 'linear',
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
};

export const AnimatedGradient = ({ className = '' }: { className?: string }) => {
  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      animate={{
        background: [
          'linear-gradient(45deg, #3b82f6, #8b5cf6)',
          'linear-gradient(90deg, #8b5cf6, #06b6d4)',
          'linear-gradient(135deg, #06b6d4, #10b981)',
          'linear-gradient(180deg, #10b981, #3b82f6)',
        ],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
};