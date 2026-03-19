// [TeleZeta] Pharmacist Prescription Queue Page
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import Badge from '@/components/common/Badge';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { formatTime, formatRelativeTime } from '@/lib/utils/formatters';
import {
  ClipboardList, Search, CheckCircle2, Clock, AlertCircle,
  Pill, User, ArrowRight, Loader2, Filter
} from 'lucide-react';

type QueueFilter = 'all' | 'processing' | 'ready';

export default function PharmacistQueue() {
  const { user } = useAuth();
  const supabase = createClient();

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQueue() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('prescriptions')
          .select(`
            *,
            patient:profiles!patient_id(full_name, phone, gender, date_of_birth),
            doctor:doctors(specialty, profiles(full_name)),
            prescription_items(*)
          `)
          .or(`pharmacist_id.eq.${user.id},pharmacist_id.is.null`)
          .in('status', ['processing', 'ready'])
          .order('created_at', { ascending: true });

        if (error) throw error;
        setPrescriptions(data || []);
      } catch (err) {
        console.error('[TeleZeta] Failed to fetch queue:', err);
        setErrorMsg('Gagal memuat daftar antrian. Silakan muat ulang halaman.');
      } finally {
        setLoading(false);
      }
    }
    fetchQueue();
  }, [user, supabase]);

  const handleUpdateStatus = async (id: string, newStatus: 'ready' | 'dispensed') => {
    if (!user) return;
    setUpdatingId(id);
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      const prescription = prescriptions.find(p => p.id === id);
      if (prescription && !prescription.pharmacist_id) {
        updateData.pharmacist_id = user.id;
      }

      const { error } = await supabase
        .from('prescriptions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      if (newStatus === 'dispensed') {
        setPrescriptions(prev => prev.filter(p => p.id !== id));
      } else {
        setPrescriptions(prev =>
          prev.map(p => (p.id === id ? { ...p, ...updateData } : p))
        );
      }
    } catch (err) {
      console.error('[TeleZeta] Failed to update status:', err);
      alert('Gagal memperbarui status resep.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = prescriptions
    .filter(p => {
      if (filter !== 'all' && p.status !== filter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.id.toLowerCase().includes(q) ||
          p.patient?.full_name?.toLowerCase().includes(q)
        );
      }
      return true;
    });

  const processingCount = prescriptions.filter(p => p.status === 'processing').length;
  const readyCount = prescriptions.filter(p => p.status === 'ready').length;

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton width="100%" height={80} borderRadius={24} />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} width="100%" height={140} borderRadius={16} />
          ))}
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-10 h-10 mb-3 opacity-80" />
          <h3 className="text-xl font-bold mb-1">Terjadi Kesalahan</h3>
          <p>{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="animate-fadeUp">
        <h1 className="text-3xl font-serif text-gray-900">Antrian Resep</h1>
        <p className="text-gray-600 mt-2">Kelola resep masuk dan siapkan obat pasien</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fadeUp d1">
        <div className="card p-5 border-l-4 border-l-orange-500">
          <AlertCircle className="w-5 h-5 text-orange-500 mb-2" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Perlu Diracik</p>
          <h2 className="text-2xl font-bold text-orange-600 mt-1">{processingCount}</h2>
        </div>
        <div className="card p-5 border-l-4 border-l-blue-500">
          <CheckCircle2 className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Siap Diambil</p>
          <h2 className="text-2xl font-bold text-blue-600 mt-1">{readyCount}</h2>
        </div>
        <div className="card p-5 border-l-4 border-l-green-500 col-span-2 md:col-span-1">
          <ClipboardList className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Antrian</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">{prescriptions.length}</h2>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 animate-fadeUp d2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama pasien atau ID resep..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {([
            { key: 'all', label: 'Semua', color: 'gray' },
            { key: 'processing', label: 'Diracik', color: 'orange' },
            { key: 'ready', label: 'Siap', color: 'blue' },
          ] as const).map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                filter === key
                  ? `bg-${color}-50 text-${color}-700 border-2 border-${color}-200 shadow-sm`
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}
              style={filter === key ? {
                backgroundColor: color === 'orange' ? '#fff7ed' : color === 'blue' ? '#eff6ff' : '#f9fafb',
                color: color === 'orange' ? '#c2410c' : color === 'blue' ? '#1d4ed8' : '#374151',
                borderColor: color === 'orange' ? '#fed7aa' : color === 'blue' ? '#bfdbfe' : '#e5e7eb',
              } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-4 animate-fadeUp d3">
        {filtered.length > 0 ? (
          filtered.map((prescription, i) => (
            <div
              key={prescription.id}
              className="card p-5 md:p-6 bg-white hover:shadow-lg transition-all border border-gray-100"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
            >
              <div className="flex flex-col md:flex-row gap-4 md:items-center">
                {/* Priority indicator */}
                <div className={`w-2 h-full min-h-[60px] rounded-full shrink-0 hidden md:block ${
                  prescription.status === 'processing' ? 'bg-orange-400' : 'bg-blue-400'
                }`} />

                {/* Info */}
                <div className="flex-1 grid md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-3">
                    <p className="text-xs font-mono text-gray-400 mb-1">#{prescription.id.split('-')[0].toUpperCase()}</p>
                    <h3 className="font-bold text-gray-900 text-lg">{prescription.patient?.full_name || 'Pasien'}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {prescription.patient?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </p>
                  </div>

                  <div className="md:col-span-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dokter Peresep</p>
                    <p className="text-sm font-semibold text-gray-800">{prescription.doctor?.profiles?.full_name || '-'}</p>
                    <p className="text-xs text-blue-600 font-medium">{prescription.doctor?.specialty || 'Umum'}</p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Item Obat</p>
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-orange-400" />
                      <span className="font-bold text-gray-900">{prescription.prescription_items?.length || 0} obat</span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Waktu Masuk</p>
                    <p className="text-sm text-gray-700 font-medium">{formatRelativeTime(prescription.created_at)}</p>
                    <p className="text-xs text-gray-400">{formatTime(prescription.created_at)}</p>
                  </div>

                  <div className="md:col-span-2 flex flex-col items-start md:items-end gap-2">
                    <Badge status={prescription.status} />

                    {prescription.status === 'processing' && (
                      <button
                        onClick={() => handleUpdateStatus(prescription.id, 'ready')}
                        disabled={updatingId === prescription.id}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:-translate-y-0.5 shadow-sm btn-ripple disabled:opacity-60 flex items-center gap-1.5"
                        style={{ background: 'var(--blue-accent)' }}
                      >
                        {updatingId === prescription.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Siap
                          </>
                        )}
                      </button>
                    )}

                    {prescription.status === 'ready' && (
                      <button
                        onClick={() => handleUpdateStatus(prescription.id, 'dispensed')}
                        disabled={updatingId === prescription.id}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-green-500 hover:bg-green-600 transition-all hover:-translate-y-0.5 shadow-sm disabled:opacity-60 flex items-center gap-1.5"
                      >
                        {updatingId === prescription.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Serahkan
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Medication Preview */}
              {prescription.prescription_items && prescription.prescription_items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {prescription.prescription_items.slice(0, 4).map((item: any) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-semibold border border-orange-100"
                      >
                        <Pill className="w-3 h-3 mr-1.5" />
                        {item.medicine_name} — {item.dosage}
                      </span>
                    ))}
                    {prescription.prescription_items.length > 4 && (
                      <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
                        +{prescription.prescription_items.length - 4} lainnya
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Antrian Kosong</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchQuery
                ? 'Tidak ditemukan resep yang cocok dengan pencarian.'
                : 'Semua resep telah selesai diproses. Resep baru akan otomatis muncul di sini.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
