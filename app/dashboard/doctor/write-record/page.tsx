// [TeleZeta] Doctor Write Medical Record & Prescription
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import Avatar from '@/components/common/Avatar';
import { Skeleton, PageSkeleton } from '@/components/common/LoadingSkeleton';
import { formatTime } from '@/lib/utils/formatters';
import { FileText, Plus, Trash2, Save, Pill, User, AlertCircle, CheckCircle2, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';import { log, logError } from '@/lib/utils/logger';


// Schema
const medicationSchema = z.object({
  name: z.string().min(2, "Nama obat wajib diisi"),
  dosage: z.string().optional(),
  frequency: z.string().min(2, "Aturan pakai wajib diisi (contoh: 3x sehari)"),
  duration: z.string().min(2, "Durasi wajib diisi (contoh: 5 hari)")
});

const formSchema = z.object({
  diagnosis: z.string().min(5, "Diagnosis/Penyakit wajib diisi detail"),
  symptoms: z.string().min(10, "Gejala wajib dijabarkan"),
  notes: z.string().optional(),
  medications: z.array(medicationSchema).optional()
});

type FormData = z.infer<typeof formSchema>;

function WriteRecordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointment_id');
  const patientId = searchParams.get('patient_id'); // Optional, to find their latest ap
  
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medications: [] // Start with empty prescriptions
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "medications"
  });

  useEffect(() => {
    async function loadAppointmentData() {
      if (!user) return;
      try {
        let query = supabase
          .from('appointments')
          .select('*, patient:profiles!patient_id(*)')
          .eq('doctor_id', user.id);

        if (appointmentId) {
          query = query.eq('id', appointmentId);
        } else if (patientId) {
          query = query.eq('patient_id', patientId).order('scheduled_at', { ascending: false }).limit(1);
        } else {
          // Jangan pilih otomatis, minta dokter memilih dari jadwal
          setAppointment(null);
          setLoading(false);
          return;
        }

        const withTimeout = (promise: PromiseLike<any>, ms = 7000): Promise<any> => {
          let timeoutId: ReturnType<typeof setTimeout>;
          const timeoutPromise = new Promise<any>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Koneksi timeout saat mengambil data')), ms);
          });
          return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => clearTimeout(timeoutId));
        };

        const { data, error } = await withTimeout(query.single());
        if (error || !data) throw error || new Error("Data konsultasi tidak ditemukan.");
        
        // Cek apakah sudah ada rekam medis untuk appointment ini
        const { data: existingRecord } = await withTimeout(
          supabase
            .from('medical_records')
            .select('id')
            .eq('appointment_id', data.id)
            .single()
        );
          
        if (existingRecord) {
          setErrorMsg("Rekam medis untuk sesi konsultasi ini sudah pernah diisi.");
        }

        setAppointment(data);
      } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
        logError('[TeleZeta] Failed to load data:', err);
        setErrorMsg(err.message || 'Gagal memuat detail pasien.');
      } finally {
        setLoading(false);
      }
    }
    loadAppointmentData();
  }, [user, supabase, appointmentId, patientId]);

  const onSubmit = async (data: FormData) => {
    if (!user || !appointment) return;
    setIsSubmitting(true);
    
    try {
      // 1. Insert Medical Record
      const { data: recordData, error: recordError } = await supabase
        .from('medical_records')
        .insert({
          appointment_id: appointment.id,
          patient_id: appointment.patient_id,
          doctor_id: user.id,
          diagnosis: data.diagnosis,
          notes: `Gejala: ${data.symptoms}\nCatatan Tambahan: ${data.notes || '-'}`,
        })
        .select()
        .single();
        
      if (recordError) throw recordError;

      // 2. Insert Prescription if any meds
      if (data.medications && data.medications.length > 0) {
        const { data: prescriptionData, error: presError } = await supabase
          .from('prescriptions')
          .insert({
            medical_record_id: recordData.id,
            patient_id: appointment.patient_id,
            doctor_id: user.id,
            notes: data.notes || '',
            status: 'pending'
          })
          .select()
          .single();

        if (presError) throw presError;

        const prescriptionItems = data.medications.map(med => ({
          prescription_id: prescriptionData.id,
          medicine_name: med.name,
          dosage: med.dosage || '',
          frequency: med.frequency,
          quantity: 1,
          refills: 0,
          instructions: med.duration || '',
        }));

        const { error: itemsError } = await supabase
          .from('prescription_items')
          .insert(prescriptionItems);

        if (itemsError) throw itemsError;
      }

      // 3. Update appointment status to completed if it isn't already
      if (appointment.status !== 'completed') {
        await supabase
          .from('appointments')
          .update({ status: 'completed' })
          .eq('id', appointment.id);
      }

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err: any) {
      logError('[TeleZeta] Failed to save record:', err);
      alert(`Terjadi kesalahan saat menyimpan rekam medis: ${err.message || 'Error tidak diketahui'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton width={200} height={32} />
        <Skeleton width="100%" height={120} borderRadius={16} />
        <Skeleton width="100%" height={400} borderRadius={16} />
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto text-center py-20 animate-popIn">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4 font-serif">Tersimpan Berhasil</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Rekam medis dan resep obat digital atas nama <b>{appointment?.patient?.full_name}</b> telah berhasil disimpan ke database dan diteruskan ke akun pasien.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard/doctor/schedule"
            className="px-8 py-3.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Lihat Jadwal Lain
          </Link>
          <Link
            href="/dashboard/doctor/patients"
            className="px-8 py-3.5 rounded-xl font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: 'var(--blue-accent)' }}
          >
            Kembali ke Daftar Pasien
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-20">
      
      <div className="animate-fadeUp flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 sm:hidden hover:bg-gray-100 rounded-full text-gray-400">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-serif text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500 hidden sm:block" /> Tulis Rekam Medis
          </h1>
          <p className="text-gray-600 mt-2">Buat catatan diagnosis dan resep untuk pasien</p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 flex items-start gap-3 animate-slideDown">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold mb-1">Peringatan</h3>
            <p className="text-sm">{errorMsg}</p>
          </div>
        </div>
      )}

      {appointment && !errorMsg ? (
        <div className="space-y-6 animate-slideRight" style={{ animationDelay: '100ms' }}>
          
          {/* Patient Overview Card */}
          <div className="card p-6 bg-gradient-to-r from-blue-50 to-white border-blue-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4 shrink-0">
                <Avatar
                  name={appointment.patient?.full_name}
                  src={appointment.patient?.avatar_url}
                  size={64}
                />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Detail Pasien</p>
                  <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{appointment.patient?.full_name}</h2>
                  <p className="text-sm text-gray-600">
                    {appointment.patient?.gender === 'L' ? 'Laki-laki' : appointment.patient?.gender === 'P' ? 'Perempuan' : ''} 
                    {appointment.patient?.date_of_birth ? ` • ${new Date().getFullYear() - new Date(appointment.patient.date_of_birth).getFullYear()} tahun` : ''}
                  </p>
                </div>
              </div>
              
              <div className="w-full sm:w-auto p-4 bg-white/60 rounded-xl border border-blue-100 text-sm">
                <p className="font-semibold text-gray-900 mb-1 flex justify-between">
                  <span>Waktu Tinjauan:</span> 
                  <span className="font-normal text-gray-600 ml-6">
                    {new Date(appointment.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'})} - {formatTime(appointment.scheduled_at)}
                  </span>
                </p>
                <p className="font-semibold text-gray-900 flex justify-between">
                  <span>Keluhan Awal:</span> 
                  <span className="font-normal text-gray-600 max-w-[200px] truncate ml-6" title={appointment.chief_complaint}>{appointment.chief_complaint || '-'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="card p-6 md:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                <User className="w-5 h-5 text-gray-400" /> Data Pemeriksaan Objektif
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Diagnosis Utama *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Faringitis Akut (J02.9)"
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.diagnosis ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'}`}
                    {...register('diagnosis')}
                  />
                  {errors.diagnosis && <p className="text-xs text-red-500 mt-1">{errors.diagnosis.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gejala Teramati *</label>
                  <textarea
                    rows={3}
                    placeholder="Catat rincian gejala klinis, anamnesis, atau temuan fisik penting..."
                    className={`w-full p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none ${errors.symptoms ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'}`}
                    {...register('symptoms')}
                  />
                  {errors.symptoms && <p className="text-xs text-red-500 mt-1">{errors.symptoms.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan Tambahan (Bila ada)</label>
                  <textarea
                    rows={2}
                    placeholder="Edukasi pasien, tindakan lanjutan, dsb."
                    className="w-full p-4 rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                    {...register('notes')}
                  />
                </div>
              </div>
            </div>

            {/* Prescriptions Section */}
            <div className="card p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-orange-400" /> E-Resep Obat
                </h3>
                <button
                  type="button"
                  onClick={() => append({ name: '', dosage: '', frequency: '', duration: '' })}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah Obat
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <Pill className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-medium">Tidak ada obat yang diresepkan.</p>
                  <p className="text-gray-400 text-xs mt-1">Klik "Tambah Obat" untuk meresepkan obat ke apotek.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="relative p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 transition-colors group">
                      <div className="absolute -top-3 -left-3 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white">
                        {index + 1}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Hapus Obat"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      <div className="grid md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Obat / Merek</label>
                          <input
                            type="text"
                            placeholder="Contoh: &quot;Amlodipine 5mg&quot; atau &quot;Paracetamol 500mg&quot;"
                            className={`w-full px-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.medications?.[index]?.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'}`}
                            {...register(`medications.${index}.name`)}
                          />
                          {errors.medications?.[index]?.name && <p className="text-[10px] text-red-500 mt-1">{errors.medications[index]?.name?.message}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Sediaan / Dosis</label>
                          <input
                            type="text"
                            placeholder="Cth: Tablet / 10mg"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            {...register(`medications.${index}.dosage`)}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Aturan Pakai</label>
                          <input
                            type="text"
                            placeholder="Cth: 3x Sehari sesudah makan"
                            className={`w-full px-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.medications?.[index]?.frequency ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'}`}
                            {...register(`medications.${index}.frequency`)}
                          />
                          {errors.medications?.[index]?.frequency && <p className="text-[10px] text-red-500 mt-1">{errors.medications[index]?.frequency?.message}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Durasi</label>
                          <input
                            type="text"
                            placeholder="Cth: 5 Hari / Sampai Habis"
                            className={`w-full px-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.medications?.[index]?.duration ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 focus:bg-white'}`}
                            {...register(`medications.${index}.duration`)}
                          />
                          {errors.medications?.[index]?.duration && <p className="text-[10px] text-red-500 mt-1">{errors.medications[index]?.duration?.message}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-6 z-10 flex items-center justify-between p-4 md:p-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-200">
              <p className="hidden sm:block text-sm text-gray-500">
                Pastikan data yang diisi sudah benar dan final.
              </p>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center transition-transform hover:-translate-y-0.5 btn-ripple bg-green-600 hover:bg-green-700 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? 'Menyimpan...' : <><Save className="w-5 h-5 mr-2" /> Simpan Permanen</>}
                </button>
              </div>
            </div>

          </form>

        </div>
      ) : !loading && !appointment && !errorMsg ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Pilih Konsultasi</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Pilih pasien dari jadwal atau riwayat Anda untuk membuat rekam medis.
          </p>
          <Link
            href="/dashboard/doctor/schedule"
            className="inline-flex px-6 py-3 rounded-xl font-bold text-white transition-colors btn-ripple"
            style={{ background: 'var(--blue-accent)' }}
          >
            Kembali ke Jadwal
          </Link>
        </div>
      ) : null}

    </div>
  );
}

export default function WriteRecord() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <WriteRecordContent />
    </Suspense>
  );
}
