// [TeleZeta] Realtime Chat Hook
// Subscribe ke tabel messages untuk chat realtime
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/lib/types';import { log, logError } from '@/lib/utils/logger';


export function useRealtimeChat(appointmentId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  // Fetch existing messages
  useEffect(() => {
    if (!appointmentId) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender:profiles(*)')
          .eq('appointment_id', appointmentId)
          .order('created_at', { ascending: true });

        if (error) {
          log('[TeleZeta] Error fetching messages:', error.message);
        } else {
          setMessages(data || []);
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

          // Fetch sender profile
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMessage.sender_id)
            .single();

          // Deduplicate: if this message was already added by the optimistic update,
          // replace it (to get the real DB id/created_at); otherwise append.
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMessage.id);
            if (exists) {
              // Replace the optimistic copy with the confirmed server message
              return prev.map((m) => m.id === newMessage.id ? { ...newMessage, sender } : m);
            }
            return [...prev, { ...newMessage, sender }];
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
