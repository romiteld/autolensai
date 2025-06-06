'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Card, CardContent } from '@/common/components/ui/card';
import { 
  Engine, 
  Gauge, 
  Fuel, 
  Users, 
  Settings, 
  Zap,
  Info,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';

interface SpecCard {
  id: string;
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  details: {
    technical: string;
    benefits: string[];
    comparison: string;
  };
}

const specCards: SpecCard[] = [
  {
    id: 'engine',
    title: 'Engine',
    value: '3.0L Twin-Turbo I6',
    description: 'High-performance turbocharged engine',
    icon: <Engine className="w-6 h-6" />,
    color: 'from-red-500 to-orange-500',
    details: {
      technical: 'Twin-turbocharged 3.0-liter inline-6 with BMW TwinPower Turbo technology',
      benefits: [
        'Exceptional power delivery',
        'Improved fuel efficiency',
        'Reduced emissions',
        'Advanced cooling system'
      ],
      comparison: '25% more efficient than previous generation'
    }
  },
  {
    id: 'power',
    title: 'Power',
    value: '503 HP',
    description: 'Maximum horsepower output',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-yellow-500 to-red-500',
    details: {
      technical: '503 horsepower @ 6,250 RPM with overboost function',
      benefits: [
        'Track-ready performance',
        'Instant throttle response',
        'Linear power delivery',
        'Competition-grade output'
      ],
      comparison: 'Class-leading power-to-weight ratio'
    }
  },
  {
    id: 'acceleration',
    title: 'Acceleration',
    value: '0-60 in 3.8s',
    description: 'Lightning-fast acceleration',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'from-green-500 to-blue-500',
    details: {
      technical: '0-60 mph in 3.8 seconds with launch control activated',
      benefits: [
        'Superior launch capability',
        'Optimized traction control',
        'Professional-grade timing',
        'Consistent performance'
      ],
      comparison: 'Faster than 95% of sports cars'
    }
  },
  {
    id: 'transmission',
    title: 'Transmission',
    value: '8-Speed Auto',
    description: 'Advanced automatic transmission',
    icon: <Settings className="w-6 h-6" />,
    color: 'from-blue-500 to-purple-500',
    details: {
      technical: '8-speed M Steptronic automatic with paddle shifters',
      benefits: [
        'Lightning-fast shifts',
        'Multiple driving modes',
        'Manual override option',
        'Intelligent adaptation'
      ],
      comparison: '40% faster shifts than standard auto'
    }
  },
  {
    id: 'fuel',
    title: 'Fuel Economy',
    value: '16/23 MPG',
    description: 'City and highway efficiency',
    icon: <Fuel className="w-6 h-6" />,
    color: 'from-green-500 to-teal-500',
    details: {
      technical: '16 city / 23 highway MPG with Auto Start-Stop',
      benefits: [
        'Eco-friendly operation',
        'Extended driving range',
        'Smart fuel management',
        'Reduced carbon footprint'
      ],
      comparison: 'Best-in-class for performance cars'
    }
  },
  {
    id: 'seating',
    title: 'Seating',
    value: '4 Passengers',
    description: 'Premium sport seating',
    icon: <Users className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    details: {
      technical: 'M Sport seats with 18-way power adjustment and memory',
      benefits: [
        'Track-focused design',
        'Premium leather upholstery',
        'Heated and ventilated',
        'Lumbar support system'
      ],
      comparison: 'Racing-inspired ergonomics'
    }
  }
];

interface SpecCardProps {
  spec: SpecCard;
  index: number;
}

function FlipCard({ spec, index }: SpecCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      className="relative h-64 perspective-1000"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
    >
      <motion.div
        className="relative w-full h-full transform-style-preserve-3d cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Face */}
        <motion.div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Card className="h-full bg-gradient-to-br from-gray-900 to-black border-gray-700 hover:border-gray-600 transition-colors duration-300">
            <CardContent className="p-6 h-full flex flex-col justify-between">
              <div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${spec.color} flex items-center justify-center mb-4`}>
                  {spec.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{spec.title}</h3>
                <p className="text-3xl font-bold text-white mb-2">{spec.value}</p>
                <p className="text-gray-400 text-sm">{spec.description}</p>
              </div>
              
              <motion.div 
                className="flex items-center text-blue-400 text-sm mt-4"
                whileHover={{ x: 5 }}
              >
                <Info className="w-4 h-4 mr-1" />
                Click for details
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back Face */}
        <motion.div
          className="absolute inset-0 backface-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <Card className="h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="p-6 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{spec.title}</h3>
                  <Award className="w-5 h-5 text-yellow-400" />
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-blue-400 mb-1">Technical</h4>
                    <p className="text-xs text-gray-300">{spec.details.technical}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-green-400 mb-1">Benefits</h4>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {spec.details.benefits.slice(0, 3).map((benefit, i) => (
                        <li key={i} className="flex items-center">
                          <div className="w-1 h-1 bg-green-400 rounded-full mr-2" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <motion.div 
                className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-2 mt-4"
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-xs text-yellow-400 font-medium">{spec.details.comparison}</p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function SpecCards() {
  return (
    <div className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Technical Specifications
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Explore the engineering excellence behind every component. 
            Click any card to reveal detailed specifications and benefits.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specCards.map((spec, index) => (
            <FlipCard key={spec.id} spec={spec} index={index} />
          ))}
        </div>

        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full px-6 py-3 border border-blue-500/20">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-gray-300">All specifications verified by certified technicians</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}