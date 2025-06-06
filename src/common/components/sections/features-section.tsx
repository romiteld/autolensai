'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  EnhancedCard, 
  EnhancedCardHeader, 
  EnhancedCardTitle, 
  EnhancedCardDescription, 
  EnhancedCardContent 
} from '@/common/components/ui/enhanced-card';
import { Vehicle3DShowcase, InteractiveCarCard } from '@/common/components/animations/3d-effects';
import { Reveal, StaggeredReveal } from '@/common/components/animations/reveal';
import { TextReveal } from '@/common/components/animations/text-effects';
import { StatisticCard } from '@/common/components/ui/animated-counter';

export const FeaturesSection = ({ className = '' }: { className?: string }) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const features = [
    {
      icon: (
        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: "AI Image Processing",
      description: "Professional background removal with pixel-perfect precision. Our AI analyzes vehicle contours and lighting to create stunning, showroom-quality images.",
      benefits: ["99.5% accuracy rate", "Batch processing", "Real-time preview", "Multiple formats"],
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: (
        <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      title: "Smart Descriptions",
      description: "Generate compelling, SEO-optimized vehicle descriptions that highlight key features and drive buyer interest with advanced natural language processing.",
      benefits: ["SEO optimized", "Emotional triggers", "Feature highlighting", "Multiple variants"],
      gradient: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: (
        <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Automated Marketing",
      description: "Multi-platform campaign automation with intelligent scheduling, A/B testing, and performance optimization across social media channels.",
      benefits: ["Multi-platform", "Smart scheduling", "A/B testing", "Analytics dashboard"],
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: (
        <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Advanced Analytics",
      description: "Comprehensive performance tracking with real-time insights, conversion analytics, and actionable recommendations to maximize your sales.",
      benefits: ["Real-time insights", "Conversion tracking", "ROI analysis", "Custom reports"],
      gradient: "from-yellow-500/20 to-orange-500/20"
    },
    {
      icon: (
        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      ),
      title: "Workflow Automation",
      description: "Streamlined processes from upload to sale with intelligent task prioritization, automated follow-ups, and seamless integrations.",
      benefits: ["Task automation", "Smart prioritization", "CRM integration", "Custom workflows"],
      gradient: "from-indigo-500/20 to-blue-500/20"
    },
    {
      icon: (
        <svg className="w-8 h-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: "Customer Engagement",
      description: "Intelligent lead qualification, automated responses, and personalized buyer experiences that convert prospects into customers.",
      benefits: ["Lead scoring", "Auto responses", "Personalization", "Multi-channel"],
      gradient: "from-pink-500/20 to-rose-500/20"
    }
  ];

  const statistics = [
    {
      icon: (
        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      value: 300,
      suffix: "%",
      label: "Sales Increase",
      description: "Average sales boost"
    },
    {
      icon: (
        <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      value: 75,
      suffix: "%",
      label: "Time Saved",
      description: "On listing creation"
    },
    {
      icon: (
        <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      value: 99.5,
      suffix: "%",
      label: "Accuracy Rate",
      description: "AI processing precision"
    },
    {
      icon: (
        <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      value: 5000,
      suffix: "+",
      label: "Happy Customers",
      description: "Across the platform"
    }
  ];

  return (
    <section ref={sectionRef} className={`py-24 relative ${className}`}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/50 to-black" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <Reveal direction="up" delay={0.2}>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm mb-6">
              <span className="text-sm text-blue-200 font-medium">
                🚀 Powered by Advanced AI
              </span>
            </div>
          </Reveal>
          
          <TextReveal
            text="Revolutionary Features That Drive Sales"
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-6"
            stagger={0.02}
          />
          
          <Reveal direction="up" delay={0.8}>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the future of automotive sales with our comprehensive AI-powered platform designed to maximize your success.
            </p>
          </Reveal>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          <StaggeredReveal staggerDelay={0.1}>
            {statistics.map((stat, index) => (
              <StatisticCard
                key={index}
                icon={stat.icon}
                value={stat.value}
                suffix={stat.suffix}
                label={stat.label}
                description={stat.description}
              />
            ))}
          </StaggeredReveal>
        </div>

        {/* 3D Vehicle Showcase */}
        <Reveal direction="up" delay={0.4}>
          <div className="mb-20">
            <Vehicle3DShowcase className="rounded-3xl overflow-hidden border border-white/10" />
          </div>
        </Reveal>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <StaggeredReveal staggerDelay={0.1}>
            {features.map((feature, index) => (
              <EnhancedCard
                key={index}
                variant="glass"
                tilt
                floating={index % 2 === 0}
                className="h-full"
              >
                <EnhancedCardHeader>
                  <motion.div
                    className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} w-fit mb-4`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <EnhancedCardTitle className="text-white">
                    {feature.title}
                  </EnhancedCardTitle>
                  <EnhancedCardDescription className="text-gray-300">
                    {feature.description}
                  </EnhancedCardDescription>
                </EnhancedCardHeader>
                <EnhancedCardContent>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <motion.li
                        key={benefitIndex}
                        className="flex items-center text-sm text-gray-400"
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.5 + benefitIndex * 0.1 }}
                      >
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3" />
                        {benefit}
                      </motion.li>
                    ))}
                  </ul>
                </EnhancedCardContent>
              </EnhancedCard>
            ))}
          </StaggeredReveal>
        </div>

        {/* Interactive Car Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StaggeredReveal staggerDelay={0.2}>
            <InteractiveCarCard
              title="2023 Tesla Model S"
              description="Luxury electric sedan with autopilot"
              price="$89,990"
              className="h-full"
            />
            <InteractiveCarCard
              title="2022 BMW M3"
              description="High-performance sports sedan"
              price="$72,800"
              className="h-full"
            />
            <InteractiveCarCard
              title="2024 Audi Q8"
              description="Premium luxury SUV"
              price="$68,900"
              className="h-full"
            />
          </StaggeredReveal>
        </div>
      </div>
    </section>
  );
};