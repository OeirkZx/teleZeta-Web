// [TeleZeta] Doctor Home Dashboard
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import StatCard from '@/components/common/StatCard';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { MOCK_APPOINTMENTS } from '@/lib/types';
import { formatTimeWIB } from '@/lib/utils/formatters';
import { ArrowRight, Video, Calendar, Clock, Activity, Users, FileText, Settings, MessageSquare, Power, AlertCircle } from 'lucide-react';import { log, logError } from '@/lib/utils/logger';


export default function DoctorDashboard() {
  const { user, profile, authReady } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [doctorData, setDoctorData] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_patients: 0, pending_appointments: 0, completed_today: 0 });
  const hasFetchedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Tunggu sampai auth check selesai dulu sebelum fetch
    if (!authReady || !user) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function fetchData() {
      setLoading(true);
      try {
        // Parallel: fetch doctor profile, today's appointments, and monthly patient count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [doctorRes, appsRes, uniquePatientsRes] = await Promise.all([
          // 1. Doctor availability status
          supabase
            .from('doctors')
            .select('is_available')
            .eq('id', user!.id)
            .single(),

          // 2. Today's appointments with patient info
          supabase
            .from('appointments')
            .select('id, scheduled_at, status, consultation_type, chief_complaint, patient:profiles!patient_id(full_name, avatar_url)')
            .eq('doctor_id', user!.id)
            .gte('scheduled_at', today.toISOString())
            .lt('scheduled_at', tomorrow.toISOString())
            .order('scheduled_at', { ascending: true }),

          // 3. Unique patients this month — only need patient_id
          supabase
            .from('appointments')
            .select('patient_id')
            .eq('doctor_id', user!.id)
            .gte('scheduled_at', startOfMonth.toISOString()),
        ]);

        setDoctorData(doctorRes.data);

        const apps = appsRes.data || [];
        setAppointments(apps);

        // Stats from results already in memory
        const pending = apps.filter((a: any) => a.status === 'pending' || a.status === 'confirmed').length;
        const completed = apps.filter((a: any) => a.status === 'completed').length;
        const uniqueCount = new Set((uniquePatientsRes.data || []).map(p => p.patient_id)).size;

        setStats({
          total_patients: uniqueCount,
          pending_appointments: pending,
          completed_today: completed,
        });

      } catch (err) {
        logError('[TeleZeta] Failed to fetch doctor dashboard:', err);
        setErrorMsg('Gagal memuat data dashboard. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  const toggleAvailability = async () => {
    if (!user || !doctorData || updatingStatus) return;
    setUpdatingStatus(true);
    
    const newStatus = !doctorData.is_available;
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_available: newStatus })
        .eq('id', user.id);
        
      if (error) throw error;
      setDoctorData({ ...doctorData, is_available: newStatus });
    } catch (err) {
      logError('[TeleZeta] Failed to update availability:', err);
      alert('Gagal memperbarui status ketersediaan.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const nextAppointment = appointments.find(a => ['confirmed', 'ongoing'].includes(a.status));

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton width="100%" height={200} borderRadius={24} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton height={140} borderRadius={24} />
          <Skeleton height={140} borderRadius={24} />
          <Skeleton height={140} borderRadius={24} />
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
      
      {/* Header with Availability Toggle */}
      <div className="animate-fadeUp flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-serif text-gray-900">Halo, {profile?.full_name || 'Dokter'}! 👋</h1>
          <p className="text-gray-600 mt-2 text-lg">Ringkasan aktivitas praktik Anda hari ini.</p>
        </div>

        <div className="bg-white p-2 pl-4 rounded-full shadow-sm border border-gray-200 flex items-center gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Status Praktik</p>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${doctorData?.is_available ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className={`text-sm font-bold ${doctorData?.is_available ? 'text-green-700' : 'text-gray-600'}`}>
                {doctorData?.is_available ? 'Online (Menerima Pasien)' : 'Sedang Offline'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={updatingStatus}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              updatingStatus ? 'opacity-50 cursor-not-allowed text-gray-400 bg-gray-100' : 
              doctorData?.is_available ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            <Power className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Banner - Next Appointment */}
      {nextAppointment ? (
        <div 
          className="rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg animate-fadeUp d1"
          style={{ background: 'linear-gradient(135deg, var(--green-primary, #047857) 0%, var(--green-secondary, #10B981) 100%)' }}
        >
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/4 opacity-20 pointer-events-none" style={{ filter: 'blur(60px)' }}>
            <div className="w-64 h-64 rounded-full bg-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex gap-4 items-center">
              <Avatar
                name={nextAppointment.patient?.full_name}
                src={nextAppointment.patient?.avatar_url}
                size={72}
                borderColor="rgba(255,255,255,0.4)"
              />
              <div>
                <p className="text-green-100 text-sm font-medium mb-1 uppercase tracking-wide">Konsultasi Berikutnya</p>
                <h3 className="text-2xl font-bold mb-1">{nextAppointment.patient?.full_name}</h3>
                <div className="flex items-center gap-3 text-sm font-medium text-white/90">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatTimeWIB(nextAppointment.scheduled_at)} WIB</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  <span className="flex items-center gap-1.5">
                    {nextAppointment.consultation_type === 'video' ? <Video className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    {nextAppointment.consultation_type === 'video' ? 'Video Call' : 'Chat Medis'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/dashboard/doctor/write-record?appointment_id=${nextAppointment.id}`}
                className="px-6 py-3 rounded-xl font-bold flex items-center justify-center transition-colors bg-white/10 text-white hover:bg-white/20 border border-white/20"
              >
                Lihat Rekam Medis
              </Link>
              <button
                onClick={() => {
                  const appointmentId = nextAppointment?.id;
                  if (!appointmentId) {
                    logError('[TeleZeta] nextAppointment.id is undefined:', nextAppointment);
                    return;
                  }
                  router.push(`/consultation/${appointmentId}`);
                }}
                className="px-6 py-3 rounded-xl font-bold text-green-700 bg-white hover:bg-gray-50 flex items-center justify-center transition-transform hover:-translate-y-0.5 shadow-sm btn-ripple"
              >
                Mulai Konsultasi <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 animate-fadeUp d1 bg-gradient-to-r from-gray-50 to-white border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shrink-0">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Tidak ada jadwal saat ini</h3>
              <p className="text-gray-600">Anda dapat bersantai atau memeriksa daftar rincian pasien Anda.</p>
            </div>
          </div>
          <Link
            href="/dashboard/doctor/schedule"
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            Lihat Semua Jadwal
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <StatCard 
          emoji="👥" 
          label="Pasien Unik (Bulan Ini)" 
          value={stats.total_patients} 
          delay={2} 
        />
        <StatCard 
          emoji="🕒" 
          label="Konsultasi Menunggu" 
          value={stats.pending_appointments} 
          delay={3} 
        />
        <StatCard 
          emoji="✅" 
          label="Selesai Hari Ini" 
          value={stats.completed_today} 
          delay={4} 
        />
      </div>

      {/* Today's Schedule List Overview */}
      <div className="animate-fadeUp d5 space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Jadwal Hari Ini ({appointments.length})</h2>
          <Link href="/dashboard/doctor/schedule" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
            Kelola Jadwal
          </Link>
        </div>
        
        {appointments.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {appointments.slice(0, 5).map((app) => (
                <div key={app.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-center w-16 shrink-0 border-r border-gray-100 pr-4">
                      <p className="text-xs text-gray-500 font-semibold uppercase">Pukul</p>
                      <p className="text-lg font-bold text-gray-900">{formatTimeWIB(app.scheduled_at)}</p>
                    </div>
                    <Avatar
                      name={app.patient?.full_name}
                      src={app.patient?.avatar_url}
                      size={44}
                    />
                    <div>
                      <h3 className="font-bold text-gray-900">{app.patient?.full_name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          {app.consultation_type === 'video' ? <Video className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                          {app.consultation_type === 'video' ? 'Video' : 'Chat'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <Badge status={app.status as any} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pl-20 sm:pl-0 flex items-center gap-2">
                    {app.status === 'pending' ? (
                      <Link
                        href="/dashboard/doctor/schedule"
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        Konfirmasi
                      </Link>
                    ) : (app.status === 'confirmed' || app.status === 'ongoing') ? (
                      <button
                        onClick={() => {
                          const appointmentId = app?.id;
                          if (!appointmentId) {
                            logError('[TeleZeta] app.id is undefined:', app);
                            return;
                          }
                          router.push(`/consultation/${appointmentId}`);
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-500 text-white hover:bg-green-600 transition-transform hover:-translate-y-0.5"
                      >
                        Mulai
                      </button>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">Selesai</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center text-gray-500 border-dashed border-2">
            Belum ada jadwal konsultasi untuk hari ini.
          </div>
        )}
      </div>

    </div>
  );
}
