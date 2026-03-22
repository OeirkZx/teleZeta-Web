// [TeleZeta] Doctor Schedule Management
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Appointment, Profile } from '@/lib/types';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { formatTime } from '@/lib/utils/formatters';
import { Calendar, Clock, Video, MessageSquare, ArrowRight, Check, X } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';

type AppointmentWithPatient = Appointment & { 
  patient: Profile 
};

export default function DoctorSchedule() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppointments() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('id, scheduled_at, status, consultation_type, chief_complaint, patient:profiles!patient_id(full_name, avatar_url, gender, date_of_birth)')
          .eq('doctor_id', user.id)
          .order('scheduled_at', { ascending: true }); // Earliest first for doctor

        if (error) throw error;
        setAppointments((data || []) as any[]);
      } catch (err) {
        console.error('[TeleZeta] Failed to fetch schedule:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, [user, supabase]);

  const handleUpdateStatus = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
    if (!confirm(`Apakah Anda yakin ingin ${newStatus === 'confirmed' ? 'menerima' : 'menolak'} jadwal ini?`)) return;
    
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      setAppointments(prev => prev.map(app => 
        app.id === id ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      console.error('[TeleZeta] Failed to update appointment:', err);
      alert('Gagal memperbarui status. Silakan coba lagi.');
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingApps = appointments.filter(a => a.status === 'pending');
  const upcomingApps = appointments.filter(a => ['confirmed', 'ongoing'].includes(a.status));
  const pastApps = appointments.filter(a => ['completed', 'cancelled'].includes(a.status));

  const AppointmentCard = ({ app }: { app: AppointmentWithPatient }) => {
    const isPending = app.status === 'pending';
    const isConfirmed = app.status === 'confirmed' || app.status === 'ongoing';
    const date = new Date(app.scheduled_at);
    
    return (
      <div className={`card p-5 md:p-6 mb-4 animate-fadeUp ${isPending ? 'border-2 border-orange-200 bg-orange-50/30' : ''}`}>
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          {/* Time & Status Column */}
          <div className="flex flex-row md:flex-col justify-between items-center md:items-start gap-4 md:w-48 shrink-0 pb-4 md:pb-0 border-b md:border-b-0 md:border-r border-gray-100 pr-0 md:pr-6">
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Jadwal</p>
              <p className="font-bold text-gray-900">{date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <div className="flex items-center gap-1.5 text-blue-600 font-medium mt-1">
                <Clock className="w-4 h-4" />
                {formatTime(app.scheduled_at)} WIB
              </div>
            </div>
            <Badge status={app.status as any} />
          </div>

          {/* Patient Info */}
          <div className="flex-1 min-w-0 flex gap-4">
            <Avatar
              name={app.patient?.full_name}
              src={app.patient?.avatar_url}
              size={56}
            />
            <div>
              <p className="text-xs text-blue-500 font-semibold tracking-wide uppercase mb-1">
                {app.consultation_type === 'video' ? 'Video Call' : 'Chat Medis'}
              </p>
              <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{app.patient?.full_name}</h3>
              <p className="text-gray-500 text-sm mb-2">{app.patient?.gender === 'L' ? 'Laki-laki' : app.patient?.gender === 'P' ? 'Perempuan' : 'Belum diisi'} • {app.patient?.date_of_birth ? `${new Date().getFullYear() - new Date(app.patient.date_of_birth).getFullYear()} tahun` : '-'}</p>
              
              <div className="bg-white/80 rounded-lg p-3 text-sm text-gray-700 border border-gray-100 shadow-sm mt-3">
                <p className="font-medium text-gray-900 mb-1">Keluhan Utama:</p>
                <p className="line-clamp-2 md:line-clamp-none">{app.chief_complaint || 'Tidak ada keluhan disertakan.'}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-stretch justify-center gap-3 mt-4 md:mt-0 w-full md:w-auto shrink-0 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0 pl-0 md:pl-2">
            {isPending ? (
              <>
                <button
                  onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                  disabled={updatingId === app.id}
                  className="w-full md:w-36 px-4 py-2.5 rounded-xl font-bold text-white shadow-sm flex items-center justify-center transition-transform hover:-translate-y-0.5 text-sm btn-ripple bg-green-500 hover:bg-green-600"
                >
                  {updatingId === app.id ? 'Memproses...' : <><Check className="w-4 h-4 mr-1.5" /> Terima</>}
                </button>
                <button
                  onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                  disabled={updatingId === app.id}
                  className="w-full md:w-36 px-4 py-2.5 rounded-xl font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center text-sm"
                >
                  <X className="w-4 h-4 mr-1.5" /> Tolak
                </button>
              </>
            ) : isConfirmed ? (
              <button
                onClick={() => {
                  const appointmentId = app?.id;
                  if (!appointmentId) {
                    console.error('[TeleZeta] app.id is undefined:', app);
                    return;
                  }
                  router.push(`/consultation/${appointmentId}`);
                }}
                className="w-full md:w-40 px-4 py-3 rounded-xl font-bold flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5 shadow-sm btn-ripple text-sm text-center text-white"
                style={{ background: 'var(--blue-accent)' }}
              >
                <ArrowRight className="w-5 h-5 mb-1" />
                Mulai Konsultasi
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-20">
      <div className="animate-fadeUp flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-gray-900">Jadwal Praktik</h1>
          <p className="text-gray-600 mt-2">Kelola permintaan konsultasi dan jadwal Anda</p>
        </div>
      </div>

      <Tabs.Root defaultValue="requests" className="animate-fadeUp d1">
        <Tabs.List className="flex gap-2 p-1 bg-gray-100 rounded-xl w-full md:w-max mb-6 overflow-x-auto hide-scrollbar">
          <Tabs.Trigger
            value="requests"
            className="shrink-0 flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-900"
          >
            Permintaan Baru {pendingApps.length > 0 && <span className="ml-1.5 bg-orange-100 text-orange-600 py-0.5 px-2 rounded-full text-xs">{pendingApps.length}</span>}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="upcoming"
            className="shrink-0 flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-900"
          >
            Jadwal Mendatang ({upcomingApps.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="past"
            className="shrink-0 flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-900"
          >
            Selesai / Batal
          </Tabs.Trigger>
        </Tabs.List>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} width="100%" height={160} borderRadius={16} />)}
          </div>
        ) : (
          <>
            <Tabs.Content value="requests" className="outline-none">
              {pendingApps.length > 0 ? (
                <div className="space-y-4">
                  {pendingApps.map((app, i) => (
                    <div key={app.id} style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }} className="animate-fadeUp opacity-0">
                      <AppointmentCard app={app} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Semua Permintaan Tertangani</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">Tidak ada permintaan konsultasi yang menunggu konfirmasi saat ini.</p>
                </div>
              )}
            </Tabs.Content>

            <Tabs.Content value="upcoming" className="outline-none">
              {upcomingApps.length > 0 ? (
                <div className="space-y-4">
                  {upcomingApps.map((app, i) => (
                    <div key={app.id} style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }} className="animate-fadeUp opacity-0">
                      <AppointmentCard app={app} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Jadwal Kosong</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">Tidak ada jadwal konsultasi mendatang. Pastikan status Praktik Anda dalam keadaan Online.</p>
                </div>
              )}
            </Tabs.Content>

            <Tabs.Content value="past" className="outline-none">
              <div className="space-y-4 opacity-75">
                {pastApps.slice(0, 10).map((app, i) => ( // only show recent 10
                  <div key={app.id} style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }} className="animate-fadeUp opacity-0">
                    <AppointmentCard app={app} />
                  </div>
                ))}
                {pastApps.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                    <p className="text-gray-500">Belum ada riwayat.</p>
                  </div>
                )}
              </div>
            </Tabs.Content>
          </>
        )}
      </Tabs.Root>
    </div>
  );
}
