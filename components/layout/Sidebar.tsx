// [TeleZeta] Sidebar Component
// Sidebar navigasi dark navy dengan gradient background
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TeleZetaLogo from '@/components/common/TeleZetaLogo';
import Avatar from '@/components/common/Avatar';
import type { Profile, UserRole } from '@/lib/types';
import {
  Home, Search, Calendar, ClipboardList, Pill, User,
  Clock, Users, FileText, BarChart3, Package, History, LogOut, X, Loader2
} from 'lucide-react';

interface SidebarProps {
  profile: Profile | null;
  role: UserRole | null;
  onSignOut: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

// Konfigurasi menu navigasi berdasarkan role
const NAV_ITEMS: Record<UserRole, { label: string; href: string; icon: React.ReactNode; badgeKey?: string }[]> = {
  patient: [
    { label: 'Beranda', href: '/dashboard/patient', icon: <Home size={20} /> },
    { label: 'Cari Dokter', href: '/dashboard/patient/doctors', icon: <Search size={20} /> },
    { label: 'Jadwal', href: '/dashboard/patient/appointments', icon: <Calendar size={20} />, badgeKey: 'appointments' },
    { label: 'Rekam Medis', href: '/dashboard/patient/records', icon: <ClipboardList size={20} /> },
    { label: 'Resep Digital', href: '/dashboard/patient/prescriptions', icon: <Pill size={20} /> },
    { label: 'Profil Saya', href: '/dashboard/patient/profile', icon: <User size={20} /> },
  ],
  doctor: [
    { label: 'Beranda', href: '/dashboard/doctor', icon: <Home size={20} /> },
    { label: 'Jadwal Konsultasi', href: '/dashboard/doctor/schedule', icon: <Clock size={20} /> },
    { label: 'Daftar Pasien', href: '/dashboard/doctor/patients', icon: <Users size={20} /> },
    { label: 'Tulis Rekam Medis', href: '/dashboard/doctor/write-record', icon: <FileText size={20} /> },
    { label: 'Statistik', href: '/dashboard/doctor/stats', icon: <BarChart3 size={20} /> },
    { label: 'Profil Saya', href: '/dashboard/doctor/profile', icon: <User size={20} /> },
  ],
  pharmacist: [
    { label: 'Beranda', href: '/dashboard/pharmacist', icon: <Home size={20} /> },
    { label: 'Antrian Resep', href: '/dashboard/pharmacist/queue', icon: <ClipboardList size={20} /> },
    { label: 'Riwayat Resep', href: '/dashboard/pharmacist/history', icon: <History size={20} /> },
    { label: 'Manajemen Stok', href: '/dashboard/pharmacist/inventory', icon: <Package size={20} /> },
    { label: 'Profil Saya', href: '/dashboard/pharmacist/profile', icon: <User size={20} /> },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  patient: 'Pasien',
  doctor: 'Dokter',
  pharmacist: 'Apoteker',
};

export default function Sidebar({ profile, role, onSignOut, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const items = role ? NAV_ITEMS[role] : [];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await onSignOut();
    // isLoggingOut tidak perlu di-reset karena halaman akan redirect
  };

  const sidebarContent = (
    <div
      className="flex flex-col h-full bg-[#0B1F3A]"
      style={{
        background: 'linear-gradient(180deg, #0B1F3A 0%, #112848 100%)',
        width: 'var(--sidebar-width, 280px)',
        minWidth: '280px',
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <TeleZetaLogo variant="light" size="md" />
        {mobileOpen && (
          <button onClick={onMobileClose} className="text-white/60 hover:text-white md:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* User Block */}
      <div className="mx-4 mb-4 mt-2">
        <div
          className="flex items-center gap-3 p-3"
          style={{
            background: 'rgba(255,255,255,0.07)',
            borderRadius: 12,
          }}
        >
          <Avatar
            name={profile?.full_name || 'User'}
            src={profile?.avatar_url}
            size={36}
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {profile?.full_name || 'Loading...'}
            </p>
            <p className="text-xs" style={{ color: '#A8BCD4' }}>
              {role ? ROLE_LABELS[role] : '...'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {items.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              style={{
                opacity: 0,
                animation: `fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.055}s forwards`,
              }}
              onClick={onMobileClose}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="px-3 pb-5 pt-3">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="sidebar-nav-item w-full hover:text-red-400"
          style={{ color: isLoggingOut ? '#9CA3AF' : '#A8BCD4' }}
        >
          {isLoggingOut ? (
            <>
              <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span>Keluar...</span>
            </>
          ) : (
            <>
              <LogOut size={20} />
              <span>Keluar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={onMobileClose}
            style={{ transition: 'opacity 0.3s ease' }}
          />
          <aside 
            className="relative z-[100] h-screen animate-slideRight bg-[#0B1F3A] shadow-2xl" 
            style={{ minWidth: '280px', transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)' }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
