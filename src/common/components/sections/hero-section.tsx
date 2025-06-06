'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { EnhancedButton } from '@/common/components/ui/enhanced-button';
import { TextReveal, TypewriterText } from '@/common/components/animations/text-effects';
import { HeroBackground3D } from '@/common/components/animations/3d-effects';
import { ParticleField, AnimatedGradient } from '@/common/components/animations/floating-elements';
import { Magnetic } from '@/common/components/animations/magnetic';

interface HeroSectionProps {
  isAuthenticated: boolean;
  className?: string;
}

export const HeroSection = ({ isAuthenticated, className = '' }: HeroSectionProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <motion.section
      ref={heroRef}
      className={`relative min-h-screen flex items-center justify-center overflow-hidden ${className}`}
      style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <AnimatedGradient className="opacity-30" />
        <HeroBackground3D className="opacity-20" />
        <ParticleField count={100} />
      </div>

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/50 to-black/80" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Floating Badge */}
          <motion.div
            className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm mb-8"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
          >
            <span className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse" />
            <span className="text-sm text-blue-200 font-medium">
              AI-Powered Car Marketplace • Now Live
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.div className="mb-8">
            <TextReveal
              text="Transform Your Car Selling Experience"
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight"
              duration={0.8}
              stagger={0.03}
            />
          </motion.div>

          {/* Subheading with Typewriter Effect */}
          <motion.div
            className="mb-12 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <TypewriterText
              text="Professional AI background removal, compelling descriptions, and automated marketing campaigns that sell cars 3x faster."
              className="text-xl md:text-2xl text-gray-300 leading-relaxed"
              delay={1.5}
              speed={30}
            />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.8 }}
          >
            {isAuthenticated ? (
              <Magnetic strength={20} range={100}>
                <Link href="/dashboard">
                  <EnhancedButton
                    variant="premium"
                    size="xl"
                    glow
                    magnetic
                    className="min-w-[200px]"
                  >
                    Go to Dashboard
                    <motion.span
                      className="ml-2"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </EnhancedButton>
                </Link>
              </Magnetic>
            ) : (
              <>
                <Magnetic strength={20} range={100}>
                  <Link href="/auth/register">
                    <EnhancedButton
                      variant="premium"
                      size="xl"
                      glow
                      magnetic
                      className="min-w-[200px]"
                    >
                      Start Free Trial
                      <motion.span
                        className="ml-2"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </EnhancedButton>
                  </Link>
                </Magnetic>

                <Magnetic strength={15} range={80}>
                  <Link href="/demo">
                    <EnhancedButton
                      variant="ghost"
                      size="xl"
                      className="min-w-[200px] group"
                    >
                      <motion.span
                        className="mr-2"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        ▶
                      </motion.span>
                      Watch Demo
                    </EnhancedButton>
                  </Link>
                </Magnetic>
              </>
            )}
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="flex flex-wrap justify-center items-center gap-8 text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
          >
            <div className="flex items-center gap-2">
              <motion.div
                className="w-3 h-3 bg-green-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm">99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-3 h-3 bg-blue-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
              <span className="text-sm">5000+ Cars Processed</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-3 h-3 bg-purple-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              />
              <span className="text-sm">AI-Powered Quality</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3, duration: 1 }}
        >
          <motion.div
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
            whileHover={{ scale: 1.1 }}
          >
            <motion.div
              className="w-1 h-3 bg-white/60 rounded-full mt-2"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
          <p className="text-xs text-gray-400 mt-2">Scroll to explore</p>
        </motion.div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </motion.section>
  );
};