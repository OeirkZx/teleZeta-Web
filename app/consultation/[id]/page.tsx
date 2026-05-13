// [TeleZeta] Consultation Room (Video Call / Chat)
// Menggunakan Jitsi Meet (meet.jit.si) untuk video call gratis & unlimited
'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, use, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRealtimeChat } from '@/lib/hooks/useRealtimeChat';
import type { Appointment, ChatMessage } from '@/lib/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import Avatar from '@/components/common/Avatar';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';
import { formatTimeWIB } from '@/lib/utils/formatters';
import { logError } from '@/lib/utils/logger';
import { PhoneOff, MessageSquare, Send, AlertCircle } from 'lucide-react';

// Jitsi Meet SDK harus di-load client-side saja (butuh `window` object)
const JitsiMeeting = dynamic(
  () => import('@jitsi/react-sdk').then((mod) => mod.JitsiMeeting),
  { ssr: false }
);

const JITSI_DOMAIN = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** Sanitasi nama room agar sesuai format Jitsi (alphanumeric + dash) */
function buildRoomName(appointmentId: string): string {
  return `telezeta-${appointmentId.replace(/[^a-zA-Z0-9]/g, '-')}`;
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export default function ConsultationRoom({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, profile: currentUserProfile, role } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  // ── Appointment State ──────────────────────────────────────
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Video State ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jitsiApiRef = useRef<any>(null);

  // ── Chat State ─────────────────────────────────────────────
  const { messages, sendMessage } = useRealtimeChat(id);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ────────────────────────────────────────────────────────────
  // Fetch Appointment
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    async function fetchAppointment() {
      try {
        const { data, error: fetchError } = await supabase
          .from('appointments')
          .select(`
            *,
            patient:profiles!patient_id(*),
            doctor:doctors(*, profiles(*))
          `)
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        if (!data?.patient || !data?.doctor) {
          throw new Error('Data konsultasi, dokter, atau pasien tidak ditemukan.');
        }

        // Security: hanya peserta yang boleh masuk
        if (data.patient_id !== user!.id && data.doctor_id !== user!.id) {
          throw new Error('Anda tidak memiliki akses ke ruang konsultasi ini.');
        }

        setAppointment(data as Appointment);

        // Update status ke 'ongoing' jika masih pending/confirmed
        if (['pending', 'confirmed'].includes(data.status)) {
          await supabase
            .from('appointments')
            .update({ status: 'ongoing' })
            .eq('id', id);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat detail konsultasi.';
        logError('[TeleZeta] Room Error:', err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointment();
  }, [id, user, supabase]);

  // ────────────────────────────────────────────────────────────
  // Auto-scroll Chat
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ────────────────────────────────────────────────────────────
  // Realtime: redirect kedua pihak saat konsultasi berakhir
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !role) return;

    const channel = supabase
      .channel(`consultation-end-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `id=eq.${id}`,
        },
        (payload: RealtimePostgresChangesPayload<{ id: string; status: string }>) => {
          const updated = payload.new as { id: string; status: string };
          if (updated.status === 'completed') {
            // Bersihkan Jitsi sebelum redirect
            jitsiApiRef.current?.dispose();
            jitsiApiRef.current = null;

            if (role === 'doctor') {
              router.push(`/dashboard/doctor/write-record?appointment_id=${id}`);
            } else {
              router.push('/dashboard/patient/appointments');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, role, router, supabase]);

  // ────────────────────────────────────────────────────────────
  // Handlers
  // ────────────────────────────────────────────────────────────

  const handleEndConsultation = useCallback(async () => {
    if (!confirm('Akhiri konsultasi sekarang?')) return;

    try {
      // Dispose Jitsi iframe
      jitsiApiRef.current?.dispose();
      jitsiApiRef.current = null;

      // Update status di database → trigger realtime ke pihak lain
      await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', id);

      // Dokter → tulis rekam medis, Pasien → ke daftar appointment
      if (role === 'doctor') {
        router.push(`/dashboard/doctor/write-record?appointment_id=${id}`);
      } else {
        router.push('/dashboard/patient/appointments');
      }
    } catch (err) {
      logError('[TeleZeta] Failed to end consultation:', err);
      router.push(`/dashboard/${role}`);
    }
  }, [id, role, router, supabase]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !user) return;
      sendMessage(newMessage, user.id);
      setNewMessage('');
    },
    [newMessage, user, sendMessage]
  );

  // ────────────────────────────────────────────────────────────
  // Render: Loading / Error States
  // ────────────────────────────────────────────────────────────

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-md p-8 text-center animate-popIn">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push(`/dashboard/${role}`)}
            className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  // ────────────────────────────────────────────────────────────
  // Render: Consultation Room
  // ────────────────────────────────────────────────────────────

  const isPatient = role === 'patient';
  const partnerName = isPatient
    ? appointment.doctor?.profiles?.full_name ?? 'Dokter'
    : appointment.patient?.full_name ?? 'Pasien';
  const partnerAvatar = isPatient
    ? appointment.doctor?.profiles?.avatar_url
    : appointment.patient?.avatar_url;
  const partnerRole = isPatient
    ? (appointment.doctor?.specialty ?? 'Dokter')
    : 'Pasien';

  const jitsiRoomName = buildRoomName(id);
  const displayName = currentUserProfile?.full_name ?? (isPatient ? 'Pasien' : 'Dokter');

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* ── Header ────────────────────────────────────────── */}
      <header className="h-20 px-4 md:px-8 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Avatar name={partnerName} src={partnerAvatar} size={48} pulse borderColor="#10B981" />
          <div>
            <h2 className="font-bold text-gray-900 text-lg leading-tight">{partnerName}</h2>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {partnerRole}
            </p>
          </div>
        </div>

        <button
          onClick={handleEndConsultation}
          aria-label="Akhiri konsultasi"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:bg-red-700 active:scale-95"
          style={{ background: 'var(--danger)' }}
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">Akhiri Konsultasi</span>
        </button>
      </header>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

        {/* Video Call Area — hanya ditampilkan untuk tipe video */}
        {appointment.consultation_type === 'video' && (
          <div
            className="flex-1 bg-gray-900 relative"
            style={{ minHeight: '50vh' }}
          >
            {/* Wrapper absolute agar Jitsi iframe mengisi penuh area ini */}
            <div style={{ position: 'absolute', inset: 0 }}>
              <JitsiMeeting
                domain={JITSI_DOMAIN}
                roomName={jitsiRoomName}
                userInfo={{
                  displayName,
                  email: user?.email ?? '',
                }}
                configOverwrite={{
                  startWithAudioMuted: false,
                  startWithVideoMuted: false,
                  prejoinPageEnabled: false,
                  disableDeepLinking: true,
                  disableThirdPartyRequests: true,
                  toolbarButtons: [
                    'microphone',
                    'camera',
                    'hangup',
                    'chat',
                    'tileview',
                    'fullscreen',
                  ],
                }}
                interfaceConfigOverwrite={{
                  MOBILE_APP_PROMO: false,
                  SHOW_JITSI_WATERMARK: false,
                  DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                  HIDE_INVITE_MORE_HEADER: true,
                }}
                getIFrameRef={(iframeRef) => {
                  if (!iframeRef) return;
                  // Set ukuran iframe itu sendiri
                  iframeRef.style.width = '100%';
                  iframeRef.style.height = '100%';
                  iframeRef.style.border = 'none';
                  // Set juga div wrapper yang dibuat SDK Jitsi (parent langsung)
                  // Tanpa ini iframe tidak bisa mengembang karena parent height = 0
                  const wrapper = iframeRef.parentElement;
                  if (wrapper) {
                    wrapper.style.width = '100%';
                    wrapper.style.height = '100%';
                  }
                }}
                onApiReady={(api) => {
                  jitsiApiRef.current = api;
                }}
                onReadyToClose={() => {
                  // User klik hangup dari UI Jitsi → end consultation
                  handleEndConsultation();
                }}
              />
            </div>
          </div>
        )}

        {/* ── Chat Area ─────────────────────────────────────── */}
        <div
          className={`flex flex-col bg-white border-l border-gray-200 ${
            appointment.consultation_type === 'video'
              ? 'w-full md:w-96 lg:w-[400px] h-[50vh] md:h-full shrink-0'
              : 'flex-1 w-full h-full min-h-0'
          }`}
        >
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50 shrink-0">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-gray-900">Ruang Obrolan</h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative">
            {messages.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                <p>Konsultasi aman dan terenkripsi. Silakan mulai percakapan.</p>
              </div>
            ) : (
              messages.map((msg: ChatMessage) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm md:text-base leading-relaxed break-words">
                        {msg.content}
                      </p>
                      <p
                        className={`text-[10px] mt-1.5 font-medium ${
                          isMe ? 'text-blue-200 text-right' : 'text-gray-400 text-left'
                        }`}
                      >
                        {formatTimeWIB(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-gray-200 shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Ketik pesan Anda di sini..."
                className="flex-1 px-4 py-3 rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                aria-label="Kirim pesan"
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                  newMessage.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5 translate-x-0.5" />
              </button>
            </form>
          </div>
        </div>

      </main>
    </div>
  );
}
