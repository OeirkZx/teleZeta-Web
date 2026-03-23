'use client';

import { useEffect } from 'react';import { log, logError } from '@/lib/utils/logger';


export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    logError('[TeleZeta] Dashboard runtime error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center animate-fadeIn w-full">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan Teknis</h2>
        <p className="text-sm text-gray-500 mb-6">
          {error.message || 'Halaman dasbor gagal dimuat karena kesalahan yang tidak terduga pada browser Anda.'}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.replace('/dashboard')}
            className="w-full py-3 rounded-xl font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: 'var(--blue-accent)' }}
          >
            Muat Ulang Halaman
          </button>
          <button
            onClick={() => window.location.replace('/login')}
            className="w-full py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    </div>
  );
}
