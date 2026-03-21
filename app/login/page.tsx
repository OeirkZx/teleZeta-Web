// [TeleZeta] Login Page
// Halaman login untuk semua role (Pasien, Dokter, Apoteker)
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { loginSchema, type LoginFormData } from '@/lib/utils/validators';
import TeleZetaLogo from '@/components/common/TeleZetaLogo';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Password Reset States
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError('Masukkan email Anda untuk mereset password');
      return;
    }
    
    setIsResetting(true);
    setError(null);
    setResetMessage(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setResetMessage('Link reset password telah dikirim ke email Anda');
      setResetEmail('');
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim link reset password');
    } finally {
      setIsResetting(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Email atau password yang Anda masukkan salah');
        } else if (signInError.message.includes('Email not confirmed')) {
          throw new Error('Akun Anda belum dikonfirmasi, hubungi administrator');
        } else {
          throw new Error('Terjadi kesalahan, silakan coba lagi');
        }
      }

      // Refresh router to trigger middleware and redirect to correct dashboard
      router.refresh();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat masuk');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-pageIn">
      <div className="card p-8 shadow-xl">
        <div className="flex justify-center mb-8">
          <TeleZetaLogo variant="dark" size="lg" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif text-gray-900 mb-2">Selamat Datang Kembali</h1>
          <p className="text-sm text-gray-600">Masuk ke akun TeleZeta Anda</p>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{ background: 'var(--warning)', color: 'white' }}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg flex items-start gap-3 bg-red-50 text-red-600 border border-red-100 animate-slideRight">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {resetMessage && (
          <div className="mb-6 p-4 rounded-lg flex items-start gap-3 bg-green-50 text-green-700 border border-green-100 animate-slideRight">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{resetMessage}</p>
          </div>
        )}

        {showResetForm ? (
          <form onSubmit={handleResetPassword} className="space-y-6 animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="reset-email">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="nama@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  disabled={isResetting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isResetting || !resetEmail}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:-translate-y-0.5 btn-ripple disabled:opacity-50"
                style={{ background: 'var(--blue-accent)' }}
              >
                {isResetting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Kirim Link Reset'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowResetForm(false);
                  setError(null);
                  setResetMessage(null);
                }}
                className="w-full py-3.5 px-4 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                disabled={isResetting}
              >
                Kembali ke Login
              </button>
            </div>
          </form>
        ) : (
          <form autoComplete="off" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="nama@email.com"
                autoComplete="username"
                defaultValue=""
                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                  errors.email ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                {...register('email')}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-600 animate-fadeIn">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                Password
              </label>
              <button 
                type="button" 
                onClick={() => {
                  setShowResetForm(true);
                  setError(null);
                  setResetMessage(null);
                }} 
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Lupa password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                placeholder="Masukkan password Anda"
                autoComplete="new-password"
                defaultValue=""
                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                  errors.password ? 'border-red-300 ring-1 ring-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                {...register('password')}
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <p className="mt-1.5 text-sm text-red-600 animate-fadeIn">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:-translate-y-0.5 btn-ripple"
            style={{ background: 'var(--blue-accent)' }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Masuk Sekarang'
            )}
          </button>
        </form>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-gray-600">
        Belum punya akun?{' '}
        <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
          Daftar Gratis
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 relative overflow-hidden" style={{ background: 'var(--bg-light)' }}>
      {/* Decorative background blocks */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-20 pointer-events-none">
        <svg width="404" height="404" fill="none" viewBox="0 0 404 404">
          <defs>
            <pattern id="squares" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="4" height="4" fill="var(--blue-accent)" />
            </pattern>
          </defs>
          <rect width="404" height="404" fill="url(#squares)" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 opacity-30 pointer-events-none" style={{ filter: 'blur(80px)' }}>
        <div className="w-96 h-96 rounded-full" style={{ background: 'var(--blue-accent-light)' }} />
      </div>

      <Suspense fallback={<div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
