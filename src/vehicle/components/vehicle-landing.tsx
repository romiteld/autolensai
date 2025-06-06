'use client';

import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/common/components/ui/button';
import { Card, CardContent } from '@/common/components/ui/card';
import { 
  Reveal, 
  StaggeredReveal, 
  Magnetic, 
  TextReveal, 
  TypewriterText,
  FloatingElement,
  GlassmorphicCard,
  ParticleField,
  AnimatedGradient,
  Parallax,
  ScaleOnScroll,
  SmoothScroll,
  ScrollProgress
} from '@/common/components/animations';
import { Phone, Mail, MapPin, Star, Calendar, Gauge, Fuel, Users } from 'lucide-react';

interface VehicleData {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  color: string;
  images: string[];
  description: string;
  features: string[];
  specifications: {
    engine: string;
    power: string;
    torque: string;
    acceleration: string;
    topSpeed: string;
    fuelEconomy: string;
    drivetrain: string;
    seating: number;
  };
  seller: {
    name: string;
    rating: number;
    phone: string;
    email: string;
    location: string;
  };
}

// Mock data for demonstration
const mockVehicle: VehicleData = {
  id: '1',
  make: 'BMW',
  model: 'M4 Competition',
  year: 2023,
  price: 85000,
  mileage: 5000,
  fuelType: 'Gasoline',
  transmission: 'Automatic',
  bodyType: 'Coupe',
  color: 'Alpine White',
  images: [
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1549399297-8c2d0d94b2c8?w=800&h=600&fit=crop'
  ],
  description: 'Experience the pinnacle of performance with this stunning BMW M4 Competition. This meticulously maintained vehicle combines luxury with raw power, featuring a twin-turbocharged engine and precision engineering.',
  features: [
    'M Carbon Fiber Exterior Package',
    'Harman Kardon Surround Sound',
    'Adaptive M Suspension',
    'M Carbon Ceramic Brakes',
    'Head-Up Display',
    'Wireless Charging',
    'Premium Leather Interior',
    'Sport Exhaust System'
  ],
  specifications: {
    engine: '3.0L Twin-Turbo I6',
    power: '503 HP',
    torque: '479 lb-ft',
    acceleration: '0-60 mph in 3.8s',
    topSpeed: '155 mph (limited)',
    fuelEconomy: '16/23 mpg',
    drivetrain: 'RWD',
    seating: 4
  },
  seller: {
    name: 'Premium Auto Gallery',
    rating: 4.9,
    phone: '+1 (555) 123-4567',
    email: 'sales@premiumauto.com',
    location: 'Beverly Hills, CA'
  }
};

