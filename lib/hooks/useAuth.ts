// [TeleZeta] Auth Hook
// Hook untuk mengelola state autentikasi user
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, UserRole } from '@/lib/types';
import type { User } from '@supabase/supabase-js';import { log, logError } from '@/lib/utils/logger';


interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    loading: true,
    error: null,
  });

  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        log('[TeleZeta] Error fetching profile:', error.message);
        return null;
      }
      return data as Profile;
    } catch (err) {
      log('[TeleZeta] Profile fetch failed:', err);
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        const profile = await fetchProfile(user.id);

        setState({
          user,
          profile,
          role: profile?.role as UserRole || null,
          loading: false,
          error: null,
        });
      } catch (err) {
        log('[TeleZeta] Auth error:', err);
        setState(prev => ({ ...prev, loading: false, error: 'Gagal memuat sesi' }));
      }
    };

    getUser();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log('[TeleZeta] Auth event:', event);

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            role: profile?.role as UserRole || null,
            loading: false,
            error: null,
          });
        } else if (event === 'INITIAL_SESSION' && !session) {
          // No session on page load — user is not logged in
          setState({
            user: null,
            profile: null,
            role: null,
            loading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            role: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signOut = async () => {
    try {
      // Set loading state dulu agar UI memberikan feedback
      setState(prev => ({ ...prev, loading: true }));
      
      // Panggil signOut dari Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logError('[TeleZeta] Sign out error:', error);
      }
      
      // Reset state secara manual untuk memastikan
      // tidak ada sisa data user di memory
      setState({
        user: null,
        profile: null,
        role: null,
        loading: false,
        error: null,
      });
      
      // Tunggu sebentar agar cookie benar-benar terhapus
      // sebelum melakukan redirect
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Gunakan replace agar tidak bisa back ke halaman dashboard
      // setelah logout
      window.location.replace('/login');
      
    } catch (err) {
      logError('[TeleZeta] Sign out failed:', err);
      // Force redirect meskipun ada error
      window.location.replace('/login');
    }
  };

  return {
    ...state,
    signOut,
    supabase,
  };
}
