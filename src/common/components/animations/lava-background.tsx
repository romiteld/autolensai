'use client';

import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';

export const LavaBackground = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lava blob movement with different intensities for organic motion
  const lavaBlob1X = useSpring(useTransform(mouseX, (x) => x * 0.05), { stiffness: 30, damping: 40 });
  const lavaBlob1Y = useSpring(useTransform(mouseY, (y) => y * 0.05), { stiffness: 30, damping: 40 });
  
  const lavaBlob2X = useSpring(useTransform(mouseX, (x) => x * -0.08), { stiffness: 20, damping: 50 });
  const lavaBlob2Y = useSpring(useTransform(mouseY, (y) => y * -0.08), { stiffness: 20, damping: 50 });

  const lavaBlob3X = useSpring(useTransform(mouseX, (x) => x * 0.12), { stiffness: 15, damping: 60 });
  const lavaBlob3Y = useSpring(useTransform(mouseY, (y) => y * 0.12), { stiffness: 15, damping: 60 });

  const lavaBlob4X = useSpring(useTransform(mouseX, (x) => x * -0.06), { stiffness: 25, damping: 45 });
  const lavaBlob4Y = useSpring(useTransform(mouseY, (y) => y * -0.15), { stiffness: 25, damping: 45 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX - innerWidth / 2) / innerWidth;
      const y = (clientY - innerHeight / 2) / innerHeight;
      mouseX.set(x * 80);
      mouseY.set(y * 80);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div 
      ref={containerRef}
      className="lava-background-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -3, // Behind everything else
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: 0.35, // Subtle presence
        mixBlendMode: 'soft-light', // Blend seamlessly
        willChange: 'transform',
        transform: 'translate3d(0,0,0)', // Hardware acceleration
      }}
    >
      {/* Main Lava Blobs - Automotive-themed colors */}
      <motion.div
        className="lava-blob-primary"
        style={{
          x: lavaBlob1X,
          y: lavaBlob1Y,
          background: 'radial-gradient(circle, rgba(255,69,0,0.7) 0%, rgba(255,140,0,0.5) 30%, rgba(14,165,233,0.3) 60%, transparent 80%)',
          filter: 'blur(120px)',
          width: '1200px',
          height: '1200px',
          position: 'absolute',
          borderRadius: '50%',
          left: '10%',
          top: '5%',
          willChange: 'transform',
          transform: 'translate3d(0,0,0)',
        }}
        animate={{
          scale: [1, 1.3, 1.1, 1],
          rotate: [0, 90, 180, 360],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <motion.div
        className="lava-blob-secondary"
        style={{
          x: lavaBlob2X,
          y: lavaBlob2Y,
          background: 'radial-gradient(circle, rgba(220,20,60,0.6) 0%, rgba(255,69,0,0.4) 40%, rgba(239,68,68,0.3) 70%, transparent 85%)',
          filter: 'blur(140px)',
          width: '900px',
          height: '900px',
          position: 'absolute',
          borderRadius: '50%',
          right: '5%',
          top: '30%',
          willChange: 'transform',
          transform: 'translate3d(0,0,0)',
        }}
        animate={{
          scale: [1.2, 1, 1.4, 1.2],
          rotate: [0, -120, -240, -360],
        }}
        transition={{
          duration: 38,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <motion.div
        className="lava-blob-tertiary"
        style={{
          x: lavaBlob3X,
          y: lavaBlob3Y,
          background: 'radial-gradient(circle, rgba(255,99,71,0.5) 0%, rgba(255,140,0,0.3) 50%, rgba(100,116,139,0.2) 75%, transparent 90%)',
          filter: 'blur(160px)',
          width: '1000px',
          height: '1000px',
          position: 'absolute',
          borderRadius: '50%',
          left: '40%',
          bottom: '10%',
          willChange: 'transform',
          transform: 'translate3d(0,0,0)',
        }}
        animate={{
          scale: [1.1, 1.5, 1.2, 1.1],
          rotate: [0, 150, 270, 360],
        }}
        transition={{
          duration: 52,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <motion.div
        className="lava-blob-quaternary"
        style={{
          x: lavaBlob4X,
          y: lavaBlob4Y,
          background: 'radial-gradient(circle, rgba(178,34,34,0.4) 0%, rgba(148,163,184,0.3) 60%, transparent 85%)',
          filter: 'blur(100px)',
          width: '700px',
          height: '700px',
          position: 'absolute',
          borderRadius: '50%',
          left: '65%',
          top: '60%',
          willChange: 'transform',
          transform: 'translate3d(0,0,0)',
        }}
        animate={{
          scale: [1.3, 1.1, 1.6, 1.3],
          rotate: [0, -200, -400, -540],
        }}
        transition={{
          duration: 41,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Smaller accent blobs for detail */}
      <motion.div
        className="lava-accent-warm"
        style={{
          background: 'radial-gradient(circle, rgba(255,165,0,0.3) 0%, rgba(14,165,233,0.2) 70%, transparent 90%)',
          filter: 'blur(80px)',
          width: '500px',
          height: '500px',
          position: 'absolute',
          borderRadius: '50%',
          right: '20%',
          bottom: '20%',
          willChange: 'transform',
          transform: 'translate3d(0,0,0)',
        }}
        animate={{
          scale: [1.4, 1.8, 1.4],
          rotate: [0, 180, 360],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <motion.div
        className="lava-accent-cool"
        style={{
          background: 'radial-gradient(circle, rgba(100,116,139,0.25) 0%, rgba(255,99,71,0.15) 80%, transparent 95%)',
          filter: 'blur(90px)',
          width: '600px',
          height: '600px',
          position: 'absolute',
          borderRadius: '50%',
          left: '15%',
          top: '70%',
          willChange: 'transform',
          transform: 'translate3d(0,0,0)',
        }}
        animate={{
          scale: [1.6, 1.2, 1.6],
          rotate: [0, -90, -180],
          x: [0, -25, 0],
          y: [0, 15, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Flowing lava streams - subtle automotive integration */}
      <motion.div
        className="lava-stream-primary"
        style={{
          position: 'absolute',
          width: '100%',
          height: '300px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,69,0,0.08) 30%, rgba(14,165,233,0.05) 70%, transparent 100%)',
          filter: 'blur(60px)',
          top: '25%',
          transform: 'skewY(-8deg)',
          willChange: 'transform',
        }}
        animate={{
          x: ['-120%', '220%'],
          scaleX: [1, 1.5, 1],
        }}
        transition={{
          x: { duration: 25, repeat: Infinity, ease: 'linear' },
          scaleX: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      <motion.div
        className="lava-stream-secondary"
        style={{
          position: 'absolute',
          width: '100%',
          height: '200px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.06) 40%, rgba(148,163,184,0.04) 80%, transparent 100%)',
          filter: 'blur(80px)',
          bottom: '35%',
          transform: 'skewY(12deg)',
          willChange: 'transform',
        }}
        animate={{
          x: ['-120%', '220%'],
          scaleX: [1.2, 1, 1.2],
        }}
        transition={{
          x: { duration: 32, repeat: Infinity, ease: 'linear', delay: 5 },
          scaleX: { duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 },
        }}
      />

      {/* Subtle heat distortion overlay - minimal for performance */}
      <div 
        className="heat-distortion-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.02,
          background: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='heat'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23heat)' fill='%23ff4500' /%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
          willChange: 'transform',
        }}
      />

      {/* CSS styles for responsive behavior */}
      <style>{`
        @media (max-width: 768px) {
          .lava-background-container {
            opacity: 0.25 !important;
          }
          .lava-blob-primary,
          .lava-blob-secondary,
          .lava-blob-tertiary,
          .lava-blob-quaternary {
            filter: blur(60px) !important;
          }
          .lava-stream-primary,
          .lava-stream-secondary {
            filter: blur(40px) !important;
            height: 150px !important;
          }
        }
        
        @media (max-width: 480px) {
          .lava-background-container {
            opacity: 0.15 !important;
          }
          .lava-accent-warm,
          .lava-accent-cool {
            display: none;
          }
          .heat-distortion-overlay {
            display: none;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .lava-background-container * {
            animation: none !important;
            transform: none !important;
          }
        }
        
        @media print {
          .lava-background-container {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

// For backward compatibility
export default LavaBackground;