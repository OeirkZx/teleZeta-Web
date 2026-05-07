// [TeleZeta] Realtime Chat Hook
// Subscribe ke tabel messages untuk chat realtime
'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/lib/types';import { log, logError } from '@/lib/utils/logger';


export function useRealtimeChat(appointmentId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  // Cache sender profiles to avoid N+1 query on each incoming message
  const senderCache = useRef<Map<string, object>>(new Map());

  // Fetch existing messages
  useEffect(() => {
    if (!appointmentId) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id, appointment_id, sender_id, content, is_read, created_at, sender:profiles(id, full_name, avatar_url)')
          .eq('appointment_id', appointmentId)
          .order('created_at', { ascending: true });

        // Populate sender cache from initial load
        if (data) {
          data.forEach((m: any) => {
            if (m.sender && m.sender_id) {
              senderCache.current.set(m.sender_id, m.sender);
            }
          });
        }

        if (error) {
          log('[TeleZeta] Error fetching messages:', error.message);
        } else {
          setMessages((data as any[]) || []);
        }
      } catch (err) {
        log('[TeleZeta] Messages fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [appointmentId, supabase]);

  // Subscribe to new messages via Supabase Realtime
  useEffect(() => {
    if (!appointmentId) return;

    const channel = supabase
      .channel(`messages:${appointmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `appointment_id=eq.${appointmentId}`,
        },
        async (payload) => {
          log('[TeleZeta] New message received:', payload);
          const newMessage = payload.new as Message;

          // Use cached sender profile to avoid N+1 query
          let sender = senderCache.current.get(newMessage.sender_id) || null;
          if (!sender) {
            const { data } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', newMessage.sender_id)
              .single();
            sender = data;
            if (data) senderCache.current.set(newMessage.sender_id, data);
          }

          // Deduplicate: if this message was already added by the optimistic update,
          // replace it (to get the real DB id/created_at); otherwise append.
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMessage.id);
            if (exists) {
              // Replace the optimistic copy with the confirmed server message
              return prev.map((m) => m.id === newMessage.id ? { ...newMessage, sender } : m) as any;
            }
            return [...prev, { ...newMessage, sender }] as any;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId, supabase]);

  // Send a new message
  const sendMessage = useCallback(
    async (content: string, senderId: string) => {
      if (!appointmentId || !content.trim()) return;
      try {
        const newMsg = {
          id: crypto.randomUUID(),
          appointment_id: appointmentId,
          sender_id: senderId,
          content: content.trim(),
          created_at: new Date().toISOString(),
          sender: null,
        };
        
        // Optimistic update — tampilkan dulu di UI
        setMessages(prev => [...prev, newMsg as any]);
        
        const { error } = await supabase.from('messages').insert({
          id: newMsg.id,
          appointment_id: appointmentId,
          sender_id: senderId,
          content: content.trim(),
        });

        if (error) {
          // Rollback optimistic update jika gagal
          setMessages(prev => prev.filter(m => m.id !== newMsg.id));
          throw error;
        }
      } catch (err) {
        log('[TeleZeta] Send message failed:', err);
        throw err;
      }
    },
    [appointmentId, supabase]
  );

  return { messages, loading, sendMessage };
}
