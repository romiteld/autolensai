'use client';

import { motion, useInView, Variants } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  className?: string;
}

const createVariants = (direction: string, distance: number): Variants => {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return {
    hidden: {
      opacity: 0,
      ...directions[direction as keyof typeof directions],
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
    },
  };
};

export const Reveal = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 60,
  once = true,
  className,
}: RevealProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: '-100px' });

  const variants = createVariants(direction, distance);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggeredReveal = ({
  children,
  staggerDelay = 0.1,
  ...props
}: RevealProps & { staggerDelay?: number }) => {
  const items = Array.isArray(children) ? children : [children];

  return (
    <div>
      {items.map((child, index) => (
        <Reveal key={index} delay={index * staggerDelay} {...props}>
          {child}
        </Reveal>
      ))}
    </div>
  );
};