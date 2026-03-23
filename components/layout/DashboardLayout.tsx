// [TeleZeta] Dashboard Layout Wrapper
// Menggabungkan Sidebar + TopBar + Content area
'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '@/lib/hooks/useAuth';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, role, loading, signOut, user, error } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Safety timeout — if auth takes more than 8s, stop loading
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Treat timeout same as "no user" — show error state
  const effectiveLoading = loading && !timedOut;

  if (effectiveLoading) {
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

  if (error || timedOut || (!effectiveLoading && !user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4 text-center p-6" style={{ background: 'var(--bg-light)' }}>
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-2">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Sesi Tidak Valid</h2>
        <p className="text-gray-500 max-w-sm mb-4">{error || (timedOut ? 'Koneksi timeout, silakan coba lagi.' : 'Silakan login kembali untuk melanjutkan sesi Anda.')}</p>
        <button 
          className="px-6 py-3 rounded-xl font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 relative z-10 cursor-pointer"
          style={{ background: 'var(--blue-accent)' }}
          onClick={() => {
            signOut();
            // Fail-safe redirect for Android webview
            setTimeout(() => {
              window.location.href = '/login';
            }, 300);
          }}
        >
          Kembali ke Login
        </button>
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
