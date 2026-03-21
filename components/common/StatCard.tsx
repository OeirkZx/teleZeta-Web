// [TeleZeta] StatCard Component
// Kartu statistik dengan emoji, label, dan value besar
'use client';

import { useEffect, useState } from 'react';

interface StatCardProps {
  emoji: string;
  label: string;
  value: string | number;
  delay?: number;
  trend?: { value: string; positive: boolean };
}

export default function StatCard({ emoji, label, value, delay = 0, trend }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<string | number>(0);

  useEffect(() => {
    const prefersReducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
    
    const strVal = String(value);
    const match = strVal.match(/^([0-9.]+)(.*)$/);
    
    if (!match || prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }
    
    const numStr = match[1];
    const suffix = match[2];
    const target = Number(numStr);
    
    if (isNaN(target)) {
      setDisplayValue(value);
      return;
    }
    
    const hasDecimal = numStr.includes('.');
    const decimalPlaces = hasDecimal ? numStr.split('.')[1].length : 0;

    let startTime: number;
    let animationFrame: number;
    const duration = 1400; // 1400ms

    const easeOutExpo = (t: number): number => 
      t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percent = Math.min(progress / duration, 1);
      
      const easedPercent = easeOutExpo(percent);
      const currentVal = easedPercent * target;
      
      const formattedVal = hasDecimal ? currentVal.toFixed(decimalPlaces) : Math.floor(currentVal);
      setDisplayValue(`${formattedVal}${suffix}`);

      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value]);
  return (
    <div
      className="card animate-fadeUp"
      style={{
        padding: '20px',
        animationDelay: `${delay * 0.05}s`,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</div>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          fontWeight: 500,
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p className="stat-value">{displayValue}</p>
      {trend && (
        <p
          style={{
            fontSize: 12,
            color: trend.positive ? 'var(--success)' : 'var(--danger)',
            fontWeight: 500,
            marginTop: 4,
          }}
        >
          {trend.positive ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </div>
  );
}
