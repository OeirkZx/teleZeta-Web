'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  staggerChildren?: boolean;
}

export default function ScrollReveal({ children, className = '', staggerChildren = false }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.07,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  // Use the group class and our custom is-visible state for declarative CSS animations
  // Children with `reveal-item` will react to `.is-visible` 
  return (
    <div 
      ref={ref} 
      className={`${className} ${staggerChildren ? 'stagger-reveal-group' : 'reveal-group'} ${isVisible ? 'is-visible' : ''}`}
    >
      {children}
    </div>
  );
}