export default function VehicleLanding() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % mockVehicle.images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-black text-white overflow-hidden">
        <ScrollProgress />
        
        {/* Hero Section */}
        <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
          <AnimatedGradient className="opacity-20" />
          <ParticleField count={100} />
          
          <motion.div
            className="absolute inset-0 z-0"
            style={{ y: heroY, opacity: heroOpacity }}
          >
            <motion.img
              key={currentImageIndex}
              src={mockVehicle.images[currentImageIndex]}
              alt={`${mockVehicle.make} ${mockVehicle.model}`}
              className="w-full h-full object-cover"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </motion.div>

          <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
            <Reveal direction="down" delay={0.2}>
              <motion.div 
                className="text-sm uppercase tracking-widest text-blue-400 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {mockVehicle.year} • Premium Collection
              </motion.div>
            </Reveal>

            <TextReveal
              text={`${mockVehicle.make} ${mockVehicle.model}`}
              className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent"
              delay={0.5}
            />

            <Reveal direction="up" delay={1}>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
                {mockVehicle.description}
              </p>
            </Reveal>

            <Reveal direction="up" delay={1.2}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Magnetic>
                  <Button 
                    size="lg" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
                    onClick={() => setIsContactOpen(true)}
                  >
                    Contact Dealer
                  </Button>
                </Magnetic>
                <Magnetic>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white hover:text-black px-8 py-4 text-lg"
                  >
                    Schedule Test Drive
                  </Button>
                </Magnetic>
              </div>
            </Reveal>

            <motion.div
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
                <motion.div
                  className="w-1 h-3 bg-white rounded-full mt-2"
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-6">
            <StaggeredReveal staggerDelay={0.1}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <GlassmorphicCard className="text-center">
                  <motion.div 
                    className="text-3xl font-bold text-blue-400 mb-2"
                    whileHover={{ scale: 1.1 }}
                  >
                    ${mockVehicle.price.toLocaleString()}
                  </motion.div>
                  <div className="text-gray-400">Starting Price</div>
                </GlassmorphicCard>

                <GlassmorphicCard className="text-center">
                  <motion.div 
                    className="text-3xl font-bold text-green-400 mb-2"
                    whileHover={{ scale: 1.1 }}
                  >
                    {mockVehicle.mileage.toLocaleString()}
                  </motion.div>
                  <div className="text-gray-400">Miles</div>
                </GlassmorphicCard>

                <GlassmorphicCard className="text-center">
                  <motion.div 
                    className="text-3xl font-bold text-purple-400 mb-2"
                    whileHover={{ scale: 1.1 }}
                  >
                    {mockVehicle.specifications.power}
                  </motion.div>
                  <div className="text-gray-400">Horsepower</div>
                </GlassmorphicCard>

                <GlassmorphicCard className="text-center">
                  <motion.div 
                    className="text-3xl font-bold text-yellow-400 mb-2"
                    whileHover={{ scale: 1.1 }}
                  >
                    {mockVehicle.specifications.acceleration.replace('0-60 mph in ', '').replace('s', '')}s
                  </motion.div>
                  <div className="text-gray-400">0-60 mph</div>
                </GlassmorphicCard>
              </div>
            </StaggeredReveal>
          </div>
        </section>

        {/* Image Gallery */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <Reveal>
              <h2 className="text-4xl font-bold text-center mb-16">
                Exterior & Interior Gallery
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {mockVehicle.images.map((image, index) => (
                <ScaleOnScroll key={index}>
                  <motion.div
                    className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={image}
                      alt={`${mockVehicle.make} ${mockVehicle.model} - View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                </ScaleOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Specifications */}
        <section className="py-20 bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-6">
            <Reveal>
              <h2 className="text-4xl font-bold text-center mb-16">
                Technical Specifications
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(mockVehicle.specifications).map(([key, value], index) => (
                <Reveal key={key} delay={index * 0.1}>
                  <motion.div
                    className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700"
                    whileHover={{ 
                      scale: 1.05,
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderColor: 'rgba(59, 130, 246, 0.5)'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-2">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h3>
                    <p className="text-2xl font-bold text-white">{value}</p>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <Reveal>
              <h2 className="text-4xl font-bold text-center mb-16">
                Premium Features
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockVehicle.features.map((feature, index) => (
                <Reveal key={feature} delay={index * 0.1}>
                  <motion.div
                    className="flex items-center space-x-4 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
                    whileHover={{ scale: 1.02, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                  >
                    <motion.div
                      className="w-3 h-3 bg-blue-500 rounded-full"
                      whileHover={{ scale: 1.5 }}
                    />
                    <span className="text-gray-300">{feature}</span>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Floating Contact Widget */}
        <FloatingElement className="fixed bottom-8 right-8 z-50">
          <Magnetic>
            <motion.button
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl"
              onClick={() => setIsContactOpen(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Phone className="w-6 h-6" />
            </motion.button>
          </Magnetic>
        </FloatingElement>

        {/* Contact Modal */}
        {isContactOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsContactOpen(false)}
          >
            <motion.div
              className="bg-gray-900 p-8 rounded-2xl max-w-md w-full border border-gray-700"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-6 text-center">Contact Dealer</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <span>{mockVehicle.seller.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span>{mockVehicle.seller.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <span>{mockVehicle.seller.location}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>{mockVehicle.seller.rating}/5 Rating</span>
                </div>
              </div>
              <div className="flex space-x-4 mt-8">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Call Now
                </Button>
                <Button variant="outline" className="flex-1">
                  Send Email
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </SmoothScroll>
  );
}