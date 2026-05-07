// [TeleZeta] Pharmacist Home Dashboard
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import StatCard from '@/components/common/StatCard';
import Badge from '@/components/common/Badge';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { formatTime } from '@/lib/utils/formatters';
import { ArrowRight, Package, Store, Clock, CheckCircle2, TrendingUp, AlertCircle, Search } from 'lucide-react';import { log, logError } from '@/lib/utils/logger';


export default function PharmacistDashboard() {
  const { user, profile, authReady } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [pharmacistData, setPharmacistData] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ new: 0, processing: 0, ready: 0, completed_today: 0 });
  const hasFetchedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Tunggu sampai auth check selesai dulu sebelum fetch
    if (!authReady || !user) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function fetchData() {
      setLoading(true);
      try {
        // Get pharmacist profile
        const { data: pharm } = await supabase
          .from('pharmacists')
          .select('pharmacy_name, pharmacy_address, sipa_number, is_active')
          .eq('id', user!.id)
          .single();
        
        setPharmacistData(pharm);

        const { data: orders } = await supabase
          .from('prescriptions')
          .select('id, status, updated_at, patient:profiles!patient_id(full_name), doctor:doctors(profiles(full_name)), prescription_items(id)')
          .or(`pharmacist_id.eq.${user!.id},and(pharmacist_id.is.null,status.eq.processing)`)
          .order('updated_at', { ascending: false })
          .limit(20);

        setRecentOrders(orders || []);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const new_orders = orders?.filter((o: any) => o.status === 'pending').length || 0;
        const proc = orders?.filter((o: any) => o.status === 'processing').length || 0;
        const ready = orders?.filter((o: any) => o.status === 'ready').length || 0;
        
        const comp = orders?.filter((o: any) => 
          o.status === 'dispensed' && new Date(o.updated_at) >= todayStart
        ).length || 0;

        setStats({ new: new_orders, processing: proc, ready, completed_today: comp });

      } catch (err) {
        logError('[TeleZeta] Failed to fetch pharmacist dashboard:', err);
        setErrorMsg('Gagal memuat data pesanan apotek. Silakan muat ulang halaman.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton width="100%" height={160} borderRadius={24} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} height={120} borderRadius={24} />)}
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
      
      {/* Header Profile */}
      <div className="animate-fadeUp card p-6 md:p-8 bg-blue-900 text-white relative overflow-hidden border-none">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Store className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-blue-200 font-medium mb-1 tracking-wide uppercase text-sm">Apotek Mitra TeleZeta</p>
            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-white mb-2">{pharmacistData?.pharmacy_name || 'Apotek Anda'}</h1>
            <p className="text-blue-100 flex items-center gap-2">
              <Store className="w-4 h-4" /> {pharmacistData?.pharmacy_address || 'Alamat Apotek'} • SIA: {pharmacistData?.sipa_number || '-'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/pharmacist/queue" className="px-6 py-3 rounded-xl font-bold bg-white text-blue-900 hover:bg-gray-50 flex items-center transition-colors shadow-lg">
              <Package className="w-5 h-5 mr-2" /> Proses Pesanan
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 animate-fadeUp d1">
        <div className="card p-5 border-l-4 border-l-orange-500">
          <AlertCircle className="w-6 h-6 text-orange-500 mb-3" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pesanan Baru</p>
          <div className="flex items-end gap-2 text-orange-600">
            <h2 className="text-3xl font-bold">{stats.new}</h2>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-l-blue-500">
          <Clock className="w-6 h-6 text-blue-500 mb-3" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sedang Diracik</p>
          <div className="flex items-end gap-2 text-gray-900">
            <h2 className="text-3xl font-bold">{stats.processing}</h2>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-l-yellow-400">
          <CheckCircle2 className="w-6 h-6 text-yellow-500 mb-3" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Siap Diambil</p>
          <div className="flex items-end gap-2 text-gray-900">
            <h2 className="text-3xl font-bold">{stats.ready}</h2>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-l-green-500 bg-green-50/30">
          <TrendingUp className="w-6 h-6 text-green-500 mb-3" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Selesai Hari Ini</p>
          <div className="flex items-end gap-2 text-green-700">
            <h2 className="text-3xl font-bold">{stats.completed_today}</h2>
          </div>
        </div>
      </div>

      {/* Orders Overview */}
      <div className="animate-fadeUp d2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Aktivitas Terbaru</h2>
          <Link href="/dashboard/pharmacist/queue" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-3 md:col-span-2">Waktu</div>
              <div className="col-span-5 md:col-span-3">Pasien</div>
              <div className="hidden md:block md:col-span-3">Dokter</div>
              <div className="hidden md:block md:col-span-2">Item Obat</div>
              <div className="col-span-4 md:col-span-2 text-right md:text-left">Status</div>
            </div>
            <div className="divide-y divide-gray-100">
              {recentOrders.slice(0, 8).map((order) => (
                <Link key={order.id} href={`/dashboard/pharmacist/queue?id=${order.id}`} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors group">
                  <div className="col-span-3 md:col-span-2 text-sm">
                    <p className="font-semibold text-gray-900">{formatTime(order.updated_at)}</p>
                    <p className="text-xs text-gray-500">{new Date(order.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <div className="col-span-5 md:col-span-3">
                    <p className="font-bold text-gray-900 text-sm truncate">{order.patient?.full_name}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5" title={order.id}>#{order.id.split('-')[0].toUpperCase()}</p>
                  </div>
                  <div className="hidden md:block md:col-span-3 text-sm text-gray-600 truncate">
                    {order.doctor?.profiles?.full_name}
                  </div>
                  <div className="hidden md:block md:col-span-2 text-sm font-semibold text-gray-700">
                    {order.prescription_items?.length || 0} Obat
                  </div>
                  <div className="col-span-4 md:col-span-2 text-right md:text-left">
                    <Badge status={order.status as any} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Pesanan</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Menunggu resep masuk dari pasien. Pesanan baru akan otomatis muncul di sini.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
