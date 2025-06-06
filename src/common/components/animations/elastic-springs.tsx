'use client';

import { motion, useSpring, useTransform, useMotionValue, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export const ElasticContainer = ({ children }: { children: React.ReactNode }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { stiffness: 300, damping: 30 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * 0.1;
    const deltaY = (e.clientY - centerY) * 0.1;
    
    x.set(deltaX);
    y.set(deltaY);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  return (
    <motion.div
      style={{ x: xSpring, y: ySpring }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {children}
    </motion.div>
  );
};

export const SpringyNumber = ({ value, format = (n: number) => n.toString() }: { 
  value: number; 
  format?: (n: number) => string;
}) => {
  const spring = useSpring(value, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (current) => format(Math.round(current)));
  
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  
  return <motion.span>{display}</motion.span>;
};

export const JellyButton = ({ 
  children, 
  onClick,
  className = '',
  variant = 'primary'
}: { 
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const variants = {
    primary: 'from-blue-600 to-purple-600',
    secondary: 'from-gray-600 to-gray-800',
    danger: 'from-red-600 to-pink-600',
  };
  
  return (
    <motion.button
      className={`relative px-8 py-4 rounded-2xl text-white font-semibold overflow-hidden ${className}`}
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      animate={isPressed ? 'pressed' : 'idle'}
      whileHover="hover"
      variants={{
        idle: { scale: 1 },
        hover: { scale: 1.05 },
        pressed: { scale: 0.95 },
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
      }}
    >
      {/* Background with jelly effect */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${variants[variant]}`}
        variants={{
          idle: { scaleX: 1, scaleY: 1 },
          hover: { scaleX: 1.05, scaleY: 0.95 },
          pressed: { scaleX: 0.95, scaleY: 1.05 },
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
      />
      
      {/* Wobble effect on click */}
      <motion.div
        className="relative z-10"
        variants={{
          idle: { rotate: 0 },
          pressed: { 
            rotate: [0, -2, 2, -2, 2, 0],
            transition: { duration: 0.3 }
          },
        }}
      >
        {children}
      </motion.div>
      
      {/* Ripple on press */}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            className="absolute inset-0 bg-white/20"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{ borderRadius: '50%' }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export const BouncyLoader = () => {
  return (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            type: "spring",
            stiffness: 300,
            damping: 10,
          }}
        />
      ))}
    </div>
  );
};

export const ElasticModal = ({ 
  isOpen, 
  onClose, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  children: React.ReactNode;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div
              className="bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 max-w-lg w-full mx-4 pointer-events-auto"
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                rotate: 0,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }
              }}
              exit={{ 
                scale: 0.5, 
                opacity: 0, 
                rotate: 10,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }
              }}
            >
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const SpringyTabs = ({ 
  tabs, 
  activeTab, 
  onChange 
}: { 
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  
  return (
    <div className="relative flex space-x-1 bg-black/40 backdrop-blur-xl p-1 rounded-2xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        const isHovered = hoveredTab === tab;
        
        return (
          <button
            key={tab}
            className={`
              relative px-6 py-3 rounded-xl font-medium transition-colors
              ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}
            `}
            onClick={() => onChange(tab)}
            onMouseEnter={() => setHoveredTab(tab)}
            onMouseLeave={() => setHoveredTab(null)}
          >
            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
            
            {/* Hover effect */}
            <AnimatePresence>
              {isHovered && !isActive && (
                <motion.div
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
            </AnimatePresence>
            
            <span className="relative z-10">{tab}</span>
          </button>
        );
      })}
    </div>
  );
};