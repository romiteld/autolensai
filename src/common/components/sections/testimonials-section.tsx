'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { EnhancedCard, EnhancedCardContent } from '@/common/components/ui/enhanced-card';
import { Reveal, StaggeredReveal } from '@/common/components/animations/reveal';
import { TextReveal } from '@/common/components/animations/text-effects';

export const TestimonialsSection = ({ className = '' }: { className?: string }) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Car Dealer",
      company: "Premier Auto Sales",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      content: "AutoLensAI transformed our dealership completely. We're selling cars 40% faster with their AI-powered listings. The background removal is flawless, and the automated descriptions save us hours every day.",
      rating: 5,
      metrics: { increase: "40%", timeSaved: "15 hours/week" }
    },
    {
      name: "Michael Rodriguez",
      role: "Independent Seller",
      company: "Classic Car Enthusiast",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      content: "As someone who flips classic cars, presentation is everything. AutoLensAI's image processing makes my listings look like they belong in a magazine. I've doubled my profit margins.",
      rating: 5,
      metrics: { increase: "200%", satisfaction: "100%" }
    },
    {
      name: "Jessica Williams",
      role: "Marketing Director",
      company: "AutoMax Group",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      content: "The automated marketing campaigns are incredible. We reach the right buyers at the right time, and our conversion rates have tripled. The ROI speaks for itself.",
      rating: 5,
      metrics: { conversion: "300%", roi: "450%" }
    },
    {
      name: "David Park",
      role: "Fleet Manager",
      company: "Corporate Auto Solutions",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      content: "Managing 200+ vehicle listings was a nightmare before AutoLensAI. Now everything is automated, professional, and consistent. Our team productivity has skyrocketed.",
      rating: 5,
      metrics: { productivity: "180%", listings: "200+" }
    },
    {
      name: "Amanda Foster",
      role: "Digital Marketer",
      company: "Auto Innovations LLC",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      content: "The AI descriptions are so good, our customers think we hired professional copywriters. The SEO optimization has boosted our organic traffic by 250%.",
      rating: 5,
      metrics: { traffic: "250%", rankings: "Top 3" }
    }
  ];

  return (
    <section ref={sectionRef} className={`py-24 relative overflow-hidden ${className}`}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_70%)]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Reveal direction="up" delay={0.2}>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-sm mb-6">
              <span className="text-sm text-green-200 font-medium">
                ⭐ Trusted by 5000+ Customers
              </span>
            </div>
          </Reveal>
          
          <TextReveal
            text="What Our Customers Say"
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-6"
            stagger={0.02}
          />
          
          <Reveal direction="up" delay={0.8}>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Join thousands of satisfied customers who have transformed their car selling experience with AutoLensAI.
            </p>
          </Reveal>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-6xl mx-auto">
          {/* Main Testimonial Display */}
          <Reveal direction="up" delay={0.4}>
            <EnhancedCard
              variant="premium"
              className="mb-12 min-h-[400px] flex items-center justify-center"
              glow
            >
              <EnhancedCardContent className="text-center">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  {/* Quote */}
                  <div className="max-w-4xl">
                    <svg className="w-12 h-12 text-blue-400 mx-auto mb-6 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                    </svg>
                    <p className="text-2xl md:text-3xl text-white leading-relaxed italic font-light">
                      "{testimonials[activeTestimonial].content}"
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center justify-center space-x-4">
                    <motion.img
                      src={testimonials[activeTestimonial].avatar}
                      alt={testimonials[activeTestimonial].name}
                      className="w-16 h-16 rounded-full border-2 border-blue-400"
                      whileHover={{ scale: 1.1 }}
                    />
                    <div className="text-left">
                      <h4 className="text-xl font-bold text-white">
                        {testimonials[activeTestimonial].name}
                      </h4>
                      <p className="text-blue-400 font-medium">
                        {testimonials[activeTestimonial].role}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {testimonials[activeTestimonial].company}
                      </p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex justify-center space-x-8 pt-4">
                    {Object.entries(testimonials[activeTestimonial].metrics).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <p className="text-2xl font-bold text-blue-400">{value}</p>
                        <p className="text-sm text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      </div>
                    ))}
                  </div>

                  {/* Stars */}
                  <div className="flex justify-center space-x-1">
                    {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                      <motion.svg
                        key={i}
                        className="w-6 h-6 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </motion.svg>
                    ))}
                  </div>
                </motion.div>
              </EnhancedCardContent>
            </EnhancedCard>
          </Reveal>

          {/* Testimonial Navigation */}
          <div className="flex justify-center space-x-4">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-16 h-16 rounded-full border-2 overflow-hidden transition-all duration-300 ${
                  activeTestimonial === index 
                    ? 'border-blue-400 scale-110' 
                    : 'border-gray-600 hover:border-blue-400/50'
                }`}
                whileHover={{ scale: activeTestimonial === index ? 1.1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={testimonials[index].avatar}
                  alt={testimonials[index].name}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Additional Testimonials Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <StaggeredReveal staggerDelay={0.1}>
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <EnhancedCard
                key={index}
                variant="glass"
                floating={index % 2 === 0}
                className="h-full"
              >
                <EnhancedCardContent>
                  <div className="space-y-4">
                    {/* Stars */}
                    <div className="flex space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-gray-300 text-sm leading-relaxed">
                      "{testimonial.content.substring(0, 120)}..."
                    </p>

                    {/* Author */}
                    <div className="flex items-center space-x-3 pt-4 border-t border-white/10">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-white font-medium text-sm">{testimonial.name}</p>
                        <p className="text-gray-400 text-xs">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            ))}
          </StaggeredReveal>
        </div>
      </div>
    </section>
  );
};