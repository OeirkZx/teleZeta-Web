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
  const isNumeric = typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '');

  useEffect(() => {
    if (!isNumeric) {
      setDisplayValue(value);
      return;
    }
    
    let startTime: number;
    let animationFrame: number;
    const duration = 1200; // 1200ms
    const target = Number(value);

    // ease-out cubic
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percent = Math.min(progress / duration, 1);
      
      const easedPercent = easeOutCubic(percent);
      const currentVal = Math.floor(easedPercent * target);
      
      setDisplayValue(currentVal);

      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, isNumeric]);
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
