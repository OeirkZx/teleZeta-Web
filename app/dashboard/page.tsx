// [TeleZeta] Dashboard Root Page
// Redirect user ke dashboard sesuai role
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';

export default function DashboardPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role) {
      console.log('[TeleZeta] Redirecting to dashboard:', role);
      router.replace(`/dashboard/${role}`);
    } else if (!loading && !role) {
      router.replace('/login?message=Profil tidak ditemukan, silakan daftar ulang');
    }
  }, [role, loading, router]);

  return <PageSkeleton />;
}
