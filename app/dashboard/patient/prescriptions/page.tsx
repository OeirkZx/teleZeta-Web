// [TeleZeta] Patient Prescriptions Page
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { MOCK_PRESCRIPTIONS } from '@/lib/types';
import type { Prescription } from '@/lib/types';
import { formatTime } from '@/lib/utils/formatters';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import Badge from '@/components/common/Badge';
import { Pill, Search, Store, Clock, ArrowRight, User, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';import { log, logError } from '@/lib/utils/logger';


// Helper type for joined query
type EnrichedPrescription = Prescription & {
  doctor?: { profiles: { full_name: string } };
  pharmacist?: { pharmacy_name: string };
};

export default function PatientPrescriptions() {
  const { user, authReady } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  
  const [prescriptions, setPrescriptions] = useState<EnrichedPrescription[]>([]);
  const hasFetchedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<EnrichedPrescription | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    // Tunggu sampai auth check selesai dulu sebelum fetch
    if (!authReady) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function fetchPrescriptions() {
      setLoading(true);
      if (!user) {
        // Demo mode: tampilkan mock data untuk preview tanpa login
        setPrescriptions(MOCK_PRESCRIPTIONS as unknown as EnrichedPrescription[]);
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('prescriptions')
          .select(`
            id, patient_id, doctor_id, pharmacist_id, medical_record_id, status, notes, created_at, updated_at,
            doctor:doctors (profiles (full_name)),
            pharmacist:pharmacists (pharmacy_name),
            prescription_items (id, medicine_name, dosage, frequency, quantity, instructions)
          `)
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) throw error;

        // User sudah login: tampilkan data real (bisa kosong — itu wajar)
        setPrescriptions((data ?? []) as any[]);
      } catch (err) {
        logError('[TeleZeta] Failed to fetch prescriptions:', err);
        // Fallback ke mock data hanya saat terjadi error koneksi
        setPrescriptions(MOCK_PRESCRIPTIONS as unknown as EnrichedPrescription[]);
        setErrorMsg('Gagal memuat resep. Menampilkan data contoh.');
      } finally {
        setLoading(false);
      }
    }
    fetchPrescriptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);


  const handleTebusResep = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menebus resep ini sekarang? Resep akan diteruskan ke apotek mitra kami.')) return;
    
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      setPrescriptions(prev => prev.map(p => 
        p.id === id ? { ...p, status: 'processing', updated_at: new Date().toISOString() } : p
      ));
      
      alert('Berhasil! Resep Anda sedang diproses oleh apotek.');
    } catch (err) {
      logError('[TeleZeta] Error redeeming prescription:', err);
      alert('Gagal memproses resep. Silakan coba lagi nanti.');
    } finally {
      setProcessingId(null);
      setSelectedPrescription(null);
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    (p.prescription_items as any[])?.some((m: any) => m.medicine_name?.toLowerCase().includes(searchQuery.toLowerCase())) || // eslint-disable-line @typescript-eslint/no-explicit-any
    p.doctor?.profiles.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="animate-fadeUp flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-gray-900">Resep Obat</h1>
          <p className="text-gray-600 mt-2">Daftar resep digital dan riwayat penebusan obat Anda</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama obat atau dokter..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3 animate-fadeUp">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} width="100%" height={260} borderRadius={24} />)}
        </div>
      ) : filteredPrescriptions.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeUp d1">
          {filteredPrescriptions.map(pres => (
            <div 
              key={pres.id} 
              className="card p-6 flex flex-col h-full bg-white transition-all hover:shadow-xl group"
            >
              <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tanggal Resep</p>
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      {new Date(pres.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <Badge status={pres.status as any} />
              </div>

              <div className="mb-4 flex-1">
                <h3 className="font-bold text-sm text-gray-900 mb-2 flex justify-between items-center">
                  <span>Daftar Obat ({pres.prescription_items?.length || 0})</span>
                  <span className="text-xs font-normal text-blue-600 cursor-pointer" onClick={() => setSelectedPrescription(pres)}>Lihat Detail</span>
                </h3>
                <ul className="space-y-2 mb-4">
                  {(pres.prescription_items || []).slice(0, 2).map((med: any, i: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                      <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <div>
                        <span className="font-semibold">{med.medicine_name}</span>
                        {med.dosage && <span className="text-gray-500 text-xs ml-1">({med.dosage})</span>}
                      </div>
                    </li>
                  ))}
                  {(pres.prescription_items?.length || 0) > 2 && (
                    <li className="text-xs text-center text-gray-500 pt-1 font-medium bg-gray-50 p-2 rounded-lg cursor-pointer" onClick={() => setSelectedPrescription(pres)}>
                      + {(pres.prescription_items?.length || 0) - 2} obat lainnya...
                    </li>
                  )}
                </ul>

                <div className="text-xs text-gray-500 flex flex-col gap-1.5 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> <span>Dokter: <b>{pres.doctor?.profiles.full_name || '-'}</b></span>
                  </div>
                  {pres.status !== 'pending' && pres.pharmacist && (
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-orange-500" /> <span>Apotek: <b className="text-orange-600">{pres.pharmacist.pharmacy_name}</b></span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto pt-2">
                {pres.status === 'pending' ? (
                  <button
                    onClick={() => handleTebusResep(pres.id)}
                    disabled={processingId === pres.id}
                    className="w-full py-3 rounded-xl font-bold text-white shadow-sm flex items-center justify-center transition-transform hover:-translate-y-0.5 text-sm btn-ripple"
                    style={{ background: 'var(--blue-accent)' }}
                  >
                    {processingId === pres.id ? 'Memproses...' : 'Tebus Resep Sekarang'}
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedPrescription(pres)}
                    className="w-full py-3 rounded-xl font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors text-sm"
                  >
                    Lihat Status Pesanan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
          <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Resep</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Anda belum memiliki resep dokter. Resep akan muncul di sini setelah dokter meresepkan obat melalui konsultasi.
          </p>
        </div>
      )}

      {/* Prescription Detail Dialog */}
      <Dialog.Root open={!!selectedPrescription} onOpenChange={(open) => !open && setSelectedPrescription(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn cursor-pointer" onClick={() => setSelectedPrescription(null)} />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl p-0 w-[95vw] max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] z-50 overflow-hidden outline-none animate-popIn flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
              <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                <Pill className="text-blue-500 w-6 h-6" /> Detail Resep
              </h2>
              <Badge status={selectedPrescription?.status as any} />
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Status Tracker */}
              {selectedPrescription && selectedPrescription.status !== 'pending' && (
                <div className="mb-8 bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h3 className="font-bold text-sm text-gray-900 mb-4">Status Pemesanan</h3>
                  <div className="relative">
                    <div className="absolute top-0 bottom-0 left-[15px] w-0.5 bg-gray-200">
                      <div className="w-full bg-blue-500 transition-all duration-500" style={{ 
                        height: selectedPrescription.status === 'processing' ? '33%' : 
                                selectedPrescription.status === 'ready' ? '66%' : '100%' 
                      }}></div>
                    </div>
                    <ul className="space-y-6 relative z-10">
                      <li className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">Resep Diterima</p>
                          <p className="text-xs text-gray-500">Resep telah diteruskan ke apotek mitra.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          ['processing', 'ready', 'dispensed'].includes(selectedPrescription.status) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                        }`}>
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${['processing', 'ready', 'dispensed'].includes(selectedPrescription.status) ? 'text-gray-900' : 'text-gray-400'}`}>Sedang Disiapkan</p>
                          <p className="text-xs text-gray-500">Apoteker sedang meracik dan menyiapkan obat Anda.</p>
                          {selectedPrescription.status === 'processing' && (
                            <p className="text-xs font-semibold text-orange-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Sedang berlangsung</p>
                          )}
                        </div>
                      </li>
                      <li className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          ['ready', 'dispensed'].includes(selectedPrescription.status) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                        }`}>
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${['ready', 'dispensed'].includes(selectedPrescription.status) ? 'text-gray-900' : 'text-gray-400'}`}>Obat Siap</p>
                          <p className="text-xs text-gray-500">Obat sudah siap untuk diambil / dikirim.</p>
                          {selectedPrescription.status === 'ready' && (
                            <p className="text-xs font-semibold text-green-500 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Silakan menuju apotek yang ditunjuk</p>
                          )}
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Patient & Doctor Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Diresepkan Oleh</p>
                  <p className="font-bold text-gray-900">{selectedPrescription?.doctor?.profiles.full_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tanggal & Waktu</p>
                  <p className="font-bold text-gray-900">{selectedPrescription ? new Date(selectedPrescription.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} - {selectedPrescription ? formatTime(selectedPrescription.created_at) : ''}</p>
                </div>
              </div>

              {/* Medication List */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Daftar Obat</p>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {(selectedPrescription?.prescription_items || []).map((med: any, i: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <div key={i} className="p-4 bg-white flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                        <span className="font-bold text-sm">{i+1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-gray-900">{med.medicine_name}</h4>
                          {med.dosage && <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{med.dosage}</span>}
                        </div>
                        <div className="flex gap-4 mt-2">
                          <p className="text-sm text-gray-600"><span className="text-gray-400">Aturan Pakai:</span> <br/>{med.frequency}</p>
                          <p className="text-sm text-gray-600"><span className="text-gray-400">Jumlah:</span> <br/>{med.quantity} {med.instructions ? `(${med.instructions})` : ''}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor's Notes */}
              {selectedPrescription?.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Catatan Tambahan Dokter</p>
                  <div className="bg-yellow-50 border border-yellow-200/60 rounded-xl p-4 text-sm text-gray-800">
                    <p className="whitespace-pre-wrap">{selectedPrescription.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
              {selectedPrescription?.status === 'pending' && (
                <button
                  onClick={() => handleTebusResep(selectedPrescription.id)}
                  disabled={processingId === selectedPrescription.id}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white shadow-sm flex items-center justify-center transition-transform hover:-translate-y-0.5 btn-ripple"
                  style={{ background: 'var(--blue-accent)' }}
                >
                  {processingId === selectedPrescription.id ? 'Memproses...' : 'Tebus Resep Sekarang'}
                </button>
              )}
              <button
                onClick={() => setSelectedPrescription(null)}
                className="flex-1 py-3.5 rounded-xl font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
                disabled={processingId === selectedPrescription?.id}
              >
                Tutup
              </button>
            </div>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
