// [TeleZeta] Badge Component
// Status badge dengan dot indicator berwarna
'use client';

interface BadgeProps {
  status: string;
  className?: string;
}

// Konfigurasi warna badge berdasarkan status
const BADGE_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  // Availability
  online: { bg: '#DCFCE7', text: '#166534', dot: '#22C55E', label: 'Online' },
  offline: { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF', label: 'Offline' },
  busy: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Sibuk' },

  // Appointment status
  pending: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Menunggu' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6', label: 'Dikonfirmasi' },
  ongoing: { bg: '#E0E7FF', text: '#3730A3', dot: '#6366F1', label: 'Berlangsung' },
  completed: { bg: '#DCFCE7', text: '#166534', dot: '#22C55E', label: 'Selesai' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', label: 'Dibatalkan' },

  // Prescription status
  processing: { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6', label: 'Diproses' },
  ready: { bg: '#DCFCE7', text: '#166534', dot: '#22C55E', label: 'Siap' },
  dispensed: { bg: '#F3F4F6', text: '#374151', dot: '#6B7280', label: 'Diserahkan' },

  // Priority
  urgent: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', label: 'Urgent' },
  critical: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', label: 'Kritis' },

  // Consultation type
  video: { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6', label: 'Video Call' },
  chat: { bg: '#E0E7FF', text: '#3730A3', dot: '#6366F1', label: 'Chat' },
};

export default function Badge({ status, className = '' }: BadgeProps) {
  const config = BADGE_CONFIG[status] || {
    bg: '#F3F4F6',
    text: '#374151',
    dot: '#6B7280',
    label: status,
  };

  return (
    <span
      className={`badge ${className}`}
      style={{
        background: config.bg,
        color: config.text,
      }}
    >
      <span className="badge-dot" style={{ background: config.dot }} />
      {config.label}
    </span>
  );
}
