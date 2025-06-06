/**
 * Performance optimization utilities for AutoLensAI
 * Ensures 60fps animations and optimal user experience
 */

// Performance monitoring
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  
  constructor() {
    this.measureFPS();
  }
  
  private measureFPS() {
    const measure = (currentTime: number) => {
      this.frameCount++;
      const delta = currentTime - this.lastTime;
      
      if (delta >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / delta);
        this.frameCount = 0;
        this.lastTime = currentTime;
        
        // Automatically adjust animation quality based on FPS
        this.adjustAnimationQuality();
      }
      
      requestAnimationFrame(measure);
    };
    
    requestAnimationFrame(measure);
  }
  
  private adjustAnimationQuality() {
    const root = document.documentElement;
    
    if (this.fps < 30) {
      // Reduce animation quality for better performance
      root.style.setProperty('--animation-quality', 'low');
      document.body.classList.add('low-performance');
    } else if (this.fps < 45) {
      root.style.setProperty('--animation-quality', 'medium');
      document.body.classList.remove('low-performance');
    } else {
      root.style.setProperty('--animation-quality', 'high');
      document.body.classList.remove('low-performance');
    }
  }
  
  getFPS(): number {
    return this.fps;
  }
}

// Intersection Observer for lazy animations
export class LazyAnimationObserver {
  private observer: IntersectionObserver;
  private animatedElements = new Set<Element>();
  
  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
            this.triggerAnimation(entry.target);
            this.animatedElements.add(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );
  }
  
  observe(element: Element) {
    this.observer.observe(element);
  }
  
  unobserve(element: Element) {
    this.observer.unobserve(element);
    this.animatedElements.delete(element);
  }
  
  private triggerAnimation(element: Element) {
    element.classList.add('animate-in');
    
    // Trigger any data-animation attributes
    const animation = element.getAttribute('data-animation');
    if (animation) {
      element.classList.add(animation);
    }
  }
  
  disconnect() {
    this.observer.disconnect();
    this.animatedElements.clear();
  }
}

// Debounced resize handler
export const debounceResize = (callback: () => void, delay = 100) => {
  let timeoutId: NodeJS.Timeout;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
};

// Throttled scroll handler
export const throttleScroll = (callback: () => void, delay = 16) => {
  let isThrottled = false;
  
  return () => {
    if (!isThrottled) {
      callback();
      isThrottled = true;
      setTimeout(() => {
        isThrottled = false;
      }, delay);
    }
  };
};

// GPU acceleration utilities
export const enableGPUAcceleration = (element: HTMLElement) => {
  element.style.transform = 'translateZ(0)';
  element.style.willChange = 'transform';
  element.style.backfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
};

export const disableGPUAcceleration = (element: HTMLElement) => {
  element.style.transform = '';
  element.style.willChange = '';
  element.style.backfaceVisibility = '';
  element.style.perspective = '';
};

// Animation frame utilities
export class AnimationFrameManager {
  private animationId: number | null = null;
  private callbacks: (() => void)[] = [];
  
  add(callback: () => void) {
    this.callbacks.push(callback);
    this.start();
  }
  
  remove(callback: () => void) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
    
    if (this.callbacks.length === 0) {
      this.stop();
    }
  }
  
  private start() {
    if (this.animationId === null) {
      this.animationId = requestAnimationFrame(this.tick.bind(this));
    }
  }
  
  private stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  private tick() {
    this.callbacks.forEach(callback => callback());
    this.animationId = requestAnimationFrame(this.tick.bind(this));
  }
}

// Memory leak prevention
export const cleanupAnimations = (container: HTMLElement) => {
  // Remove all animation classes
  const animatedElements = container.querySelectorAll('[class*="animate"]');
  animatedElements.forEach(element => {
    const classes = Array.from(element.classList);
    classes.forEach(className => {
      if (className.includes('animate')) {
        element.classList.remove(className);
      }
    });
  });
  
  // Clear any inline styles that might cause memory leaks
  const styledElements = container.querySelectorAll('[style]');
  styledElements.forEach(element => {
    const htmlElement = element as HTMLElement;
    htmlElement.style.transform = '';
    htmlElement.style.willChange = '';
    htmlElement.style.animation = '';
  });
};

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload critical fonts
  const fontPreloads = [
    'Geist Sans',
    'Geist Mono'
  ];
  
  fontPreloads.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = `/fonts/${font.toLowerCase().replace(' ', '-')}.woff2`;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
  
  // Preload critical images
  const criticalImages = [
    '/images/hero-bg.webp',
    '/images/car-showcase.webp'
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

// Accessibility helpers
export const respectReducedMotion = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  const updateMotionPreference = (mediaQuery: MediaQueryListEvent | MediaQueryList) => {
    if (mediaQuery.matches) {
      document.body.classList.add('reduce-motion');
      // Disable complex animations
      document.querySelectorAll('.morphing-gradient, .particle, .complex-animation').forEach(element => {
        (element as HTMLElement).style.animation = 'none';
      });
    } else {
      document.body.classList.remove('reduce-motion');
    }
  };
  
  updateMotionPreference(prefersReducedMotion);
  prefersReducedMotion.addEventListener('change', updateMotionPreference);
};

// High contrast mode support
export const respectHighContrast = () => {
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
  
  const updateContrastPreference = (mediaQuery: MediaQueryListEvent | MediaQueryList) => {
    if (mediaQuery.matches) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };
  
  updateContrastPreference(prefersHighContrast);
  prefersHighContrast.addEventListener('change', updateContrastPreference);
};

// Initialize performance optimizations
export const initializePerformanceOptimizations = () => {
  // Start performance monitoring
  new PerformanceMonitor();
  
  // Setup accessibility preferences
  respectReducedMotion();
  respectHighContrast();
  
  // Preload critical resources
  preloadCriticalResources();
  
  // Add global performance classes
  document.body.classList.add('gpu-accelerated');
  
  // Setup global error handling for animations
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message.includes('animation')) {
      console.warn('Animation error detected, falling back to reduced animations');
      document.body.classList.add('low-performance');
    }
  });
  
  console.log('🚀 AutoLensAI Performance Optimizations Initialized');
};

// Export singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const lazyAnimationObserver = new LazyAnimationObserver();
export const animationFrameManager = new AnimationFrameManager();