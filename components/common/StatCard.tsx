// [TeleZeta] StatCard Component
// Kartu statistik dengan emoji, label, dan value besar
'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/common/LoadingSkeleton';

interface StatCardProps {
  emoji: string;
  label: string;
  value: string | number;
  delay?: number;
  trend?: { value: string; positive: boolean };
}

export default function StatCard({ emoji, label, value, delay = 0, trend }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<string | number>(String(value));

  useEffect(() => {
    const prefersReducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    // Parse nilai numerik dari value (handle "2.4M", "68%", dll)
    const rawValue = String(value);
    const numericMatch = rawValue.match(/[\d.]+/);
    if (!numericMatch) {
      setDisplayValue(value);
      return; // Jika tidak ada angka, skip animasi
    }
    
    const targetNum = parseFloat(numericMatch[0]);
    const prefix = rawValue.slice(0, numericMatch.index);
    const suffix = rawValue.slice(
      (numericMatch.index || 0) + numericMatch[0].length
    );
    
    const duration = 1400;
    const startTime = performance.now();
    let animationFrame: number;
    
    // easeOutExpo: mulai cepat, melambat di akhir
    const easeOutExpo = (t: number) =>
      t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      
      const currentNum = targetNum * easedProgress;
      
      // Format angka sesuai tipe aslinya
      const formatted = Number.isInteger(targetNum)
        ? Math.round(currentNum).toString()
        : currentNum.toFixed(1);
      
      setDisplayValue(`${prefix}${formatted}${suffix}`);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  if (value === undefined || value === null) {
    return <Skeleton height={140} borderRadius={24} />;
  }

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
