// [TeleZeta] Doctor Medical Records list
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import type { MedicalRecord, Profile } from '@/lib/types';
import { formatTime } from '@/lib/utils/formatters';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import Avatar from '@/components/common/Avatar';
import { FileText, Calendar, Activity, Syringe, HeartPulse, Search, AlertCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

// Helper type for joined query
type EnrichedRecord = MedicalRecord & {
  patient: Profile;
  appointment?: {
    scheduled_at: string;
  };
};

export default function DoctorRecords() {
  const { user, authReady } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');
  
  const [records, setRecords] = useState<EnrichedRecord[]>([]);
  const hasFetchedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<EnrichedRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Tunggu sampai auth check selesai dulu sebelum fetch
    if (!authReady || !user) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function fetchRecords() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('medical_records')
          .select(`
            id, appointment_id, patient_id, doctor_id, diagnosis, notes, follow_up_date, created_at,
            patient:profiles!patient_id (id, full_name, avatar_url, gender, date_of_birth),
            appointment:appointments (scheduled_at)
          `)
          .eq('doctor_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) throw error;
        setRecords((data ?? []) as unknown as EnrichedRecord[]);
        
        if (highlightId && data) {
          const found = data.find((r: any) => r.appointment_id === highlightId);
          if (found) setSelectedRecord(found as unknown as EnrichedRecord);
        }
      } catch (err) {
        setErrorMsg('Gagal memuat riwayat rekam medis. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  const filteredRecords = records.filter((r: EnrichedRecord) =>
    (r.diagnosis ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.patient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="animate-fadeUp flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-gray-900">Riwayat Rekam Medis</h1>
          <p className="text-gray-600 mt-2">Daftar rekam medis yang pernah Anda buat untuk pasien</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari diagnosis atau nama pasien..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {errorMsg ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-10 h-10 mb-3 opacity-80" />
          <h3 className="text-xl font-bold mb-1">Terjadi Kesalahan</h3>
          <p>{errorMsg}</p>
        </div>
      ) : loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} width="100%" height={220} borderRadius={24} />)}
        </div>
      ) : filteredRecords.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeUp d1">
          {filteredRecords.map(record => (
            <div 
              key={record.id} 
              className="card card-clickable p-6 flex flex-col h-full bg-white transition-all hover:-translate-y-1 hover:shadow-xl group"
              onClick={() => setSelectedRecord(record)}
            >
              <div className="flex items-center gap-4 mb-4">
                <Avatar
                  name={record.patient?.full_name || ''}
                  src={record.patient?.avatar_url}
                  size={48}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-base line-clamp-1">{record.patient?.full_name}</h3>
                  <p className="text-sm font-semibold text-gray-400">
                    {new Date(record.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="mb-4 flex-1">
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">Diagnosis</p>
                <h4 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                  {record.diagnosis}
                </h4>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  <span className="font-medium text-gray-700">Catatan: </span>{record.notes || '-'}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4 flex items-center justify-between mt-auto">
                <div className="text-xs text-gray-400">
                  ID: {record.id.split('-')[0].toUpperCase()}
                </div>
                <button className="text-blue-600 group-hover:text-blue-800 text-sm font-semibold p-2 transition-colors">
                  Lihat Detail
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Rekam Medis</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Anda belum pernah mengisi rekam medis untuk pasien manapun.
          </p>
        </div>
      )}

      {/* Record Detail Dialog */}
      <Dialog.Root open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl p-0 w-[95vw] max-w-2xl shadow-2xl z-50 overflow-hidden outline-none animate-popIn flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between text-white" style={{ background: 'var(--navy-primary)' }}>
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-300" />
                <div>
                  <h2 className="font-bold text-lg leading-tight">Detail Rekam Medis</h2>
                  <p className="text-blue-200 text-sm opacity-90">ID: {selectedRecord?.id.split('-')[0].toUpperCase()}</p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20">
                  <span className="sr-only">Tutup</span>
                  ✕
                </button>
              </Dialog.Close>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6">
              
              {/* Patient & Date info */}
              <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={selectedRecord?.patient?.full_name || ''}
                    src={selectedRecord?.patient?.avatar_url}
                    size={48}
                  />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Pasien</p>
                    <p className="font-bold text-gray-900">{selectedRecord?.patient?.full_name || 'Pasien Anonim'}</p>
                    <p className="text-xs text-gray-600">
                      {selectedRecord?.patient?.gender === 'L' ? 'Laki-laki' : selectedRecord?.patient?.gender === 'P' ? 'Perempuan' : ''} 
                      {selectedRecord?.patient?.date_of_birth ? ` • ${new Date().getFullYear() - new Date(selectedRecord.patient.date_of_birth).getFullYear()} tahun` : ''}
                    </p>
                  </div>
                </div>
                
                <div className="w-px h-10 bg-gray-200 hidden md:block"></div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Waktu Pemeriksaan</p>
                    <p className="font-bold text-gray-900">
                      {selectedRecord ? new Date(selectedRecord.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </p>
                    <p className="text-xs text-gray-600">{selectedRecord ? formatTime(selectedRecord.created_at) : ''} WIB</p>
                  </div>
                </div>
              </div>

              {/* Medical Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide uppercase text-gray-500 mb-3 border-b border-gray-100 pb-2">
                    <HeartPulse className="w-4 h-4" /> Diagnosis & Keluhan
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Diagnosis Utama</p>
                    <p className="text-lg font-serif text-gray-900">{selectedRecord?.diagnosis}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Catatan Klinis (Sistem/Gejala)</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedRecord?.notes || 'Tidak ada catatan.'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide uppercase text-gray-500 mb-3 border-b border-gray-100 pb-2">
                    <Syringe className="w-4 h-4" /> Tindakan & Edukasi Tambahan
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200/60 rounded-xl p-5 text-gray-800">
                    {selectedRecord?.notes ? (
                      <p className="text-gray-800 italic text-sm">Lihat pada bagian catatan klinis. Apabila ada resep daring yang diberikan, daftar obat telah otomatis diteruskan ke farmasi terkait.</p>
                    ) : (
                      <p className="text-gray-500 italic">Tidak ada catatan tambahan.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-sm text-gray-500">
              Dokumen ini adalah rekam medis resmi elektronik yang dimasukkan oleh Anda via sistem TeleZeta.
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
