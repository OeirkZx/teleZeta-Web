// [TeleZeta] Avatar Component
// Circle avatar dengan gradient background dan initial huruf
'use client';

import { getInitials } from '@/lib/utils/formatters';
import Image from 'next/image';
import { useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  pulse?: boolean;
  borderColor?: string;
  onClick?: () => void;
}

// Color palette untuk avatar gradient berdasarkan huruf pertama
const AVATAR_COLORS = [
  ['#4A9FD4', '#1A3A68'],
  ['#22C55E', '#166534'],
  ['#F59E0B', '#B45309'],
  ['#EF4444', '#991B1B'],
  ['#8B5CF6', '#5B21B6'],
  ['#EC4899', '#9D174D'],
  ['#14B8A6', '#0F766E'],
  ['#F97316', '#C2410C'],
];

function getColorPair(name: string): string[] {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function Avatar({ name, src, size = 40, pulse = false, borderColor, onClick }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const [color1, color2] = getColorPair(name);

  const hoverStyles = onClick ? {
    transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
    cursor: 'pointer',
  } : {};

  if (src && !imgError) {
    return (
      <div 
        className={`relative ${onClick ? 'hover:scale-105 hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)]' : ''}`} 
        style={{ width: size, height: size, ...hoverStyles }}
        onClick={onClick}
      >
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="rounded-full object-cover"
          style={{
            width: size,
            height: size,
            border: borderColor ? `2px solid ${borderColor}` : undefined,
          }}
          onError={() => setImgError(true)}
        />
        {pulse && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
            style={{ background: '#22C55E' }}
          >
            <span className="absolute inset-0 rounded-full animate-pulseRing" style={{ background: '#22C55E' }} />
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`relative ${onClick ? 'hover:scale-105 hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)]' : ''}`} 
      style={{ width: size, height: size, ...hoverStyles }}
      onClick={onClick}
    >
      <div
        className="rounded-full flex items-center justify-center text-white font-semibold"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${color1}, ${color2})`,
          fontSize: size * 0.38,
          boxShadow: `0 2px 8px ${color1}40`,
          border: borderColor ? `2px solid ${borderColor}` : undefined,
        }}
      >
        {initials}
      </div>
      {pulse && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
          style={{ background: '#22C55E' }}
        >
          <span className="absolute inset-0 rounded-full animate-pulseRing" style={{ background: '#22C55E' }} />
        </span>
      )}
    </div>
  );
}
