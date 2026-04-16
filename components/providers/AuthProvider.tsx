'use client';

import { createContext, useEffect, useState, useCallback, useMemo, useRef, ReactNode } from 'react';
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
  // authReady = true hanya setelah status auth PASTI diketahui.
  // Ini adalah one-way latch: sekali true, tidak pernah kembali false.
  // Mencegah race condition dan double-skeleton di semua halaman dashboard.
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

  // Ref untuk mencegah authReady di-set lebih dari sekali.
  // Penting: ini memastikan useEffect([authReady]) di halaman hanya berjalan 1x.
  const authReadyRef = useRef(initialUser !== null);

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
          // INITIAL_SESSION = Supabase sudah selesai cek session lokal.
          // Terjadi sekali di awal, bahkan jika user sudah di-set via SSR.
          if (!authReadyRef.current) {
            // Belum ada user dari SSR, set state dari INITIAL_SESSION.
            authReadyRef.current = true;

            if (session?.user) {
              const profile = await fetchProfile(session.user.id);
              setState({
                user: session.user,
                profile,
                role: profile?.role as UserRole || null,
                loading: false,
                authReady: true,
                error: null,
              });
            } else {
              // Tidak ada session — set authReady agar halaman tahu auth sudah selesai cek
              setState(prev => ({ ...prev, authReady: true }));
            }
          }
          // Jika authReadyRef.current sudah true (user dari SSR):
          // Tidak perlu set ulang, cukup biarkan state yang ada.
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          // SIGNED_IN terpicu setelah INITIAL_SESSION di Vercel (normal behavior).
          // Kita update user/profile TAPI tidak mengubah authReady.
          // Karena authReady tidak berubah, useEffect([authReady]) di halaman
          // TIDAK akan terpicu ulang → tidak ada re-fetch → tidak ada skeleton flash.
          const profile = await fetchProfile(session.user.id);
          setState(prev => ({
            ...prev,
            user: session.user,
            profile,
            role: profile?.role as UserRole || null,
            loading: false,
            // authReady TIDAK diubah di sini
          }));
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token refresh: update user object saja (token baru)
          setState(prev => ({
            ...prev,
            user: session.user,
            loading: false,
          }));
        } else if (event === 'SIGNED_OUT') {
          authReadyRef.current = false;
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
      
      authReadyRef.current = false;
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
