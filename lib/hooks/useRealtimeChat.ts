// [TeleZeta] Realtime Chat Hook
// Subscribe ke tabel messages untuk chat realtime
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/lib/types';

export function useRealtimeChat(appointmentId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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
          console.log('[TeleZeta] Error fetching messages:', error.message);
        } else {
          setMessages(data || []);
        }
      } catch (err) {
        console.log('[TeleZeta] Messages fetch failed:', err);
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
          console.log('[TeleZeta] New message received:', payload);
          const newMessage = payload.new as Message;

          // Fetch sender profile
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMessage.sender_id)
            .single();

          setMessages((prev) => [...prev, { ...newMessage, sender }]);
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
        const { error } = await supabase.from('messages').insert({
          appointment_id: appointmentId,
          sender_id: senderId,
          content: content.trim(),
        });

        if (error) {
          console.log('[TeleZeta] Error sending message:', error.message);
          throw error;
        }
      } catch (err) {
        console.log('[TeleZeta] Send message failed:', err);
        throw err;
      }
    },
    [appointmentId, supabase]
  );

  return { messages, loading, sendMessage };
}
