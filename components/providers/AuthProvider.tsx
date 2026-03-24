'use client';

import { createContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, UserRole } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import { log, logError } from '@/lib/utils/logger';
import { logoutUser } from '@/app/auth/actions';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  supabase: ReturnType<typeof createClient>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
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
        // Coba getSession dulu (baca lokal, lebih cepat)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            role: profile?.role as UserRole || null,
            loading: false,
            error: null,
          });
          return;
        }

        // Fallback ke getUser() untuk validasi server-side
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
      
      // Clear browser local storage / cookie config reliably
      await supabase.auth.signOut();
      
      // Clear server-side JWT cookie using Server Action
      const result = await logoutUser();
      
      if (result?.error) {
        logError('[TeleZeta] Sign out API error:', result.error);
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
      
      // Gunakan replace agar tidak bisa back ke halaman dashboard
      // setelah logout
      window.location.replace('/login');
    } catch (err) {
      logError('[TeleZeta] Sign out failed:', err);
      // Force redirect meskipun ada error
      window.location.replace('/login');
    }
  };

  const value = {
    ...state,
    signOut,
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
