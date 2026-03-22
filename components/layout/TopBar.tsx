// [TeleZeta] TopBar Component
// Top bar dengan notifikasi bell dan menu mobile
'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/utils/formatters';
import type { Notification, Profile } from '@/lib/types';
import Avatar from '@/components/common/Avatar';

interface TopBarProps {
  userId: string | null;
  profile: Profile | null;
  onMenuClick?: () => void;
}

export default function TopBar({ userId, profile, onMenuClick }: TopBarProps) {
  const { notifications: realNotifications, unreadCount: realUnread, markAsRead, markAllAsRead } = useNotifications(userId);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const notifications: Notification[] = realNotifications;
  const unreadCount = realUnread;
  
  const [prevUnread, setPrevUnread] = useState(unreadCount);
  const [wiggle, setWiggle] = useState(false);

  useEffect(() => {
    if (unreadCount > prevUnread) {
      setWiggle(true);
      const timer = setTimeout(() => setWiggle(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevUnread(unreadCount);
  }, [unreadCount, prevUnread]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6"
      style={{
        height: 64,
        background: 'rgba(238, 243, 248, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-white/60"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Menu size={22} />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notification Bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          className="relative p-2 rounded-lg hover:bg-white/60 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span
              className={`absolute -top-0.5 -right-0.5 flex items-center justify-center text-white text-xs font-bold animate-bounceIn ${wiggle ? 'animate-wiggle' : ''}`}
              style={{
                background: 'var(--danger)',
                width: 18,
                height: 18,
                borderRadius: '50%',
                fontSize: 10,
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification dropdown */}
        {showNotifs && (
          <div
            className="absolute right-0 top-12 w-80 card animate-slideDown overflow-hidden"
            style={{ maxHeight: 400, transition: 'opacity 0.2s ease' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Notifikasi
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium"
                  style={{ color: 'var(--blue-accent)' }}
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  <p className="text-sm">Tidak ada notifikasi</p>
                </div>
              ) : (
                notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                  onClick={() => {
                    if (!notif.is_read) markAsRead(notif.id);
                    setShowNotifs(false);
                  }}
                  className="flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{
                    background: notif.is_read ? 'transparent' : 'rgba(74,159,212,0.06)',
                    borderBottom: '1px solid rgba(200,216,232,0.5)',
                  }}
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{
                      background: notif.is_read ? '#EEF3F8' : 'rgba(74,159,212,0.15)',
                      color: notif.is_read ? 'var(--text-muted)' : 'var(--blue-accent)',
                    }}
                  >
                    🔔
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {notif.title}
                    </p>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                      {notif.body}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {formatRelativeTime(notif.created_at)}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div
                      className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                      style={{ background: 'var(--blue-accent)' }}
                    />
                  )}
                </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      <div className="ml-4 hidden md:block">
        <Avatar name={profile?.full_name || 'User'} src={profile?.avatar_url} size={36} />
      </div>
    </header>
  );
}
