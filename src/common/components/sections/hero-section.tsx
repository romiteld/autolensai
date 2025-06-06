'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { EnhancedButton } from '@/common/components/ui/enhanced-button';
import { TextReveal, TypewriterText } from '@/common/components/animations/text-effects';
import { ParticleField, AnimatedGradient } from '@/common/components/animations/floating-elements';
import { ProceduralLavaBackground } from '@/common/components/animations/procedural-lava';
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
      {/* Enhanced Automotive Background with Procedural Mesh Animation */}
      <div className="absolute inset-0">
        {/* Procedural mesh lava background - main layer */}
        <ProceduralLavaBackground 
          className="opacity-85" 
          intensity="high" 
          showMultipleLayers={true} 
        />
        
        {/* Additional background layers for depth */}
        <AnimatedGradient className="opacity-5" />
        <ParticleField count={15} />
      </div>

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-5xl mx-auto">
          <motion.div
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Floating Badge - Centered */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <motion.div
                className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse" />
                <span className="text-sm text-blue-200 font-medium">
                  AI-Powered Car Marketplace • Now Live
                </span>
              </motion.div>
            </motion.div>

            {/* Main Heading */}
            <motion.div className="mb-8">
              <TextReveal
                text="Transform Your Car Selling Experience"
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight"
                duration={0.8}
                stagger={0.03}
              />
            </motion.div>

            {/* Subheading with proper centering and constraints */}
            <motion.div
              className="mb-12 w-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <div className="flex justify-center -ml-20 sm:-ml-32 lg:-ml-40">
                <p className="text-base sm:text-lg text-gray-300 leading-relaxed text-center max-w-sm sm:max-w-md px-4">
                  Professional AI background removal, compelling descriptions, and automated marketing campaigns that sell cars 3x faster.
                </p>
              </div>
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
              className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 text-gray-400"
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
                  className="w-3 h-3 bg-purple-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                />
                <span className="text-sm">AI-Powered Quality</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3, duration: 1 }}
        >
          <motion.div
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center mb-3"
            whileHover={{ scale: 1.1 }}
          >
            <motion.div
              className="w-1 h-3 bg-white/60 rounded-full mt-2"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
          <p className="text-xs text-gray-400 text-center whitespace-nowrap">Scroll to explore</p>
        </motion.div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </motion.section>
  );
};