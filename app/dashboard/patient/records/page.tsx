// [TeleZeta] Patient Medical Records list
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { MOCK_MEDICAL_RECORDS } from '@/lib/types';
import type { MedicalRecord } from '@/lib/types';
import { formatTime } from '@/lib/utils/formatters';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { FileText, Calendar, Activity, Syringe, HeartPulse, Search, User, AlertCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';import { log, logError } from '@/lib/utils/logger';


// Helper type for joined query
type EnrichedRecord = MedicalRecord & {
  appointment?: {
    scheduled_at: string;
    doctor: {
      specialty: string;
      profiles: { full_name: string };
    };
  };
};

export default function PatientRecords() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id'); // pre-open if came from appointments
  
  const [records, setRecords] = useState<EnrichedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<EnrichedRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecords() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('medical_records')
          .select(`
            *,
            appointment:appointments (
              scheduled_at,
              doctor:doctors (
                specialty,
                profiles (full_name)
              )
            )
          `)
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRecords(data as any[]);
        
        // Auto open if highlighted
        if (highlightId && data) {
          const found = data.find(r => r.appointment_id === highlightId);
          if (found) setSelectedRecord(found as any);
        }
      } catch (err) {
        logError('[TeleZeta] Failed to fetch medical records:', err);
        setErrorMsg('Gagal memuat riwayat rekam medis. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, [user, supabase, highlightId]);

  const filteredRecords = records.filter(r =>
    (r.diagnosis ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.appointment?.doctor.profiles.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="animate-fadeUp flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-gray-900">Rekam Medis</h1>
          <p className="text-gray-600 mt-2">Riwayat kesehatan dan diagnosis Anda</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari diagnosis atau dokter..."
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
              className="card card-clickable p-6 flex flex-col h-full bg-white transition-all hover:-translate-y-1 hover:shadow-xl"
              onClick={() => setSelectedRecord(record)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tanggal</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(record.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="mb-4 flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                  {record.diagnosis}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  <span className="font-medium text-gray-700">Catatan: </span>{record.notes || '-'}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 leading-none mb-1">Oleh Dokter</p>
                    <p className="text-sm font-semibold text-gray-900 leading-none truncate max-w-[150px]">
                      {record.appointment?.doctor.profiles.full_name || 'Dokter Spesialis'}
                    </p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold p-2">
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
            Anda belum memiliki riwayat rekam medis. Rekam medis akan otomatis ditambahkan setelah Anda menyelesaikan konsultasi dengan dokter.
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
              
              {/* Doctor & Date info */}
              <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Dokter Pemeriksa</p>
                    <p className="font-bold text-gray-900">{selectedRecord?.appointment?.doctor.profiles.full_name || 'Dokter Spesialis'}</p>
                    <p className="text-xs text-blue-600">{selectedRecord?.appointment?.doctor.specialty || 'Poli Umum'}</p>
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
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Catatan Klinis</p>
                    <p className="text-gray-800">{selectedRecord?.notes || 'Tidak ada catatan.'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide uppercase text-gray-500 mb-3 border-b border-gray-100 pb-2">
                    <Syringe className="w-4 h-4" /> Catatan Tambahan Dokter
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200/60 rounded-xl p-5 text-gray-800">
                    {selectedRecord?.notes ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{selectedRecord.notes}</p>
                    ) : (
                      <p className="text-gray-500 italic">Tidak ada catatan tambahan dari dokter.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-sm text-gray-500">
              Dokumen ini adalah rekam medis resmi elektronik yang dikeluarkan oleh sistem TeleZeta.
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
