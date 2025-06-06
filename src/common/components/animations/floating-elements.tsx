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
  const particles = Array.from({ length: count }, (_, i) => {
    // Use deterministic values based on index to avoid hydration mismatch
    const seed = i * 1.618033988749; // Golden ratio for better distribution
    const left = ((seed * 100) % 100);
    const top = ((seed * 137.5) % 100); // Different multiplier for y-axis
    const duration = 2 + (seed % 3);
    const delay = (seed * 0.5) % 2;
    
    return {
      id: i,
      left,
      top,
      duration,
      delay,
    };
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-sky-400 rounded-full opacity-60"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [-20, -100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: particle.delay,
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
          'linear-gradient(45deg, #0ea5e9, #64748b)',
          'linear-gradient(90deg, #64748b, #ef4444)',
          'linear-gradient(135deg, #ef4444, #1f2937)',
          'linear-gradient(180deg, #1f2937, #0ea5e9)',
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