'use client';

import Link from "next/link";
import { useAuth } from "@/common/components/providers";
import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  SmoothScroll,
  ScrollProgress,
  Magnetic
} from "@/common/components/animations";
import { EnhancedButton } from "@/common/components/ui/enhanced-button";
import { HeroSection } from "@/common/components/sections/hero-section";
import { FeaturesSection } from "@/common/components/sections/features-section";
import { TestimonialsSection } from "@/common/components/sections/testimonials-section";

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const mainRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // GSAP ScrollTrigger animations
    const ctx = gsap.context(() => {
      // Header animation on scroll
      gsap.to(headerRef.current, {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(20px)',
        duration: 0.3,
        scrollTrigger: {
          trigger: document.body,
          start: 'top -100px',
          end: 'bottom bottom',
          toggleActions: 'play none none reverse',
        },
      });
      
      // Parallax effects for sections
      gsap.utils.toArray('.parallax-element').forEach((element) => {
        gsap.to(element as Element, {
          yPercent: -50,
          ease: 'none',
          scrollTrigger: {
            trigger: element as Element,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    }, mainRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <SmoothScroll>
      <div ref={mainRef} className="min-h-screen bg-black text-white relative overflow-hidden">
        <ScrollProgress />
        
        {/* Enhanced Header */}
        <motion.header 
          ref={headerRef}
          className="fixed top-0 left-0 right-0 z-50 bg-black/10 backdrop-blur-sm border-b border-white/5 transition-all duration-300"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Magnetic>
                <Link href="/" className="flex items-center group">
                  <motion.div
                    className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    AutoLensAI
                  </motion.div>
                  <motion.div 
                    className="ml-3 w-2 h-2 bg-green-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </Link>
              </Magnetic>
              
              <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 absolute left-1/2 transform -translate-x-1/2">
                {['Features', 'Pricing', 'About', 'Contact'].map((item) => (
                  <Magnetic key={item} strength={10} range={50}>
                    <Link href={`#${item.toLowerCase()}`}>
                      <motion.span
                        className="text-gray-300 hover:text-white transition-colors duration-300 font-medium text-sm lg:text-base"
                        whileHover={{ y: -2 }}
                      >
                        {item}
                      </motion.span>
                    </Link>
                  </Magnetic>
                ))}
              </nav>
              
              <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                  <Magnetic>
                    <Link href="/dashboard">
                      <EnhancedButton variant="premium" size="md" magnetic>
                        Dashboard
                      </EnhancedButton>
                    </Link>
                  </Magnetic>
                ) : (
                  <>
                    <Magnetic>
                      <Link href="/auth/login">
                        <EnhancedButton variant="ghost" size="md">
                          Sign In
                        </EnhancedButton>
                      </Link>
                    </Magnetic>
                    <Magnetic>
                      <Link href="/auth/register">
                        <EnhancedButton variant="premium" size="md" glow magnetic>
                          Get Started
                        </EnhancedButton>
                      </Link>
                    </Magnetic>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.header>

        {/* Hero Section */}
        <HeroSection isAuthenticated={isAuthenticated} className="pt-20" />
        
        {/* Features Section */}
        <FeaturesSection className="parallax-element" />
        
        {/* Testimonials Section */}
        <TestimonialsSection className="parallax-element" />
        
        {/* Pricing Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/50 to-black" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-6">
                Ready to Transform Your Sales?
              </h2>
              <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
                Join thousands of successful dealers and sellers who have revolutionized their car sales with AutoLensAI.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Magnetic strength={20} range={100}>
                  <Link href={isAuthenticated ? "/dashboard" : "/auth/register"}>
                    <EnhancedButton
                      variant="premium"
                      size="xl"
                      glow
                      magnetic
                      className="min-w-[250px]"
                    >
                      {isAuthenticated ? "Go to Dashboard" : "Start Free Trial"}
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
                  <Link href="/contact">
                    <EnhancedButton
                      variant="ghost"
                      size="xl"
                      className="min-w-[250px]"
                    >
                      Contact Sales
                    </EnhancedButton>
                  </Link>
                </Magnetic>
              </div>
              
              {user && (
                <motion.div
                  className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 backdrop-blur-sm max-w-md mx-auto"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-gray-300 mb-2">Welcome back!</p>
                  <p className="text-xl font-semibold text-white">
                    {user.user_metadata?.first_name || user.email}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>
        
        {/* Premium Footer */}
        <footer className="relative py-16 bg-gradient-to-t from-black via-gray-900 to-black border-t border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_70%)]" />
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              {/* Brand */}
              <div className="col-span-1 md:col-span-2">
                <Link href="/" className="flex items-center mb-6">
                  <motion.div
                    className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                    whileHover={{ scale: 1.05 }}
                  >
                    AutoLensAI
                  </motion.div>
                </Link>
                <p className="text-gray-400 mb-6 max-w-md">
                  Revolutionizing the automotive marketplace with AI-powered tools that transform how you sell cars. Professional results, automated workflows, maximum sales.
                </p>
                <div className="flex space-x-4">
                  {['twitter', 'linkedin', 'facebook', 'instagram'].map((social) => (
                    <Magnetic key={social} strength={10} range={30}>
                      <motion.a
                        href={`#${social}`}
                        className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 transition-all duration-300"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-sm font-bold">{social[0].toUpperCase()}</span>
                      </motion.a>
                    </Magnetic>
                  ))}
                </div>
              </div>
              
              {/* Quick Links */}
              <div>
                <h3 className="text-white font-semibold mb-4">Product</h3>
                <ul className="space-y-3">
                  {['Features', 'Pricing', 'API', 'Integrations'].map((link) => (
                    <li key={link}>
                      <Magnetic strength={5} range={20}>
                        <Link href={`#${link.toLowerCase()}`} className="text-gray-400 hover:text-white transition-colors duration-300">
                          {link}
                        </Link>
                      </Magnetic>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Support */}
              <div>
                <h3 className="text-white font-semibold mb-4">Support</h3>
                <ul className="space-y-3">
                  {['Help Center', 'Documentation', 'Contact', 'Status'].map((link) => (
                    <li key={link}>
                      <Magnetic strength={5} range={20}>
                        <Link href={`#${link.toLowerCase()}`} className="text-gray-400 hover:text-white transition-colors duration-300">
                          {link}
                        </Link>
                      </Magnetic>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">
                &copy; 2024 AutoLensAI. All rights reserved. Built with ❤️ for automotive excellence.
              </p>
              <div className="flex space-x-6 text-sm">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link) => (
                  <Magnetic key={link} strength={3} range={15}>
                    <Link href={`#${link.toLowerCase().replace(/\s+/g, '-')}`} className="text-gray-400 hover:text-white transition-colors duration-300">
                      {link}
                    </Link>
                  </Magnetic>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}