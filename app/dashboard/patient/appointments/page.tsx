// [TeleZeta] Patient Appointments Page
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { MOCK_APPOINTMENTS } from '@/lib/types';
import type { Appointment, Doctor, Profile } from '@/lib/types';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { formatTime } from '@/lib/utils/formatters';
import { Calendar, Clock, Video, MessageSquare, ArrowRight, XCircle, FileText, Share2 } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';

type AppointmentWithDoctor = Appointment & { 
  doctor: Doctor & { profiles: Profile } 
};

export default function PatientAppointments() {
  const { user } = useAuth();
  const supabase = createClient();
  
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppointments() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*, doctor:doctors(*, profiles(*))')
          .eq('patient_id', user.id)
          .order('scheduled_at', { ascending: false });

        if (error) throw error;
        setAppointments((data || []) as unknown as AppointmentWithDoctor[]);
        
      } catch (err) {
        console.error('[TeleZeta] Failed to fetch appointments:', err);
        // Use Mock data for UI preview if failed
        setAppointments(MOCK_APPOINTMENTS as unknown as AppointmentWithDoctor[]);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [user, supabase]);

  const handleCancel = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan jadwal ini?')) return;
    
    setCancelingId(id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setAppointments(prev => prev.map(app => 
        app.id === id ? { ...app, status: 'cancelled' } : app
      ));
    } catch (err) {
      console.error('[TeleZeta] Failed to cancel appointment:', err);
      alert('Gagal membatalkan jadwal. Silakan coba lagi.');
    } finally {
      setCancelingId(null);
    }
  };

  const isPast = (dateStr: string) => new Date(dateStr) < new Date();

  // Split appointments
  const upcomingApps = appointments.filter(a => ['pending', 'confirmed', 'ongoing'].includes(a.status));
  const pastApps = appointments.filter(a => ['completed', 'cancelled'].includes(a.status));

  const AppointmentCard = ({ app }: { app: AppointmentWithDoctor }) => {
    const isUpcoming = ['pending', 'confirmed', 'ongoing'].includes(app.status);
    const date = new Date(app.scheduled_at);
    
    return (
      <div className="card p-5 md:p-6 mb-4 animate-fadeUp">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          {/* Status and Time on Mobile right, Desktop left */}
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

          {/* Doctor Info */}
          <div className="flex-1 min-w-0 flex gap-4">
            <Avatar
              name={app.doctor?.profiles?.full_name || 'Dokter'}
              src={app.doctor?.profiles?.avatar_url}
              size={56}
            />
            <div>
              <p className="text-xs text-blue-500 font-semibold tracking-wide uppercase mb-1">
                {app.consultation_type === 'video' ? 'Video Call' : 'Chat Medis'}
              </p>
              <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{app.doctor?.profiles?.full_name}</h3>
              <p className="text-gray-600 text-sm mb-2">{app.doctor?.specialty}</p>
              
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <p className="font-medium text-gray-900 mb-1">Keluhan:</p>
                <p className="line-clamp-2">{app.chief_complaint || '-'}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-row md:flex-col items-center justify-end gap-3 mt-4 md:mt-0 shrink-0 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
            {(app.status === 'confirmed' || app.status === 'ongoing') ? (
              <Link
                href={`/consultation/${app.id}`}
                className="w-full md:w-auto px-6 py-2.5 rounded-xl font-bold text-white shadow-sm flex items-center justify-center transition-transform hover:-translate-y-0.5 btn-ripple text-sm"
                style={{ background: 'var(--blue-accent)' }}
              >
                Mulai {app.consultation_type === 'video' ? 'Video' : 'Chat'} <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            ) : app.status === 'pending' ? (
              <button
                onClick={() => handleCancel(app.id)}
                disabled={cancelingId === app.id}
                className="w-full md:w-auto px-6 py-2.5 rounded-xl font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center text-sm disabled:opacity-50"
              >
                {cancelingId === app.id ? 'Membatalkan...' : 'Batalkan'}
              </button>
            ) : app.status === 'completed' ? (
              <>
                <Link
                  href={`/dashboard/patient/records?id=${app.id}`}
                  className="w-full md:w-auto px-5 py-2.5 rounded-xl font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center text-sm"
                >
                  <FileText className="w-4 h-4 mr-2" /> Rekam Medis
                </Link>
                <button
                  className="w-full md:w-auto px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center text-sm"
                >
                  Beri Ulasan
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-20">
      <div className="animate-fadeUp mb-8">
        <h1 className="text-3xl font-serif text-gray-900">Jadwal Konsultasi</h1>
        <p className="text-gray-600 mt-2">Kelola jadwal konsultasi Anda dengan dokter</p>
      </div>

      <Tabs.Root defaultValue="upcoming" className="animate-fadeUp d1">
        <Tabs.List className="flex gap-2 p-1 bg-gray-100 rounded-xl w-full md:w-max mb-6">
          <Tabs.Trigger
            value="upcoming"
            className="flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-900"
          >
            Akan Datang ({upcomingApps.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="past"
            className="flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-900"
          >
            Riwayat ({pastApps.length})
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="upcoming" className="outline-none">
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} width="100%" height={160} borderRadius={16} />)}
            </div>
          ) : upcomingApps.length > 0 ? (
            <div className="space-y-4">
              {upcomingApps.map((app, i) => (
                <div key={app.id} style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }} className="animate-fadeUp opacity-0">
                  <AppointmentCard app={app} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Belum Ada Jadwal</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">Anda belum memiliki jadwal konsultasi dokter dalam waktu dekat.</p>
              <Link
                href="/dashboard/patient/doctors"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white transition-transform hover:-translate-y-0.5"
                style={{ background: 'var(--blue-accent)' }}
              >
                Cari Dokter Sekarang
              </Link>
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="past" className="outline-none">
          {loading ? (
            <div className="space-y-4">
              {[1,2].map(i => <Skeleton key={i} width="100%" height={160} borderRadius={16} />)}
            </div>
          ) : pastApps.length > 0 ? (
            <div className="space-y-4">
              {pastApps.map((app, i) => (
                <div key={app.id} style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }} className="animate-fadeUp opacity-0">
                  <AppointmentCard app={app} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Riwayat Kosong</h3>
              <p className="text-gray-500">Anda belum memiliki riwayat konsultasi yang telah selesai atau dibatalkan.</p>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>

    </div>
  );
}
