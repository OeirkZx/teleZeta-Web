// [TeleZeta] Pharmacist Prescription History Page
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import Badge from '@/components/common/Badge';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { formatDate, formatTime, formatDateShort } from '@/lib/utils/formatters';import { log, logError } from '@/lib/utils/logger';

import {
  History, Search, Pill, User, Calendar, TrendingUp,
  ChevronDown, ChevronUp, Package
} from 'lucide-react';

export default function PharmacistHistory() {
  const { user } = useAuth();
  const supabase = createClient();

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      try {
        let query = supabase
          .from('prescriptions')
          .select(`
            *,
            patient:profiles!patient_id(full_name, phone, gender),
            doctor:doctors(specialty, profiles(full_name)),
            prescription_items(*)
          `)
          .eq('pharmacist_id', user.id)
          .eq('status', 'dispensed')
          .order('updated_at', { ascending: false });

        // Apply date filter
        if (dateRange !== 'all') {
          const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
          const since = new Date();
          since.setDate(since.getDate() - days);
          query = query.gte('updated_at', since.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;
        setPrescriptions(data || []);
      } catch (err) {
        logError('[TeleZeta] Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user, supabase, dateRange]);

  const filtered = prescriptions.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      p.patient?.full_name?.toLowerCase().includes(q) ||
      p.prescription_items?.some((item: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
        item.medicine_name.toLowerCase().includes(q)
      )
    );
  });

  // Group by date
  const grouped = filtered.reduce((acc: Record<string, any[]>, p) => {
    const dateKey = new Date(p.updated_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(p);
    return acc;
  }, {});

  const totalItems = prescriptions.reduce(
    (sum, p) => sum + (p.prescription_items?.length || 0), 0
  );

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton width="100%" height={80} borderRadius={24} />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} width="100%" height={120} borderRadius={16} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="animate-fadeUp">
        <h1 className="text-3xl font-serif text-gray-900">Riwayat Resep</h1>
        <p className="text-gray-600 mt-2">Riwayat semua resep yang telah selesai diproses</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fadeUp d1">
        <div className="card p-5 border-l-4 border-l-green-500">
          <History className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Resep</p>
          <h2 className="text-2xl font-bold text-green-600 mt-1">{prescriptions.length}</h2>
        </div>
        <div className="card p-5 border-l-4 border-l-orange-500">
          <Pill className="w-5 h-5 text-orange-500 mb-2" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Item Obat</p>
          <h2 className="text-2xl font-bold text-orange-600 mt-1">{totalItems}</h2>
        </div>
        <div className="card p-5 border-l-4 border-l-blue-500 col-span-2 md:col-span-1">
          <TrendingUp className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pasien Dilayani</p>
          <h2 className="text-2xl font-bold text-blue-600 mt-1">
            {new Set(prescriptions.map(p => p.patient_id)).size}
          </h2>
        </div>
      </div>

      {/* Search & Date Filter */}
      <div className="flex flex-col md:flex-row gap-4 animate-fadeUp d2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama pasien, ID resep, atau nama obat..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {([
            { key: '7d', label: '7 Hari' },
            { key: '30d', label: '30 Hari' },
            { key: '90d', label: '90 Hari' },
            { key: 'all', label: 'Semua' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDateRange(key)}
              className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                dateRange === key
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* History List grouped by date */}
      <div className="space-y-8 animate-fadeUp d3">
        {Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{date}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length} resep</span>
              </div>

              <div className="space-y-3">
                {items.map((prescription: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <div
                    key={prescription.id}
                    className="card bg-white border border-gray-100 overflow-hidden transition-all hover:shadow-md"
                  >
                    {/* Main Row */}
                    <button
                      className="w-full p-4 md:p-5 flex items-center gap-4 text-left"
                      onClick={() => setExpandedId(expandedId === prescription.id ? null : prescription.id)}
                    >
                      <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                      </div>

                      <div className="flex-1 grid md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-3">
                          <p className="font-bold text-gray-900">{prescription.patient?.full_name}</p>
                          <p className="text-xs font-mono text-gray-400">#{prescription.id.split('-')[0].toUpperCase()}</p>
                        </div>

                        <div className="md:col-span-3">
                          <p className="text-sm text-gray-600">{prescription.doctor?.profiles?.full_name}</p>
                          <p className="text-xs text-blue-600 font-medium">{prescription.doctor?.specialty}</p>
                        </div>

                        <div className="md:col-span-2">
                          <p className="text-sm font-semibold text-gray-700">
                            {prescription.prescription_items?.length || 0} obat
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500">{formatTime(prescription.updated_at)}</p>
                        </div>

                        <div className="md:col-span-2 flex items-center justify-end gap-2">
                          <Badge status="dispensed" />
                          {expandedId === prescription.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Detail */}
                    {expandedId === prescription.id && (
                      <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50 animate-slideDown">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Pill className="w-4 h-4 text-orange-500" /> Daftar Obat
                        </h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          {prescription.prescription_items?.map((item: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                            <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200">
                              <p className="font-bold text-gray-900 text-sm">{item.medicine_name}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.dosage}</span>
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{item.frequency}</span>
                                <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                              </div>
                              {item.instructions && (
                                <p className="text-xs text-gray-500 mt-2 italic">{item.instructions}</p>
                              )}
                            </div>
                          ))}
                        </div>
                        {prescription.notes && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs font-bold text-yellow-800 mb-1">Catatan Dokter:</p>
                            <p className="text-sm text-yellow-700">{prescription.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Riwayat</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchQuery
                ? 'Tidak ditemukan resep yang cocok dengan pencarian.'
                : 'Riwayat resep yang telah diserahkan akan muncul di sini.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
