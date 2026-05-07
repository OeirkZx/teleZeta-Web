// [TeleZeta] Doctor Patients List
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Profile, Appointment } from '@/lib/types';
import Avatar from '@/components/common/Avatar';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { User, Search, Activity, Calendar, History, ArrowRight, Users } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';import { log, logError } from '@/lib/utils/logger';


// Helper type to group patients with their latest appointment
type PatientItem = {
  profile: Profile;
  appointmentCount: number;
  latestAppointmentDate: string;
};

export default function DoctorPatientsList() {
  const { user, authReady } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const hasFetchedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected patient for viewing basic info dialog
  const [selectedPatient, setSelectedPatient] = useState<Profile | null>(null);

  useEffect(() => {
    // Tunggu sampai auth check selesai dulu sebelum fetch
    if (!authReady || !user) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function fetchPatients() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('patient_id, scheduled_at, patient:profiles!patient_id(id, full_name, avatar_url, gender, date_of_birth)')
          .eq('doctor_id', user!.id)
          .order('scheduled_at', { ascending: false });

        if (error) throw error;
        
        const patientMap = new Map<string, PatientItem>();
        
        (data as any[]).forEach(app => {
          if (!app.patient) return;
          
          if (!patientMap.has(app.patient_id)) {
            patientMap.set(app.patient_id, {
              profile: app.patient,
              appointmentCount: 1,
              latestAppointmentDate: app.scheduled_at
            });
          } else {
            const existing = patientMap.get(app.patient_id)!;
            existing.appointmentCount += 1;
            patientMap.set(app.patient_id, existing);
          }
        });

        setPatients(Array.from(patientMap.values()));
      } catch (err) {
        logError('[TeleZeta] Failed to fetch patients:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  const filteredPatients = patients.filter(p => 
    p.profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="animate-fadeUp flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-gray-900">Daftar Pasien</h1>
          <p className="text-gray-600 mt-2">Semua pasien yang pernah berkonsultasi dengan Anda</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama pasien..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} width="100%" height={200} borderRadius={24} />)}
        </div>
      ) : filteredPatients.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeUp d1">
          {filteredPatients.map((item, idx) => (
            <div key={item.profile.id} className="card p-6 flex flex-col h-full bg-white transition-all hover:-translate-y-1 hover:shadow-lg group">
              <div className="flex items-center gap-4 mb-5">
                <Avatar
                  name={item.profile.full_name}
                  src={item.profile.avatar_url}
                  size={64}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{item.profile.full_name}</h3>
                  <p className="text-gray-500 text-sm">
                    {item.profile.gender === 'L' ? 'Laki-laki' : item.profile.gender === 'P' ? 'Perempuan' : 'Gender tidak diset'} • 
                    {item.profile.date_of_birth ? ` ${new Date().getFullYear() - new Date(item.profile.date_of_birth).getFullYear()} tahun` : ' Umur -'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Total Kunjungan</p>
                  <p className="font-bold text-gray-900 text-lg">{item.appointmentCount} <span className="text-sm font-normal text-gray-500">kali</span></p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Konsultasi Terakhir</p>
                  <p className="font-bold text-gray-900 text-sm flex items-center h-full">
                    {new Date(item.latestAppointmentDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-auto border-t border-gray-100 pt-5">
                <button
                  onClick={() => setSelectedPatient(item.profile)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Detail Pasien
                </button>
                <Link
                  href={`/dashboard/doctor/write-record?patient_id=${item.profile.id}`}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white shadow-sm flex items-center justify-center transition-transform hover:-translate-y-0.5 bg-blue-600 hover:bg-blue-700"
                >
                  Tulis Rekam
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Pasien</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Daftar pasien akan muncul di sini setelah Anda menerima dan menyelesaikan konsultasi.
          </p>
        </div>
      )}

      {/* Patient Detail Modal */}
      <Dialog.Root open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl p-0 w-[90vw] max-w-md shadow-2xl z-50 overflow-hidden outline-none animate-popIn">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 h-32 relative">
              <Dialog.Close asChild>
                <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30 transition-colors">
                  ✕
                </button>
              </Dialog.Close>
            </div>
            
            <div className="px-6 pb-6 pt-0 relative">
              <div className="-mt-16 mb-4 relative z-10 flex justify-center">
                <div className="p-1.5 bg-white rounded-full">
                  <Avatar name={selectedPatient?.full_name || 'Pasien'} src={selectedPatient?.avatar_url} size={96} />
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedPatient?.full_name}</h2>
                <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  Pasien TeleZeta
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Jenis Kelamin</p>
                    <p className="font-semibold text-gray-900">{selectedPatient?.gender === 'L' ? 'Laki-laki' : selectedPatient?.gender === 'P' ? 'Perempuan' : 'Belum diisi'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Tanggal Lahir</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPatient?.date_of_birth ? new Date(selectedPatient.date_of_birth).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum diisi'}
                      {selectedPatient?.date_of_birth && <span className="text-gray-500 font-normal ml-2">({new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear()} thn)</span>}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center pt-6 border-t border-gray-100 text-sm text-gray-500">
                Hubungi pasien melalui fitur chat di menu riwayat.
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
