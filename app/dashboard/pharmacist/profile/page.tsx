// [TeleZeta] Pharmacist Profile Page
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { Store, Mail, Phone, Loader2, CheckCircle2, MapPin, FileCheck, Building } from 'lucide-react';

const profileSchema = z.object({
  phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  
  // Pharmacist specific
  pharmacy_name: z.string().min(3, "Nama Apotek wajib diisi"),
  address: z.string().min(10, "Alamat lengkap wajib diisi"),
  license_number: z.string().min(3, "Nomor SIA wajib diisi"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function PharmacistProfile() {
  const { user } = useAuth();
  const supabase = createClient();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [pharmacistData, setPharmacistData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const [profRes, pharmRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('pharmacists').select('*').eq('id', user.id).single()
        ]);

        if (profRes.error) throw profRes.error;
        if (pharmRes.error && pharmRes.error.code !== 'PGRST116') throw pharmRes.error;
        
        setProfileData(profRes.data);
        setPharmacistData(pharmRes.data || {});
        
        reset({
          phone: profRes.data.phone || '',
          pharmacy_name: pharmRes.data?.pharmacy_name || '',
          address: pharmRes.data?.address || '',
          license_number: pharmRes.data?.license_number || '',
        });
      } catch (err) {
        console.error('[TeleZeta] Failed to fetch profile:', err);
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
      const { phone, pharmacy_name, address, license_number } = data;

      // Update profiles
      const { error: profError } = await supabase
        .from('profiles')
        .update({
          phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profError) throw profError;

      // Update pharmacists
      const { error: pharmError } = await supabase
        .from('pharmacists')
        .update({
          pharmacy_name,
          address,
          license_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (pharmError) throw pharmError;

      setProfileData((prev: any) => ({ ...prev, phone }));
      setPharmacistData((prev: any) => ({ ...prev, pharmacy_name, address, license_number }));
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
      reset(data);
    } catch (err) {
      console.error('[TeleZeta] Failed to update profile:', err);
      alert('Gagal menyimpan profil. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
        <Skeleton width="100%" height={600} borderRadius={24} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-20">
      <div className="animate-fadeUp">
        <h1 className="text-3xl font-serif text-gray-900">Profil Apotek</h1>
        <p className="text-gray-600 mt-2">Kelola informasi apotek dan perizinan Anda</p>
      </div>

      <div className="card p-6 md:p-8 animate-fadeUp d1 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <Store className="w-64 h-64" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-8">
          
          <div className="pb-8 border-b border-gray-100 flex items-center gap-6">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Store className="w-12 h-12" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1 block">Apoteker Penanggung Jawab</p>
              <h2 className="text-2xl font-bold text-gray-900">{profileData?.full_name}</h2>
              <p className="text-gray-500 flex items-center gap-2 mt-1"><Mail className="w-4 h-4" /> {user?.email}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-500" /> Informasi Apotek
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Nama Apotek (Sesuai Izin)</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    {...register('pharmacy_name')}
                    placeholder="Apotek Sehat Bersama"
                  />
                </div>
                {errors.pharmacy_name && <p className="text-xs text-red-500">{errors.pharmacy_name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Nomor Telepon Outlet</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    {...register('phone')}
                    placeholder="081234567890"
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Alamat Lengkap</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-4 text-gray-400 w-5 h-5" />
                  <textarea
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                    {...register('address')}
                    placeholder="Jl. Merdeka No. 123, Jakarta"
                  />
                </div>
                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-orange-500" /> Perizinan
            </h3>

            <div className="space-y-2 bg-orange-50/50 border border-orange-100 p-6 rounded-2xl">
              <label className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                <span>Nomor Surat Izin Apotek (SIA)</span>
                <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Terverifikasi</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                {...register('license_number')}
                placeholder="No SIA..."
              />
              {errors.license_number && <p className="text-xs text-red-500 mt-1">{errors.license_number.message}</p>}
              
              <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-orange-200/50">
                Pembaruan izin wajib dilampirkan ke admin TeleZeta setelah Anda mensubmits form ini.
              </p>
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
