'use client';

import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';

export const AutomotiveFluidBackground = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Enhanced mouse tracking with automotive precision
  const engineBlue = useSpring(useTransform(mouseX, (x) => x * 0.08), { stiffness: 60, damping: 25 });
  const engineBlueY = useSpring(useTransform(mouseY, (y) => y * 0.08), { stiffness: 60, damping: 25 });
  
  const metallicX = useSpring(useTransform(mouseX, (x) => x * -0.12), { stiffness: 40, damping: 35 });
  const metallicY = useSpring(useTransform(mouseY, (y) => y * -0.12), { stiffness: 40, damping: 35 });

  const racingRedX = useSpring(useTransform(mouseX, (x) => x * 0.15), { stiffness: 25, damping: 45 });
  const racingRedY = useSpring(useTransform(mouseY, (y) => y * 0.15), { stiffness: 25, damping: 45 });

  const carbonX = useSpring(useTransform(mouseX, (x) => x * -0.06), { stiffness: 35, damping: 30 });
  const carbonY = useSpring(useTransform(mouseY, (y) => y * -0.18), { stiffness: 35, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX - innerWidth / 2) / innerWidth;
      const y = (clientY - innerHeight / 2) / innerHeight;
      mouseX.set(x * 120);
      mouseY.set(y * 120);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Precision Grid - Automotive Engineering Theme */}
      <div className="absolute inset-0 opacity-[0.08]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(14, 165, 233, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(14, 165, 233, 0.15) 1px, transparent 1px),
              linear-gradient(rgba(100, 116, 139, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100, 116, 139, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px, 50px 50px, 10px 10px, 10px 10px',
            maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 80%)',
          }}
        />
      </div>
      
      {/* Speed Lines - Dynamic Movement */}
      <motion.div
        className="absolute inset-0 opacity-15"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(14, 165, 233, 0.12) 50%, transparent 100%)',
          transform: 'skewX(-12deg)',
        }}
        animate={{
          x: ['-120%', '220%'],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Racing Stripes - Performance Accent */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(239, 68, 68, 0.15) 50%, transparent 100%)',
          transform: 'skewX(-12deg)',
        }}
        animate={{
          x: ['-120%', '220%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
          delay: 2,
        }}
      />

      <div className="absolute inset-0 opacity-25">
        {/* Electric Blue - Technology & Innovation */}
        <motion.div
          className="absolute w-[900px] h-[900px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(14,165,233,0.7) 0%, rgba(2,132,199,0.4) 40%, rgba(0,102,204,0.15) 70%, transparent 90%)',
            filter: 'blur(90px)',
            x: engineBlue,
            y: engineBlueY,
            left: '15%',
            top: '5%',
          }}
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 120, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Metallic Silver - Premium Automotive */}
        <motion.div
          className="absolute w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(148,163,184,0.6) 0%, rgba(100,116,139,0.4) 45%, rgba(71,85,105,0.2) 70%, transparent 90%)',
            filter: 'blur(85px)',
            x: metallicX,
            y: metallicY,
            right: '8%',
            top: '25%',
          }}
          animate={{
            scale: [1.1, 1, 1.1],
            rotate: [0, -150, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Racing Red - Performance & Speed */}
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(239,68,68,0.5) 0%, rgba(220,38,38,0.3) 50%, rgba(185,28,28,0.15) 75%, transparent 90%)',
            filter: 'blur(95px)',
            x: racingRedX,
            y: racingRedY,
            left: '45%',
            bottom: '5%',
          }}
          animate={{
            scale: [1, 1.25, 1],
            rotate: [0, 180, 0],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Carbon Fiber Black - Luxury & Precision */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(31,41,55,0.8) 0%, rgba(17,24,39,0.5) 50%, rgba(0,0,0,0.2) 80%, transparent 95%)',
            filter: 'blur(80px)',
            x: carbonX,
            y: carbonY,
            left: '65%',
            top: '55%',
          }}
          animate={{
            scale: [1.15, 1.35, 1.15],
            rotate: [0, -240, 0],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Chrome Accent - Luxury Detail */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(226,232,240,0.4) 0%, rgba(148,163,184,0.2) 60%, transparent 85%)',
            filter: 'blur(70px)',
            x: useSpring(useTransform(mouseX, (x) => x * 0.18), { stiffness: 45, damping: 40 }),
            y: useSpring(useTransform(mouseY, (y) => y * 0.22), { stiffness: 45, damping: 40 }),
            right: '25%',
            bottom: '25%',
          }}
          animate={{
            scale: [1.2, 1.4, 1.2],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
      
      {/* Carbon Fiber Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='6' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Automotive Accent Lines - Engineering Precision */}
      <div className="absolute inset-0 opacity-12">
        <motion.div
          className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-sky-500 to-transparent"
          style={{ top: '18%' }}
          animate={{
            opacity: [0, 0.8, 0],
            scaleX: [0, 1, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-red-500 to-transparent"
          style={{ bottom: '32%' }}
          animate={{
            opacity: [0, 0.8, 0],
            scaleX: [0, 1, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatDelay: 3,
            delay: 1.5,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-slate-400 to-transparent"
          style={{ left: '75%' }}
          animate={{
            opacity: [0, 0.6, 0],
            scaleY: [0, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatDelay: 4,
            delay: 2.5,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Performance Indicators - HUD Style */}
      <div className="absolute inset-0 opacity-8">
        <motion.div
          className="absolute top-10 right-10 w-32 h-32 border border-sky-500/30 rounded-full"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <div className="absolute inset-2 border border-sky-500/20 rounded-full" />
          <div className="absolute inset-4 border border-sky-500/10 rounded-full" />
        </motion.div>
        
        <motion.div
          className="absolute bottom-10 left-10 w-24 h-24 border border-red-500/30 rounded-full"
          animate={{
            rotate: [0, -360],
            scale: [1, 1.15, 1],
          }}
          transition={{
            rotate: { duration: 15, repeat: Infinity, ease: "linear" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 },
          }}
        >
          <div className="absolute inset-1 border border-red-500/20 rounded-full" />
        </motion.div>
      </div>
    </div>
  );
};