// [TeleZeta] Consultation Room (Video Call / Chat)
'use client';

import { useState, useEffect, useRef, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRealtimeChat } from '@/lib/hooks/useRealtimeChat';
import type { Appointment, ChatMessage } from '@/lib/types';
import Avatar from '@/components/common/Avatar';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';
import { formatTimeWIB } from '@/lib/utils/formatters';
import { PhoneOff, Video as VideoIcon, Mic, MicOff, VideoOff, MessageSquare, Send, X, AlertCircle } from 'lucide-react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';import { log, logError } from '@/lib/utils/logger';


// Setup Daily.co room URL dynamically or use environment variable
// For production, you should create rooms via API. For this demo, we'll use a static room or one from env.
const DAILY_ROOM_URL = process.env.NEXT_PUBLIC_DAILY_URL || 'https://telezeta.daily.co/demo-room';

export default function ConsultationRoom({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, profile: currentUserProfile, role } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Video Call State
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Chat State
  const { messages, sendMessage } = useRealtimeChat(id);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Appointment
  useEffect(() => {
    async function fetchAppointment() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            patient:profiles!patient_id(*),
            doctor:doctors(*, profiles(*))
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        
        if (!data || !data.patient || !data.doctor) {
          throw new Error('Data konsultasi, dokter, atau pasien tidak ditemukan.');
        }

        // Basic Security Check
        if (data.patient_id !== user.id && data.doctor_id !== user.id) {
          throw new Error('Anda tidak memiliki akses ke ruang konsultasi ini.');
        }

        setAppointment(data);
        
        // Update status to 'ongoing' if it was pending or confirmed
        if (['pending', 'confirmed'].includes(data.status)) {
          await supabase
            .from('appointments')
            .update({ status: 'ongoing' })
            .eq('id', id);
        }

      } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
        logError('[TeleZeta] Room Error:', err);
        setError(err.message || 'Gagal memuat detail konsultasi.');
      } finally {
        setLoading(false);
      }
    }
    fetchAppointment();
  }, [id, user, supabase]);

  // Setup Daily.co
  useEffect(() => {
    if (!appointment || appointment.consultation_type !== 'video' || !videoContainerRef.current || callRef.current) return;

    const initCall = async () => {
      const co = DailyIframe.createFrame(videoContainerRef.current!, {
        showLeaveButton: false,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '16px',
          backgroundColor: '#0B1F3A',
        },
      });

      callRef.current = co;

      try {
        const roomUrl = appointment.daily_room_url || DAILY_ROOM_URL;
        await co.join({ 
          url: roomUrl,
          userName: currentUserProfile?.full_name || 'User',
        });
        setIsJoined(true);
      } catch (e) {
        logError('[TeleZeta] Failed to join Daily call:', e);
      }
    };

    initCall();

    return () => {
      if (callRef.current) {
        callRef.current.leave()
          .then(() => callRef.current?.destroy())
          .catch(() => {});
        callRef.current = null;
      }
    };
  }, [appointment, currentUserProfile]);

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime: redirect the OTHER party when someone ends the consultation
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
        async (payload: any) => {
          const updated = payload.new as { id: string; status: string };
          if (updated.status === 'completed') {
            // Leave any active video call
            if (callRef.current) {
              try { await callRef.current.leave(); } catch (_) {}
              callRef.current = null;
            }
            // Redirect based on role
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

  const handleEndConsultation = async () => {
    if (!confirm('Akhiri konsultasi sekarang?')) return;
    
    try {
      if (callRef.current) {
        await callRef.current.leave();
        callRef.current = null;
      }

      await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', id);

      if (role === 'doctor') {
        // Rediect doctor to write medical record
        router.push(`/dashboard/doctor/write-record?appointment_id=${id}`);
      } else {
        // Redirect patient back to appointments
        router.push('/dashboard/patient/appointments');
      }
    } catch (err) {
      logError('[TeleZeta] Failed to end consultation:', err);
      // Fallback redirect anyway
      router.push(`/dashboard/${role}`);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    sendMessage(newMessage, user.id);
    setNewMessage('');
  };

  const toggleMic = () => {
    if (callRef.current) {
      callRef.current.setLocalAudio(!micOn);
      setMicOn(!micOn);
    }
  };

  const toggleCam = () => {
    if (callRef.current) {
      callRef.current.setLocalVideo(!camOn);
      setCamOn(!camOn);
    }
  };

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

  // Determine partner details
  const isPatient = role === 'patient';
  const partnerName = isPatient ? appointment.doctor.profiles.full_name : appointment.patient.full_name;
  const partnerAvatar = isPatient ? appointment.doctor.profiles.avatar_url : appointment.patient.avatar_url;
  const partnerRole = isPatient ? appointment.doctor.specialty : 'Pasien';

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      
      {/* Consultation Header */}
      <header className="h-20 px-4 md:px-8 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Avatar name={partnerName} src={partnerAvatar} size={48} pulse={true} borderColor="#10B981" />
          <div>
            <h2 className="font-bold text-gray-900 text-lg leading-tight">{partnerName}</h2>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" /> {partnerRole}
            </p>
          </div>
        </div>

        <button
          onClick={handleEndConsultation}
          aria-label="Akhiri konsultasi"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:bg-red-700 active:scale-95"
          style={{ background: 'var(--danger)' }}
        >
          <PhoneOff className="w-4 h-4" /> <span className="hidden sm:inline">Akhiri Konsultasi</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Video Call Area */}
        {appointment.consultation_type === 'video' && (
          <div className="flex-1 p-4 md:p-6 bg-gray-900 relative flex flex-col justify-between" style={{ minHeight: '50vh' }}>
            <div 
              ref={videoContainerRef} 
              className="w-full h-full rounded-2xl overflow-hidden shadow-2xl relative z-0"
            />
            
            {/* Custom Video Controls overlay (bottom center) */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-gray-700 z-10 animate-slideUp">
              <button 
                onClick={toggleMic}
                aria-label={micOn ? "Matikan mikrofon" : "Nyalakan mikrofon"}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  micOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={toggleCam}
                aria-label={camOn ? "Matikan kamera" : "Nyalakan kamera"}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  camOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className={`flex flex-col bg-white border-l border-gray-200 ${
          appointment.consultation_type === 'video' ? 'w-full md:w-96 lg:w-[400px] h-[50vh] md:h-full block shrink-0' : 'flex-1 w-full h-full min-h-0'
        }`}>
          
          <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50 shrink-0">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-gray-900">Ruang Obrolan</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative">
            {messages.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                <p>Konsultasi aman dan terenkripsi. Silakan mulai percakapan.</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.sender_id === user?.id;
                
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm relative ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-br-sm' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                    }`}>
                      <p className="text-sm md:text-base leading-relaxed break-words">{msg.content}</p>
                      <p className={`text-[10px] mt-1.5 font-medium ${isMe ? 'text-blue-200 text-right' : 'text-gray-400 text-left'}`}>
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
