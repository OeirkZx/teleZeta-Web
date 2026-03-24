// [TeleZeta] Auth Hook
// Hook global untuk membaca state autentikasi user dari AuthProvider secara aman
'use client';

import { useContext } from 'react';
import { AuthContext } from '@/components/providers/AuthProvider';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
