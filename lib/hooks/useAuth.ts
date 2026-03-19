// [TeleZeta] Auth Hook
// Hook untuk mengelola state autentikasi user
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, UserRole } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

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

  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('[TeleZeta] Error fetching profile:', error.message);
        return null;
      }
      return data as Profile;
    } catch (err) {
      console.log('[TeleZeta] Profile fetch failed:', err);
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
        console.log('[TeleZeta] Auth error:', err);
        setState(prev => ({ ...prev, loading: false, error: 'Gagal memuat sesi' }));
      }
    };

    getUser();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[TeleZeta] Auth event:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            role: profile?.role as UserRole || null,
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
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.log('[TeleZeta] Sign out error:', err);
    }
  };

  return {
    ...state,
    signOut,
    supabase,
  };
}
