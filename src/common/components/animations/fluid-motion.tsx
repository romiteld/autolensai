'use client';

import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export const FluidBackground = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const blob1X = useSpring(useTransform(mouseX, (x) => x * 0.1), { stiffness: 50, damping: 30 });
  const blob1Y = useSpring(useTransform(mouseY, (y) => y * 0.1), { stiffness: 50, damping: 30 });
  
  const blob2X = useSpring(useTransform(mouseX, (x) => x * -0.15), { stiffness: 30, damping: 40 });
  const blob2Y = useSpring(useTransform(mouseY, (y) => y * -0.15), { stiffness: 30, damping: 40 });

  const blob3X = useSpring(useTransform(mouseX, (x) => x * 0.2), { stiffness: 20, damping: 50 });
  const blob3Y = useSpring(useTransform(mouseY, (y) => y * 0.2), { stiffness: 20, damping: 50 });
  
  const blob4X = useSpring(useTransform(mouseX, (x) => x * -0.12), { stiffness: 35, damping: 35 });
  const blob4Y = useSpring(useTransform(mouseY, (y) => y * -0.18), { stiffness: 35, damping: 35 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX - innerWidth / 2) / innerWidth;
      const y = (clientY - innerHeight / 2) / innerHeight;
      mouseX.set(x * 100);
      mouseY.set(y * 100);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Automotive-inspired grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)',
          }}
        />
      </div>
      
      {/* Speed lines effect */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%)',
          transform: 'skewX(-15deg)',
        }}
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      <div className="absolute inset-0 opacity-25">
        {/* Electric Blue - Technology & Innovation */}
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(14,165,233,0.6) 0%, rgba(2,132,199,0.3) 50%, transparent 70%)',
            filter: 'blur(80px)',
            x: blob1X,
            y: blob1Y,
            left: '20%',
            top: '10%',
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Metallic Silver - Premium Automotive */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(148,163,184,0.5) 0%, rgba(100,116,139,0.3) 50%, transparent 70%)',
            filter: 'blur(80px)',
            x: blob2X,
            y: blob2Y,
            right: '10%',
            top: '30%',
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Racing Red - Performance & Speed */}
        <motion.div
          className="absolute w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, rgba(220,38,38,0.2) 50%, transparent 70%)',
            filter: 'blur(80px)',
            x: blob3X,
            y: blob3Y,
            left: '50%',
            bottom: '10%',
          }}
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Carbon Fiber Black - Luxury & Precision */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(31,41,55,0.6) 0%, rgba(17,24,39,0.3) 50%, transparent 70%)',
            filter: 'blur(80px)',
            x: blob4X,
            y: blob4Y,
            left: '60%',
            top: '60%',
          }}
          animate={{
            scale: [1.1, 1.3, 1.1],
            rotate: [0, -120, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
      
      {/* Carbon fiber texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Subtle automotive-inspired accent lines */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
          style={{ top: '20%' }}
          animate={{
            opacity: [0, 1, 0],
            scaleX: [0, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-red-500 to-transparent"
          style={{ bottom: '30%' }}
          animate={{
            opacity: [0, 1, 0],
            scaleX: [0, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatDelay: 2,
            delay: 1,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  );
};

export const FluidCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Fluid gradient background */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-600/20 via-slate-600/20 to-red-600/20 backdrop-blur-xl" />
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(14,165,233,0.3), transparent 40%)',
            }}
            animate={{
              '--mouse-x': `${mouseX.get() * 100 + 50}%`,
              '--mouse-y': `${mouseY.get() * 100 + 50}%`,
            }}
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          {children}
        </div>
        
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
            transform: 'translateZ(1px)',
          }}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 1,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export const FluidButton = ({ children, onClick, className = '' }: { 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { x, y, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);
    
    onClick?.();
  };

  return (
    <motion.button
      ref={buttonRef}
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Fluid gradient background */}
      <motion.div
        className="absolute inset-0 opacity-90"
        animate={{
          background: [
            'linear-gradient(45deg, #0ea5e9, #64748b)',
            'linear-gradient(45deg, #64748b, #ef4444)',
            'linear-gradient(45deg, #ef4444, #0ea5e9)',
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <motion.div
          key={ripple.id}
          className="absolute rounded-full bg-white/30"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
          initial={{ width: 0, height: 0, x: 0, y: 0 }}
          animate={{ 
            width: 300, 
            height: 300, 
            x: -150, 
            y: -150,
            opacity: 0,
          }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      ))}
      
      {/* Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export const FluidProgress = ({ value, max = 100 }: { value: number; max?: number }) => {
  const percentage = (value / max) * 100;
  
  return (
    <div className="relative w-full h-12 rounded-full overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10">
      {/* Fluid fill */}
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{
          background: 'linear-gradient(90deg, #0ea5e9, #64748b, #ef4444)',
          filter: 'blur(0px)',
        }}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ 
          duration: 1.5, 
          ease: "easeInOut",
          type: "spring",
          stiffness: 50,
          damping: 20,
        }}
      >
        {/* Wave effect */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <motion.path
            d="M0,6 Q25,0 50,6 T100,6 L100,12 L0,12 Z"
            fill="rgba(255,255,255,0.2)"
            animate={{
              d: [
                "M0,6 Q25,0 50,6 T100,6 L100,12 L0,12 Z",
                "M0,6 Q25,12 50,6 T100,6 L100,12 L0,12 Z",
                "M0,6 Q25,0 50,6 T100,6 L100,12 L0,12 Z",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </motion.div>
      
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-white font-bold text-lg"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(percentage)}%
        </motion.span>
      </div>
    </div>
  );
};