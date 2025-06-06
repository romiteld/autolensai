'use client';

export const LiquidFilters = () => {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        {/* Gooey effect filter */}
        <filter id="gooey">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
            result="gooey"
          />
          <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
        </filter>

        {/* Liquid morph filter */}
        <filter id="liquid-morph">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves="2"
            result="turbulence"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale="20"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="2" />
        </filter>

        {/* Viscous filter */}
        <filter id="viscous">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur5" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur10" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur20" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur30" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="50" result="blur50" />
          
          <feMerge result="merged">
            <feMergeNode in="blur5" />
            <feMergeNode in="blur10" />
            <feMergeNode in="blur20" />
            <feMergeNode in="blur30" />
            <feMergeNode in="blur50" />
          </feMerge>
          
          <feColorMatrix
            in="merged"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10"
          />
        </filter>

        {/* Water ripple filter */}
        <filter id="water-ripple">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.1"
            numOctaves="1"
            result="turbulence"
          >
            <animate
              attributeName="baseFrequency"
              values="0.01 0.1;0.02 0.15;0.01 0.1"
              dur="10s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Automotive Fluid gradient definitions */}
        <linearGradient id="fluid-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9">
            <animate
              attributeName="stop-color"
              values="#0ea5e9;#64748b;#ef4444;#0ea5e9"
              dur="8s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="#64748b">
            <animate
              attributeName="stop-color"
              values="#64748b;#ef4444;#1f2937;#64748b"
              dur="8s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="#ef4444">
            <animate
              attributeName="stop-color"
              values="#ef4444;#1f2937;#0ea5e9;#ef4444"
              dur="8s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        <radialGradient id="fluid-gradient-2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8">
            <animate
              attributeName="stopOpacity"
              values="0.8;0.4;0.8"
              dur="4s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        
        {/* Additional automotive gradients */}
        <linearGradient id="metallic-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#475569" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0.4" />
        </linearGradient>
        
        <radialGradient id="carbon-fiber-gradient" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#374151" stopOpacity="0.7" />
          <stop offset="70%" stopColor="#111827" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </radialGradient>

        {/* Organic shape masks */}
        <mask id="organic-mask-1">
          <rect width="100%" height="100%" fill="white" />
          <circle cx="50%" cy="50%" r="40%" fill="black">
            <animate
              attributeName="r"
              values="40%;45%;40%"
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>
        </mask>
      </defs>
    </svg>
  );
};

export const LiquidShape = ({ 
  className = '', 
  variant = 'gooey' 
}: { 
  className?: string; 
  variant?: 'gooey' | 'morph' | 'viscous' | 'ripple';
}) => {
  const filterMap = {
    gooey: 'url(#gooey)',
    morph: 'url(#liquid-morph)',
    viscous: 'url(#viscous)',
    ripple: 'url(#water-ripple)',
  };

  return (
    <div 
      className={className}
      style={{ 
        filter: filterMap[variant],
        willChange: 'transform, filter',
      }}
    />
  );
};