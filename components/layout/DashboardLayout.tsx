// [TeleZeta] Dashboard Layout Wrapper
// Menggabungkan Sidebar + TopBar + Content area
'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '@/lib/hooks/useAuth';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, role, loading, signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen" style={{ background: 'var(--bg-light)' }}>
        {/* Sidebar skeleton */}
        <div className="hidden md:block" style={{ width: 260, background: '#0B1F3A' }} />
        <div className="flex-1">
          <div style={{ height: 64, borderBottom: '1px solid var(--border-color)' }} />
          <PageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-light)' }}>
      <Sidebar
        profile={profile}
        role={role}
        onSignOut={signOut}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          userId={user?.id || null}
          profile={profile}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="animate-pageIn">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
