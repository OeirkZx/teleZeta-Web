'use client';

import { useEffect, useRef } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  staggerChildren?: boolean;
}

export default function ScrollReveal({ children, className = '', staggerChildren = false }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Memeriksa preferensi reduced motion user
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (staggerChildren) {
              const childrenCols = entry.target.querySelectorAll('.reveal-item');
              childrenCols.forEach((child, index) => {
                const el = child as HTMLElement;
                el.style.animationDelay = `${index * 0.15}s`;
                el.classList.add('animate-fadeUp');
                el.style.opacity = '1';
              });
            } else {
              const el = entry.target as HTMLElement;
              el.classList.add('animate-fadeUp');
              el.style.opacity = '1';
            }
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
      if (staggerChildren) {
        // Initial state for children
        const childrenCols = ref.current.querySelectorAll('.reveal-item');
        childrenCols.forEach(child => {
          (child as HTMLElement).style.opacity = '0';
        });
      } else {
        ref.current.style.opacity = '0';
      }
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [staggerChildren]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
