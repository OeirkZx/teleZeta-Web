// [TeleZeta] Doctor Statistics Page
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import StatCard from '@/components/common/StatCard';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { Users, CheckCircle, Clock, TrendingUp, Star, Calendar } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';import { log, logError } from '@/lib/utils/logger';


export default function DoctorStats() {
  const { user } = useAuth();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAll: 0,
    totalCompleted: 0,
    totalPatients: 0,
    pending: 0,
    cancelled: 0,
    earningsMtd: 0, // Mock for now
    rating: 4.8 // Mock rating
  });

  const [monthlyChart, setMonthlyChart] = useState<{month: string, count: number}[]>([]);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      try {
        const { data: apps, error } = await supabase
          .from('appointments')
          .select('status, scheduled_at, patient_id')
          .eq('doctor_id', user.id);

        if (error) throw error;

        let completed = 0;
        let pending = 0;
        let cancelled = 0;
        const patients = new Set();
        let currentMonthCount = 0;

        const currentMonth = new Date().getMonth();
        const monthlyData = Array.from({length: 6}).map((_, i) => {
          const d = new Date();
          d.setMonth(currentMonth - 5 + i);
          return { month: d.toLocaleDateString('id-ID', { month: 'short' }), count: 0 };
        });

        (apps || []).forEach(app => {
          patients.add(app.patient_id);
          if (app.status === 'completed') completed++;
          if (app.status === 'pending' || app.status === 'confirmed' || app.status === 'ongoing') pending++;
          if (app.status === 'cancelled') cancelled++;

          // Build chart data
          const appDate = new Date(app.scheduled_at);
          if (appDate.getMonth() === currentMonth) currentMonthCount++;
          
          for (let i = 0; i < 6; i++) {
            const m = new Date();
            m.setMonth(currentMonth - 5 + i);
            if (appDate.getMonth() === m.getMonth() && appDate.getFullYear() === m.getFullYear()) {
              monthlyData[i].count++;
            }
          }
        });

        setStats({
          totalAll: apps?.length || 0,
          totalCompleted: completed,
          totalPatients: patients.size,
          pending,
          cancelled,
          earningsMtd: currentMonthCount * 150000, // Assuming Rp150.000 per consult
          rating: 4.8
        });

        setMonthlyChart(monthlyData);
      } catch (err) {
        logError('[TeleZeta] Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton width={200} height={32} className="mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} height={140} borderRadius={24} />)}
        </div>
        <Skeleton width="100%" height={300} borderRadius={24} className="mt-8" />
      </div>
    );
  }

  // Find max for simple purely CSS based chart
  const maxChartValue = Math.max(...monthlyChart.map(m => m.count), 10); // min 10 scale

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="animate-fadeUp flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-gray-900">Performa & Statistik</h1>
          <p className="text-gray-600 mt-2">Tinjauan komprehensif aktivitas praktik Anda</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 shadow-sm">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span>Bulan Ini ({new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})</span>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        <div className="card p-5 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50/20">
          <Users className="w-6 h-6 text-blue-500 mb-3" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Pasien</p>
          <div className="flex items-end gap-2">
            <h2 className="text-3xl font-bold text-gray-900">{stats.totalPatients}</h2>
            <span className="text-sm font-semibold text-green-500 mb-1 flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" /> +12%</span>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-green-500">
          <CheckCircle className="w-6 h-6 text-green-500 mb-3" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Telesai</p>
          <h2 className="text-3xl font-bold text-gray-900">{stats.totalCompleted}</h2>
        </div>

        <div className="card p-5 border-l-4 border-l-orange-500">
          <Clock className="w-6 h-6 text-orange-500 mb-3" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Rata-rata Waktu Respon</p>
          <h2 className="text-3xl font-bold text-gray-900">&lt; 5m</h2>
        </div>

        <div className="card p-5 border-l-4 border-l-yellow-400 bg-gradient-to-br from-white to-yellow-50/20">
          <Star className="w-6 h-6 text-yellow-400 mb-3" fill="currentColor" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Rating Bintang</p>
          <div className="flex items-end gap-2">
            <h2 className="text-3xl font-bold text-gray-900">{stats.rating}</h2>
            <span className="text-sm text-gray-500 mb-1">/ 5.0</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Simple Bar Chart */}
        <div className="card p-6 md:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-gray-900">Tren Konsultasi (6 Bulan Terakhir)</h3>
          </div>
          <div className="flex-1 flex items-end gap-2 sm:gap-6 min-h-[200px] pb-2 relative">
            {/* Y-axis guidelines */}
            <div className="absolute inset-0 flex flex-col justify-between pt-1 pb-8 pointer-events-none">
              <div className="w-full border-t border-dashed border-gray-200" />
              <div className="w-full border-t border-dashed border-gray-200" />
              <div className="w-full border-t border-gray-200" />
            </div>

            {monthlyChart.map((item, idx) => {
              const height = (item.count / maxChartValue) * 100;
              return (
                <div key={idx} className="flex flex-col items-center justify-end gap-1 flex-1 group relative z-10 h-full pb-8">
                  {/* Tooltip */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    {item.count} konsultasi
                  </div>
                  {/* Label angka */}
                  <span className="text-xs font-bold text-gray-700">{item.count}</span>
                  {/* Bar */}
                  <div 
                    className="w-full max-w-[48px] rounded-t-lg transition-all duration-500 relative"
                    style={{ 
                      height: `${Math.max(height, 5)}%`,
                      background: 'var(--blue-accent)',
                      opacity: item.count > 0 ? 1 : 0.3
                    }}
                  >
                  </div>
                  {/* Label */}
                  <div className="absolute bottom-0 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {item.month}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Earning Estimation (Mock) */}
        <div className="card p-6 flex flex-col justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-40 h-40 bg-green-50 rounded-full z-0" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-32 h-32 bg-blue-50 rounded-full z-0" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-green-500">
              <span className="text-2xl font-bold">Rp</span>
            </div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Estimasi Pendapatan Bulan Ini</p>
            <h2 className="text-4xl font-serif text-gray-900 mb-2 font-bold tracking-tight">
              Rp {stats.earningsMtd.toLocaleString('id-ID')}
            </h2>
            <p className="text-sm text-gray-500 mb-8 border-b border-gray-100 pb-8">
              Taksiran berdasarkan {stats.pending + stats.totalCompleted} jadwal aktif bulan ini
            </p>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Selesai (+Rp)</span>
              <span className="font-bold text-gray-900">{stats.totalCompleted}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-3">
              <span className="text-gray-500 font-medium">Batal (0)</span>
              <span className="font-bold text-red-500">{stats.cancelled}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
