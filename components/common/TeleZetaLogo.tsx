// [TeleZeta] Logo Component
// Menampilkan logo TeleZeta dari file /public/logo.png dengan fallback SVG
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface TeleZetaLogoProps {
  variant?: 'dark' | 'light' | 'auto';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizes = {
  sm: { height: 81, width: 243 },
  md: { height: 108, width: 324 },
  lg: { height: 162, width: 486 },
};

// Fallback SVG — huruf Z dengan node/connection points
function LogoSVG({ variant, size }: { variant: 'dark' | 'light'; size: 'sm' | 'md' | 'lg' }) {
  const h = sizes[size].height;
  const color = variant === 'light' ? '#C8D6E8' : '#0B1F3A';
  const accentColor = variant === 'light' ? '#A8BCD4' : '#1A3A68';

  return (
    <div className="flex items-center gap-2 animate-float">
      <svg width={h} height={h} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Z shape with connection nodes */}
        <line x1="8" y1="8" x2="32" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="32" y1="8" x2="8" y2="32" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8" y1="32" x2="32" y2="32" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        {/* Node dots at Z corners */}
        <circle cx="8" cy="8" r="3.5" fill={accentColor} stroke={color} strokeWidth="1.5" />
        <circle cx="32" cy="8" r="3.5" fill={accentColor} stroke={color} strokeWidth="1.5" />
        <circle cx="8" cy="32" r="3.5" fill={accentColor} stroke={color} strokeWidth="1.5" />
        <circle cx="32" cy="32" r="3.5" fill={accentColor} stroke={color} strokeWidth="1.5" />
        {/* Center intersection node */}
        <circle cx="20" cy="20" r="2.5" fill={color} />
      </svg>
      <span
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          fontSize: h * 0.55,
          color: color,
          letterSpacing: '-0.02em',
        }}
      >
        Tele<span style={{ color: variant === 'light' ? '#4A9FD4' : '#4A9FD4' }}>Zeta</span>
      </span>
    </div>
  );
}

export default function TeleZetaLogo({ variant = 'auto', size = 'md', showText = true }: TeleZetaLogoProps) {
  const [imgError, setImgError] = useState(false);
  const resolvedVariant = variant === 'auto' ? 'dark' : variant;
  const { height, width } = sizes[size];

  const imgSrc = resolvedVariant === 'light' ? '/logo-light.png' : '/logo-dark.png';

  // If image failed to load, use SVG fallback
  if (imgError) {
    return <LogoSVG variant={resolvedVariant} size={size} />;
  }

  return (
    <div className="flex items-center gap-2 animate-float">
      <Image
        src={imgSrc}
        alt="TeleZeta Logo"
        width={showText ? width * 2.5 : width}
        height={height}
        style={{ height: height, width: 'auto', objectFit: 'contain' }}
        onError={() => setImgError(true)}
        priority
      />
    </div>
  );
}
