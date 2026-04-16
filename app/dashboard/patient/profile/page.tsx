// [TeleZeta] Patient Profile Page
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Profile } from '@/lib/types';
import Avatar from '@/components/common/Avatar';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { User, Mail, Phone, Calendar, Loader2, CheckCircle2, Shield, Camera } from 'lucide-react';import { log, logError } from '@/lib/utils/logger';


const profileSchema = z.object({
  full_name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  date_of_birth: z.string().optional(),
  gender: z.enum(['L', 'P', '']).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function PatientProfile() {
  const { user, profile: authProfile, authReady } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const hasFetchedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    // Tunggu sampai auth check selesai dulu sebelum fetch
    if (!authReady || !user) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function fetchProfile() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user!.id)
          .single();

        if (error) throw error;
        
        setProfile(data as Profile);
        
        // Reset form with fetched data
        reset({
          full_name: data.full_name || '',
          phone: data.phone || '',
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || '',
        });
      } catch (err) {
        logError('[TeleZeta] Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setSaving(true);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          date_of_birth: data.date_of_birth || null,
          gender: data.gender || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setProfile(prev => ({ ...prev, ...data } as Profile));
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
      // Reset isDirty state by calling reset with current values
      reset(data);
    } catch (err) {
      logError('[TeleZeta] Failed to update profile:', err);
      alert('Gagal menyimpan profil. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setAvatarUploading(true);
      
      if (!event.target.files || event.target.files.length === 0 || !user) {
        return;
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;
      
      // Upload to storage bucket (assumes 'avatars' bucket exists and has correct RLS)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist, just show an alert for the demo
        logError('Upload Error:', uploadError);
        alert('Gagal mengunggah foto. Pastikan bucket "avatars" sudah dibuat di Supabase.');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      alert('Foto profil berhasil diperbarui!');
      
    } catch (error) {
      logError('Error uploading avatar:', error);
      alert('Terjadi kesalahan saat mengunggah foto.');
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
        <Skeleton width={200} height={36} className="mb-8" />
        <div className="card p-8">
          <div className="flex items-center gap-6 mb-8">
            <Skeleton width={96} height={96} borderRadius="50%" />
            <div>
              <Skeleton width={200} height={24} className="mb-2" />
              <Skeleton width={150} height={16} />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton width="100%" height={50} />
            <Skeleton width="100%" height={50} />
            <Skeleton width="100%" height={50} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-20">
      <div className="animate-fadeUp">
        <h1 className="text-3xl font-serif text-gray-900">Profil Saya</h1>
        <p className="text-gray-600 mt-2">Kelola informasi pribadi dan foto profil Anda</p>
      </div>

      <div className="card p-6 md:p-8 animate-fadeUp d1 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <Shield className="w-64 h-64" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative z-10">
          
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10 pb-8 border-b border-gray-100">
            <div className="relative group">
              <Avatar
                name={profile?.full_name || 'User'}
                src={profile?.avatar_url}
                size={96}
              />
              <label 
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm"
                htmlFor="avatar-upload"
              >
                {avatarUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6 mb-1" />}
                <span className="text-xs font-medium">{avatarUploading ? 'Mengunggah...' : 'Ubah Foto'}</span>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
              />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile?.full_name}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 mb-3">
                <Mail className="w-4 h-4" />
                <span>{user?.email}</span>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium ml-2">Terverifikasi</span>
              </div>
              <p className="text-sm text-gray-500 max-w-sm">Foto profil Anda akan terlihat oleh dokter saat konsultasi. Format yang didukung: JPG, PNG maksimal 2MB.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" /> Informasi Pribadi
              </h3>
            </div>

            {/* Nama Lengkap */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Nama Lengkap</label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                {...register('full_name')}
              />
              {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
            </div>

            {/* Nomor WA */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Nomor WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  type="tel"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                  {...register('phone')}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            {/* Tanggal Lahir */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Tanggal Lahir</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  type="date"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.date_of_birth ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                  {...register('date_of_birth')}
                />
              </div>
            </div>

            {/* Jenis Kelamin */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Jenis Kelamin</label>
              <select
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer ${errors.gender ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                {...register('gender')}
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-4">
            <div className="text-sm">
              {success && (
                <span className="flex items-center text-green-600 font-medium animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 mr-1.5" /> Profil berhasil diperbarui
                </span>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!isDirty || saving}
              className={`px-8 py-3 rounded-xl font-bold flex items-center justify-center transition-all ${
                !isDirty 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'text-white hover:-translate-y-0.5 shadow-sm btn-ripple'
              }`}
              style={{ background: isDirty ? 'var(--blue-accent)' : undefined }}
            >
              {saving ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Menyimpan...</>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
