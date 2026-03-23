// [TeleZeta] Doctor Profile Page
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import Avatar from '@/components/common/Avatar';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { User, Mail, Phone, Calendar, Loader2, CheckCircle2, Shield, Camera, Award, FileText, Activity } from 'lucide-react';import { log, logError } from '@/lib/utils/logger';


const profileSchema = z.object({
  full_name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit").optional().or(z.literal('')),
  date_of_birth: z.string().optional(),
  gender: z.enum(['L', 'P', '']).optional(),
  
  // Doctor specific
  specialty: z.string().min(2, "Spesialisasi wajib diisi"),
  experience_years: z.coerce.number().min(0, "Pengalaman tidak bisa negatif"),
  consultation_fee: z.coerce.number().min(0, "Biaya tidak bisa negatif"),
  bio: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function DoctorProfile() {
  const { user } = useAuth();
  const supabase = createClient();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema) as any,
  });

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const [profRes, docRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('doctors').select('*').eq('id', user.id).single()
        ]);

        if (profRes.error) throw profRes.error;
        if (docRes.error && docRes.error.code !== 'PGRST116') throw docRes.error;
        
        setProfileData(profRes.data);
        setDoctorData(docRes.data || {});
        
        reset({
          full_name: profRes.data.full_name || '',
          phone: profRes.data.phone || '',
          date_of_birth: profRes.data.date_of_birth || '',
          gender: profRes.data.gender || '',
          specialty: docRes.data?.specialty || '',
          experience_years: docRes.data?.experience_years || 0,
          consultation_fee: docRes.data?.consultation_fee || 0,
          bio: docRes.data?.bio || '',
        });
      } catch (err) {
        logError('[TeleZeta] Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, supabase, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setSaving(true);
    setSuccess(false);

    try {
      const { full_name, phone, date_of_birth, gender, specialty, experience_years, consultation_fee, bio } = data;

      // Update profiles
      const { error: profError } = await supabase
        .from('profiles')
        .update({
          full_name,
          phone,
          date_of_birth: date_of_birth || null,
          gender: gender || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profError) throw profError;

      // Update doctors
      const { error: docError } = await supabase
        .from('doctors')
        .update({
          specialty,
          experience_years,
          consultation_fee,
          bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (docError) throw docError;

      setProfileData((prev: any) => ({ ...prev, full_name, phone, date_of_birth, gender })); // eslint-disable-line @typescript-eslint/no-explicit-any
      setDoctorData((prev: any) => ({ ...prev, specialty, experience_years, consultation_fee, bio })); // eslint-disable-line @typescript-eslint/no-explicit-any
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
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
      if (!event.target.files || event.target.files.length === 0 || !user) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) {
        logError('Upload Error:', uploadError);
        alert('Gagal mengunggah foto. Pastikan bucket "avatars" sudah dibuat.');
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setProfileData((prev: any) => ({ ...prev, avatar_url: publicUrl })); // eslint-disable-line @typescript-eslint/no-explicit-any
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
        <Skeleton width="100%" height={800} borderRadius={24} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-20">
      <div className="animate-fadeUp">
        <h1 className="text-3xl font-serif text-gray-900">Profil Praktik</h1>
        <p className="text-gray-600 mt-2">Kelola informasi publik dan data profesional Anda</p>
      </div>

      <div className="card p-6 md:p-8 animate-fadeUp d1 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <Activity className="w-64 h-64" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-8">
          
          <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-gray-100">
            <div className="relative group shrink-0 mx-auto md:mx-0">
              <Avatar
                name={profileData?.full_name || 'Dokter'}
                src={profileData?.avatar_url}
                size={120}
              />
              <label 
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm"
                htmlFor="avatar-upload"
              >
                {avatarUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-8 h-8 mb-1" />}
                <span className="text-xs font-bold uppercase tracking-wider mt-1">{avatarUploading ? 'Mengunggah...' : 'Ubah Foto'}</span>
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

            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-lg font-bold rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-normal border-gray-300 bg-gray-50 focus:bg-white"
                  {...register('full_name')}
                  placeholder="Cth: dr. Budi Santoso, Sp.A"
                />
                {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
              </div>

              <div>
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Biografi Singkat</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none border-gray-300 bg-gray-50 focus:bg-white"
                  {...register('bio')}
                  placeholder="Ceritakan singkat latar belakang dan pendekatan medis Anda..."
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" /> Informasi Profesional
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Spesialisasi</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  {...register('specialty')}
                  placeholder="Cth: Dokter Gigi, Dokter Umum"
                />
                {errors.specialty && <p className="text-xs text-red-500">{errors.specialty.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Pengalaman (Tahun)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  {...register('experience_years')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Biaya Konsultasi (Rp)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  {...register('consultation_fee')}
                />
              </div>

              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <label className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                  <span>Nomor SIP (Surat Izin Praktik)</span>
                  <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Terverifikasi</span>
                </label>
                <input
                  type="text"
                  disabled
                  value="1234.56789.X.00.00"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" /> Data Pribadi
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Nomor Telepon</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    {...register('phone')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email Akun</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Tanggal Lahir</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    {...register('date_of_birth')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Jenis Kelamin</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  {...register('gender')}
                >
                  <option value="">Pilih</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <div className="text-sm">
              {success && (
                <span className="flex items-center text-green-600 font-medium animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 mr-1.5" /> Data berhasil disimpan
                </span>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!isDirty || saving}
              className={`px-8 py-3.5 rounded-xl font-bold flex items-center justify-center transition-all ${
                !isDirty || saving
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'text-white hover:-translate-y-0.5 shadow-sm btn-ripple'
              }`}
              style={{ background: (!isDirty || saving) ? undefined : 'var(--blue-accent)' }}
            >
              {saving ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Menyimpan...</> : 'Simpan Perubahan'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
