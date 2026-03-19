// [TeleZeta] Notifications Hook
// Subscribe ke tabel notifications untuk notifikasi realtime
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/lib/types';

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch existing notifications
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.log('[TeleZeta] Error fetching notifications:', error.message);
        } else {
          setNotifications(data || []);
          setUnreadCount(data?.filter((n: Notification) => !n.is_read).length || 0);
        }
      } catch (err) {
        console.log('[TeleZeta] Notifications fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userId, supabase]);

  // Subscribe to new notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[TeleZeta] New notification:', payload);
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  // Mark a single notification as read
  const markAsRead = useCallback(
    async (notifId: string) => {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notifId);

        setNotifications((prev) =>
          prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.log('[TeleZeta] Mark as read failed:', err);
      }
    },
    [supabase]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.log('[TeleZeta] Mark all as read failed:', err);
    }
  }, [userId, supabase]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
