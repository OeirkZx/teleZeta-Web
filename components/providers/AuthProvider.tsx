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
  // authReady: true ketika auth check sudah selesai.
  // Ini mencegah halaman fetch data sebelum waktunya (race condition → double skeleton).
  authReady: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  supabase: ReturnType<typeof createClient>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ 
  children,
  initialUser = null,
  initialProfile = null,
  initialRole = null
}: { 
  children: ReactNode,
  initialUser?: User | null,
  initialProfile?: Profile | null,
  initialRole?: UserRole | null
}) {
  const [state, setState] = useState<AuthState>({
    user: initialUser,
    profile: initialProfile,
    role: initialRole,
    loading: false,
    // Jika SSR sudah punya user → auth sudah pasti siap, langsung true.
    // Jika tidak ada user dari SSR → tunggu INITIAL_SESSION untuk set true.
    authReady: initialUser !== null,
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log('[TeleZeta] Auth event:', event);
        
        if (event === 'INITIAL_SESSION') {
          // Setelah INITIAL_SESSION, auth sudah pasti diketahui statusnya
          // (login atau tidak). Set authReady = true agar halaman bisa fetch.
          setState(prev => ({ ...prev, authReady: true }));
          return;
        }

        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            role: profile?.role as UserRole || null,
            loading: false,
            authReady: true,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            role: null,
            loading: false,
            authReady: true,
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
      setState(prev => ({ ...prev, loading: true }));
      await supabase.auth.signOut();
      const result = await logoutUser();
      
      if (result?.error) {
        logError('[TeleZeta] Sign out API error:', result.error);
      }
      
      setState({
        user: null,
        profile: null,
        role: null,
        loading: false,
        authReady: true,
        error: null,
      });
      
      window.location.replace('/login');
    } catch (err) {
      logError('[TeleZeta] Sign out failed:', err);
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
