// [TeleZeta] useAuthFetch Hook
// Hook untuk data fetching yang menunggu authReady sebelum eksekusi.
// Menjamin fetch hanya terjadi SEKALI dan skeleton tidak berkedip.
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

/**
 * Jalankan callback fetch hanya SEKALI setelah auth status sudah pasti diketahui.
 * 
 * @param callback - Fungsi async yang melakukan fetch data. Dipanggil dengan `user` jika login, atau `null` jika tidak.
 * @param deps - Dependencies tambahan (opsional). Default hanya bergantung pada `authReady`.
 * 
 * @example
 * useAuthFetch(async (user) => {
 *   if (!user) { setData(MOCK_DATA); return; }
 *   const { data } = await supabase.from('table').select('*').eq('user_id', user.id);
 *   setData(data);
 * });
 */
export function useAuthFetch(
  callback: (user: ReturnType<typeof useAuth>['user']) => Promise<void>,
  deps: React.DependencyList = []
) {
  const { user, authReady } = useAuth();
  const hasFetchedRef = useRef(false);
  const callbackRef = useRef(callback);

  // Update callback ref tanpa menyebabkan re-run effect
  callbackRef.current = callback;

  useEffect(() => {
    // Belum siap → jangan lakukan apa-apa
    if (!authReady) return;

    // Jika deps tidak berubah dan sudah pernah fetch → skip
    // (deps[0] check untuk filter date-range changes etc)
    if (hasFetchedRef.current && deps.length === 0) return;

    hasFetchedRef.current = true;
    callbackRef.current(user);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, ...deps]);
}
