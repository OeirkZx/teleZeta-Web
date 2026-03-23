import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { MOCK_APPOINTMENTS, MOCK_DOCTORS, MOCK_MEDICAL_RECORDS, MOCK_PRESCRIPTIONS } from '@/lib/types';
import StatCard from '@/components/common/StatCard';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import { ArrowRight, Video, Calendar, ClipboardList, Pill, Clock } from 'lucide-react';
import { formatTime, formatRupiah, isToday } from '@/lib/utils/formatters';

async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Return mock data if not authenticated (for demo)
    return {
      profile: { full_name: 'Pengguna Demo' },
      todayAppointment: MOCK_APPOINTMENTS[0],
      stats: { consultations: 3, records: 2, prescriptions: 1 },
      onlineDoctors: MOCK_DOCTORS.filter(d => d.is_available).slice(0, 2),
    };
  }

  try {
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Get today's appointment (upcoming)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*, doctor:doctors(*, profiles(full_name, avatar_url))')
      .eq('patient_id', user.id)
      .in('status', ['pending', 'confirmed', 'ongoing'])
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1);

    // Get stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [{ count: consultations }, { count: records }, { count: prescriptions }] = await Promise.all([
      supabase.from('appointments').select('*', { count: 'exact', head: true })
        .eq('patient_id', user.id).gte('scheduled_at', startOfMonth.toISOString()),
      supabase.from('medical_records').select('*', { count: 'exact', head: true })
        .eq('patient_id', user.id),
      supabase.from('prescriptions').select('*', { count: 'exact', head: true })
        .eq('patient_id', user.id).in('status', ['pending', 'processing', 'ready']),
    ]);

    // Get online doctors
    const { data: onlineDoctors } = await supabase
      .from('doctors')
      .select('*, profiles(full_name, avatar_url)')
      .eq('is_available', true)
      .limit(2);

    return {
      profile,
      todayAppointment: appointments?.[0] || null,
      stats: {
        consultations: consultations || 0,
        records: records || 0,
        prescriptions: prescriptions || 0,
      },
      onlineDoctors: onlineDoctors || MOCK_DOCTORS.slice(0, 2),
    };

  } catch (err) {
    console.error('[TeleZeta] Failed to fetch dashboard data:', err);
    return {
      profile: { full_name: 'Pengguna' },
      todayAppointment: null,
      stats: { consultations: 0, records: 0, prescriptions: 0 },
      onlineDoctors: [],
    };
  }
}

export default async function PatientDashboard() {
  const { profile, todayAppointment, stats, onlineDoctors } = await getDashboardData();
  const firstName = profile?.full_name?.split(' ')[0] || 'Pengguna';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="animate-fadeUp">
        <h1 className="text-3xl font-serif text-gray-900">Halo, {firstName}! 👋</h1>
        <p className="text-gray-600 mt-2 text-lg">Bagaimana kondisi kesehatan Anda hari ini?</p>
      </div>

      {/* Hero Banner - Today's Appointment */}
      {todayAppointment ? (
        <div 
          className="rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg animate-fadeUp d1"
          style={{ background: 'linear-gradient(135deg, var(--navy-primary) 0%, var(--navy-secondary) 100%)' }}
        >
          {/* Decorative blur */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/4 opacity-20 pointer-events-none" style={{ filter: 'blur(60px)' }}>
            <div className="w-64 h-64 rounded-full" style={{ background: 'var(--blue-accent)' }} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center p-3 shrink-0 border border-white/20">
                <Calendar className="w-full h-full text-blue-300" />
              </div>
              <div>
                <p className="text-blue-200 text-sm font-medium mb-1 uppercase tracking-wide">Jadwal Hari Ini</p>
                <h3 className="text-2xl font-serif mb-1">{todayAppointment.doctor?.profiles?.full_name || 'Dokter'}</h3>
                <div className="flex items-center gap-3 text-sm text-blue-100">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatTime(todayAppointment.scheduled_at)} WIB</span>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <span className="flex items-center gap-1.5">
                    {todayAppointment.consultation_type === 'video' ? <Video className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
                    {todayAppointment.consultation_type === 'video' ? 'Video Call' : 'Chat Medis'}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href={todayAppointment.status === 'confirmed' || todayAppointment.status === 'ongoing' 
                ? `/consultation/${todayAppointment.id}` 
                : `/dashboard/patient/appointments`}
              className="btn-ripple w-full md:w-auto px-6 py-3.5 rounded-xl font-bold flex items-center justify-center transition-transform hover:-translate-y-0.5"
              style={{
                background: (todayAppointment.status === 'confirmed' || todayAppointment.status === 'ongoing') ? 'var(--blue-accent)' : 'rgba(255,255,255,0.1)',
                border: (todayAppointment.status === 'confirmed' || todayAppointment.status === 'ongoing') ? 'none' : '1px solid rgba(255,255,255,0.2)',
                color: 'white',
              }}
            >
              {(todayAppointment.status === 'confirmed' || todayAppointment.status === 'ongoing') ? 'Mulai Sekarang' : 'Lihat Detail'}
              {(todayAppointment.status === 'confirmed' || todayAppointment.status === 'ongoing') && <ArrowRight className="ml-2 w-5 h-5" />}
            </Link>
          </div>
        </div>
      ) : (
        <div className="card p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 animate-fadeUp d1 bg-gradient-to-r from-blue-50 to-white border-blue-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Butuh konsultasi dokter?</h3>
            <p className="text-gray-600">Jadwalkan konsultasi dengan dokter spesialis kami sekarang.</p>
          </div>
          <Link
            href="/dashboard/patient/doctors"
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white shadow-sm flex items-center justify-center transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--blue-accent)' }}
          >
            Cari Dokter <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <StatCard 
          emoji="🩺" 
          label="Konsultasi Bulan Ini" 
          value={stats.consultations} 
          delay={2} 
        />
        <StatCard 
          emoji="📋" 
          label="Total Rekam Medis" 
          value={stats.records} 
          delay={3} 
        />
        <StatCard 
          emoji="💊" 
          label="Resep Aktif" 
          value={stats.prescriptions} 
          delay={4} 
        />
      </div>

      {/* Online Doctors */}
      <div className="animate-fadeUp d5 space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Dokter Online</h2>
          <Link href="/dashboard/patient/doctors" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
            Lihat Semua
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
          {onlineDoctors.map((doc, idx) => (
            <div key={doc.id || idx} className="card card-clickable p-5 flex gap-4 transition-all">
              <Avatar
                name={doc.profiles?.full_name || 'Dokter'}
                src={doc.profiles?.avatar_url}
                size={56}
                pulse={true}
                borderColor="#10B981"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 truncate">
                    {doc.profiles?.full_name || 'Nama Dokter'}
                  </h3>
                  <Badge status="online" />
                </div>
                <p className="text-sm text-blue-600 font-medium mb-3">{doc.specialty}</p>
                
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                  <div className="text-sm">
                    <span className="text-gray-500">Mulai dari </span>
                    <span className="font-bold text-gray-900">{formatRupiah(doc.consultation_fee)}</span>
                  </div>
                  <Link
                    href={`/dashboard/patient/doctors?selected=${doc.id}`}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Booking
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {onlineDoctors.length === 0 && (
            <div className="col-span-full card p-8 text-center text-gray-500">
              Saat ini tidak ada dokter yang sedang online.
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
