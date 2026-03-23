// [TeleZeta] Dashboard Root Page
// Redirect user ke dashboard sesuai role
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';import { log, logError } from '@/lib/utils/logger';


export default function DashboardPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (role) {
      log('[TeleZeta] Redirecting to dashboard:', role);
      router.replace(`/dashboard/${role}`);
    } else {
      log('[TeleZeta] No role found, clearing session and routing to login');
      const supabase = createClient();
      supabase.auth.signOut().then(() => {
        router.replace('/login?message=Sesi tidak valid, silakan login ulang');
      });
    }
  }, [role, loading, router]);

  return <PageSkeleton />;
}
