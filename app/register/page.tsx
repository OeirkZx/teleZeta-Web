// [TeleZeta] Register Page
// Multi-step, multi-role registration form
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import TeleZetaLogo from '@/components/common/TeleZetaLogo';
import { UserRole } from '@/lib/types';
import {
  patientStep1Schema, patientStep2Schema,
  doctorStep1Schema, doctorStep2Schema, doctorStep3Schema,
  pharmacistStep1Schema, pharmacistStep2Schema, pharmacistStep3Schema
} from '@/lib/utils/validators';
import { User, Stethoscope, Briefcase, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [role, setRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSuccess, setIsSuccess] = useState(false);

  // Schemas array based on role
  const getSchemas = (currentRole: UserRole) => {
    switch (currentRole) {
      case 'patient': return [patientStep1Schema, patientStep2Schema];
      case 'doctor': return [doctorStep1Schema, doctorStep2Schema, doctorStep3Schema];
      case 'pharmacist': return [pharmacistStep1Schema, pharmacistStep2Schema, pharmacistStep3Schema];
      default: return [];
    }
  };

  const schemas = role ? getSchemas(role) : [];
  const totalSteps = schemas.length;

  const currentSchema = schemas[step - 1];
  
  const {
    register,
    handleSubmit,
    formState: { errors: rawErrors, isValid },
    trigger,
    reset,
  } = useForm({
    resolver: currentSchema ? zodResolver(currentSchema) as any : undefined,
    mode: 'onChange',
  });

  // Cast errors to any — the multi-step form creates a union type across schemas
  // that TS can't narrow, but each render branch only accesses its own step's fields
  const errors = rawErrors as any;

  const handleNext = async () => {
    const isStepValid = await trigger();
    if (isStepValid) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      setRole(null);
      setFormData({});
      reset({});
    }
  };

  const onSubmit = async (data: any) => {
    const allData = { ...formData, ...data };
    if (allData['register-email']) {
      allData.email = allData['register-email'];
    }
    setFormData(allData);

    if (step < totalSteps) {
      handleNext();
      return;
    }

    // Final submit
    setIsLoading(true);
    setError(null);

    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: allData.email,
        password: allData.password,
        options: {
          data: {
            role,
            full_name: allData.full_name,
          },
        },
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Pembuatan akun gagal.');

      const userId = authData.user.id;

      // Wait a moment for the DB trigger to build the profile
      await new Promise(r => setTimeout(r, 1000));

      // 2. Update profiles table with extra data collected during registration
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: allData.full_name,
        phone: allData.phone || null,
        date_of_birth: allData.date_of_birth || null,
        gender: allData.gender || null,
      }).eq('id', userId);

      if (profileError) {
        console.error('[TeleZeta] Error updating profile:', profileError);
      }

      // 3. Insert role-specific data using admin privileges or normal insert 
      // (Since trigger creates profile, RLS should allow inserting own data to doctors/pharmacists)
      if (role === 'doctor') {
        const { error: doctorError } = await supabase.from('doctors').insert({
          id: userId,
          specialty: allData.specialty,
          sip_number: allData.sip_number,
          str_number: allData.str_number || null,
          hospital: allData.hospital,
        });
        if (doctorError) {
          console.error('[TeleZeta] Error inserting doctor:', doctorError);
          // Don't fail the whole registration if this fails, they can complete profile later
        }
      } else if (role === 'pharmacist') {
        const { error: pharmError } = await supabase.from('pharmacists').insert({
          id: userId,
          sipa_number: allData.sipa_number,
          pharmacy_name: allData.pharmacy_name,
        });
        if (pharmError) {
          console.error('[TeleZeta] Error inserting pharmacist:', pharmError);
        }
      }

      // 4. Complete and redirect
      await supabase.auth.signOut();
      setIsSuccess(true);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftar');
      setIsLoading(false);
    }
  };

  // Renderer for input fields based on role and step
  const renderFields = () => {
    if (role === 'patient') {
      if (step === 1) {
        return (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Masukkan nama sesuai KTP"
                  autoComplete="off"
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${errors.full_name ? 'border-red-300' : 'border-gray-300'}`}
                  {...register('full_name')}
                />
                {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message as string}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    min="1900-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.date_of_birth ? 'border-red-300' : 'border-gray-300'}`}
                    {...register('date_of_birth')}
                  />
                  {errors.date_of_birth && <p className="text-xs text-red-500 mt-1">{errors.date_of_birth.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                  <select
                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none bg-white ${errors.gender ? 'border-red-300' : 'border-gray-300'}`}
                    {...register('gender')}
                  >
                    <option value="">Pilih</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message as string}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp Aktif</label>
                <input
                  type="tel"
                  placeholder="0812xxxx..."
                  autoComplete="off"
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.phone ? 'border-red-300' : 'border-gray-300'}`}
                  {...register('phone')}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message as string}</p>}
              </div>
            </div>
          </>
        );
      }
      
      if (step === 2) {
        return (
          <>
            <div className="space-y-4 animate-slideRight">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Email</label>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  autoComplete="off"
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors['register-email'] ? 'border-red-300' : 'border-gray-300'}`}
                  {...register('register-email')}
                />
                {errors['register-email'] && <p className="text-xs text-red-500 mt-1">{errors['register-email'].message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  autoComplete="new-password"
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                  {...register('password')}
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                <input
                  type="password"
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message as string}</p>}
              </div>
            </div>
          </>
        );
      }
    }

    if (role === 'doctor') {
      if (step === 1) {
        return (
          <div className="space-y-4 animate-slideRight">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap & Gelar</label>
              <input
                type="text"
                placeholder="dr. Budi Santoso, Sp.A"
                autoComplete="off"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${errors.full_name ? 'border-red-300' : 'border-gray-300'}`}
                {...register('full_name')}
              />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp Aktif</label>
              <input
                type="tel"
                placeholder="0812xxxx..."
                autoComplete="off"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-300' : 'border-gray-300'}`}
                {...register('phone')}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spesialisasi</label>
              <select
                className={`w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors.specialty ? 'border-red-300' : 'border-gray-300'}`}
                {...register('specialty')}
              >
                <option value="">Pilih Spesialisasi</option>
                <option value="Dokter Umum">Dokter Umum</option>
                <option value="Penyakit Dalam">Penyakit Dalam</option>
                <option value="Pediatri">Anak (Pediatri)</option>
                <option value="Kardiologi">Jantung (Kardiologi)</option>
                <option value="Kulit & Kelamin">Kulit & Kelamin</option>
                <option value="Kebidanan & Kandungan">Kebidanan & Kandungan</option>
                <option value="Psikiatri">Psikiatri</option>
              </select>
              {errors.specialty && <p className="text-xs text-red-500 mt-1">{errors.specialty.message as string}</p>}
            </div>
          </div>
        );
      }
      if (step === 2) {
        return (
          <div className="space-y-4 animate-slideRight">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor SIP (Surat Izin Praktik)</label>
              <input
                type="text"
                placeholder="Contoh: SIP-001/JKT/2023"
                autoComplete="off"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${errors.sip_number ? 'border-red-300' : 'border-gray-300'}`}
                {...register('sip_number')}
              />
              {errors.sip_number && <p className="text-xs text-red-500 mt-1">{errors.sip_number.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor STR (Optional)</label>
              <input
                type="text"
                placeholder="Contoh: STR-00123"
                autoComplete="off"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${errors.str_number ? 'border-red-300' : 'border-gray-300'}`}
                {...register('str_number')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rumah Sakit / Klinik Praktik Utama</label>
              <input
                type="text"
                placeholder="Nama Faskes tempat Anda berpraktik"
                autoComplete="off"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${errors.hospital ? 'border-red-300' : 'border-gray-300'}`}
                {...register('hospital')}
              />
              {errors.hospital && <p className="text-xs text-red-500 mt-1">{errors.hospital.message as string}</p>}
            </div>
          </div>
        );
      }
      if (step === 3) {
        return (
          <div className="space-y-4 animate-slideRight">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Email</label>
              <input
                type="email"
                placeholder="nama@email.com"
                autoComplete="off"
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors['register-email'] ? 'border-red-300' : 'border-gray-300'}`}
                {...register('register-email')}
              />
              {errors['register-email'] && <p className="text-xs text-red-500 mt-1">{errors['register-email'].message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
              <input
                type="password"
                placeholder="Ulangi password"
                autoComplete="new-password"
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message as string}</p>}
            </div>
          </div>
        );
      }
    }

    if (role === 'pharmacist') {
      if (step === 1) {
        return (
          <div className="space-y-4 animate-slideRight">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap & Gelar</label>
              <input
                type="text"
                placeholder="Apt. Siti Nurhaliza, S.Farm"
                autoComplete="off"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${errors.full_name ? 'border-red-300' : 'border-gray-300'}`}
                {...register('full_name')}
              />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp Aktif</label>
              <input
                type="tel"
                placeholder="0812xxxx..."
                autoComplete="off"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-300' : 'border-gray-300'}`}
                {...register('phone')}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message as string}</p>}
            </div>
          </div>
        );
      }
      if (step === 2) {
        return (
          <div className="space-y-4 animate-slideRight">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor SIPA</label>
              <input
                type="text"
                placeholder="Contoh: SIPA-001/JKT/2023"
                autoComplete="off"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${errors.sipa_number ? 'border-red-300' : 'border-gray-300'}`}
                {...register('sipa_number')}
              />
              {errors.sipa_number && <p className="text-xs text-red-500 mt-1">{errors.sipa_number.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Apotek Praktik</label>
              <input
                type="text"
                placeholder="Nama apotek tempat Anda berpraktik"
                autoComplete="off"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${errors.pharmacy_name ? 'border-red-300' : 'border-gray-300'}`}
                {...register('pharmacy_name')}
              />
              {errors.pharmacy_name && <p className="text-xs text-red-500 mt-1">{errors.pharmacy_name.message as string}</p>}
            </div>
          </div>
        );
      }
      if (step === 3) {
        return (
          <div className="space-y-4 animate-slideRight">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Email</label>
              <input
                type="email"
                placeholder="nama@email.com"
                autoComplete="off"
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors['register-email'] ? 'border-red-300' : 'border-gray-300'}`}
                {...register('register-email')}
              />
              {errors['register-email'] && <p className="text-xs text-red-500 mt-1">{errors['register-email'].message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
              <input
                type="password"
                placeholder="Ulangi password"
                autoComplete="new-password"
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message as string}</p>}
            </div>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 relative overflow-hidden" style={{ background: 'var(--bg-light)' }}>
      {/* Decorative */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-20 pointer-events-none">
        <svg width="404" height="404" fill="none" viewBox="0 0 404 404">
          <defs>
            <pattern id="squares-reg" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="4" height="4" fill="var(--blue-accent)" />
            </pattern>
          </defs>
          <rect width="404" height="404" fill="url(#squares-reg)" />
        </svg>
      </div>

      <div className="w-full max-w-lg mb-12 animate-pageIn">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <TeleZetaLogo variant="dark" size="md" />
          </Link>
        </div>

        <div className="card p-8 shadow-xl relative overflow-hidden">
          
          {/* Progress Bar (if role is selected) */}
          {!isSuccess && role && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
              <div 
                className="h-full transition-all duration-300 ease-out bg-blue-500"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          )}

          {!isSuccess && (
            <div className="mb-8 mt-2">
              {!role ? (
                <div className="text-center animate-fadeUp">
                  <h1 className="text-2xl font-serif text-gray-900 mb-2">Pilih Jenis Akun</h1>
                  <p className="text-sm text-gray-600">Bagaimana Anda akan menggunakan TeleZeta?</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 animate-slideRight">
                  <button onClick={handleBack} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Daftar sebagai {role === 'patient' ? 'Pasien' : role === 'doctor' ? 'Dokter' : 'Apoteker'}
                    </h1>
                    <p className="text-xs text-gray-500">Langkah {step} dari {totalSteps}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg flex items-start gap-3 bg-red-50 text-red-600 border border-red-100 animate-slideDown">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Role Selection View */}
          {!isSuccess && !role && (
            <div className="space-y-4 animate-fadeUp d1">
              <button
                onClick={() => setRole('patient')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group card-clickable text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-700">Pasien</h3>
                    <p className="text-sm text-gray-500">Konsultasi dan beli obat</p>
                  </div>
                </div>
                <ArrowRight className="text-gray-400 group-hover:text-blue-500" />
              </button>

              <button
                onClick={() => setRole('doctor')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50/50 transition-all group card-clickable text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <Stethoscope size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-green-700">Dokter Spesialis</h3>
                    <p className="text-sm text-gray-500">Berikan layanan konsultasi</p>
                  </div>
                </div>
                <ArrowRight className="text-gray-400 group-hover:text-green-500" />
              </button>

              <button
                onClick={() => setRole('pharmacist')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-orange-500 hover:bg-orange-50/50 transition-all group card-clickable text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-orange-700">Apoteker</h3>
                    <p className="text-sm text-gray-500">Kelola tebus resep pasien</p>
                  </div>
                </div>
                <ArrowRight className="text-gray-400 group-hover:text-orange-500" />
              </button>
            </div>
          )}

          {/* Form View based on role and step */}
          {!isSuccess && role && (
            <form key={String(role) + step} autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
              {renderFields()}

              <div className="mt-8 flex gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-3.5 px-4 rounded-xl font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                  >
                    Kembali
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3.5 px-4 rounded-xl font-semibold text-white shadow-sm hover:shadow transition-all btn-ripple flex justify-center items-center"
                  style={{ background: 'var(--blue-accent)' }}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : step === totalSteps ? (
                    'Selesaikan Pendaftaran'
                  ) : (
                    'Selanjutnya'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Success View */}
          {isSuccess && (
            <div className="text-center animate-fadeUp py-8">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h2>
              <p className="text-gray-600 mb-8">Akun berhasil dibuat! Silakan masuk dengan kredensial Anda.</p>
              <Link
                href="/login"
                className="w-full inline-flex justify-center items-center py-3.5 px-4 rounded-xl font-semibold text-white shadow-sm hover:shadow transition-all btn-ripple"
                style={{ background: 'var(--blue-accent)' }}
              >
                Masuk Sekarang
              </Link>
            </div>
          )}

        </div>

        <p className="mt-8 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
