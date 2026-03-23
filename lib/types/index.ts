// [TeleZeta] TypeScript Types & Interfaces
// Mendefinisikan semua tipe data yang digunakan di seluruh aplikasi

export type UserRole = 'patient' | 'doctor' | 'pharmacist';
export type Gender = 'L' | 'P';
export type ConsultationType = 'video' | 'chat';
export type AppointmentStatus = 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
export type PrescriptionStatus = 'pending' | 'processing' | 'ready' | 'dispensed';

// ============================================================
// Database Entity Types
// ============================================================

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  avatar_url?: string | null;
  date_of_birth?: string;
  gender?: Gender;
  city?: string;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  specialty: string;
  sip_number?: string;
  str_number?: string;
  hospital?: string;
  bio?: string;
  consultation_fee: number;
  rating: number;
  total_reviews: number;
  experience_years: number;
  is_available: boolean;
  available_days: string[];
  available_hours: { start: string; end: string };
  // Joined fields
  profiles?: Profile;
}

export interface Pharmacist {
  id: string;
  sipa_number?: string;
  pharmacy_name?: string;
  pharmacy_address?: string;
  is_active: boolean;
  // Joined fields
  profiles?: Profile;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  consultation_type: ConsultationType;
  status: AppointmentStatus;
  chief_complaint?: string;
  daily_room_name?: string;
  daily_room_url?: string;
  consultation_fee: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  doctor?: Doctor & { profiles?: Profile };
  patient?: Profile;
}

export interface ChatMessage {
  id: string;
  appointment_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  // Joined fields
  sender?: Profile;
}

// Alias for backward compatibility
export type Message = ChatMessage;

export interface MedicalRecord {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis: string;
  notes?: string;
  follow_up_date?: string;
  created_at: string;
  // Joined fields
  doctor?: Doctor & { profiles?: Profile };
  patient?: Profile;
  prescriptions?: Prescription[];
  appointment?: Appointment;
}

export interface Prescription {
  id: string;
  medical_record_id: string;
  patient_id: string;
  doctor_id: string;
  pharmacist_id?: string;
  status: PrescriptionStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  prescription_items?: PrescriptionItem[];
  doctor?: Doctor & { profiles?: Profile };
  patient?: Profile;
  medical_record?: MedicalRecord;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  quantity: number;
  refills: number;
  instructions?: string;
}

export interface Review {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  // Joined fields
  patient?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  target_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  pharmacist_id: string;
  medicine_name: string;
  category?: string;
  stock_quantity: number;
  minimum_stock: number;
  unit: string;
  price_per_unit: number;
  updated_at: string;
}

// ============================================================
// UI-specific Types
// ============================================================

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export interface StatCardData {
  emoji: string;
  label: string;
  value: string | number;
}

// ============================================================
// Mock Data — Fallback saat Supabase belum dikonfigurasi
// ============================================================

export const MOCK_DOCTORS: (Doctor & { profiles: Profile })[] = [
  {
    id: 'doc-1',
    specialty: 'Penyakit Dalam',
    sip_number: 'SIP-001/JKT/2023',
    str_number: 'STR-00123',
    hospital: 'RS Cipto Mangunkusumo',
    bio: 'Dokter spesialis penyakit dalam dengan pengalaman lebih dari 10 tahun di rumah sakit terkemuka.',
    consultation_fee: 75000,
    rating: 4.8,
    total_reviews: 124,
    experience_years: 12,
    is_available: true,
    available_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    available_hours: { start: '08:00', end: '17:00' },
    profiles: {
      id: 'doc-1',
      role: 'doctor',
      full_name: 'dr. Ahmad Fadillah, Sp.PD',
      phone: '08123456789',
      avatar_url: null,
      gender: 'L',
      city: 'Jakarta',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'doc-2',
    specialty: 'Kardiologi',
    sip_number: 'SIP-002/JKT/2023',
    str_number: 'STR-00234',
    hospital: 'RS Jantung Harapan Kita',
    bio: 'Spesialis jantung dan pembuluh darah berpengalaman menangani berbagai kasus kardiovaskular.',
    consultation_fee: 100000,
    rating: 4.9,
    total_reviews: 89,
    experience_years: 15,
    is_available: true,
    available_days: ['Senin', 'Rabu', 'Jumat'],
    available_hours: { start: '09:00', end: '16:00' },
    profiles: {
      id: 'doc-2',
      role: 'doctor',
      full_name: 'dr. Siti Rahayu, Sp.JP',
      phone: '08234567890',
      avatar_url: null,
      gender: 'P',
      city: 'Jakarta',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'doc-3',
    specialty: 'Pediatri',
    sip_number: 'SIP-003/BDG/2023',
    str_number: 'STR-00345',
    hospital: 'RS Hasan Sadikin',
    bio: 'Dokter anak yang berdedikasi untuk kesehatan anak-anak Indonesia.',
    consultation_fee: 85000,
    rating: 4.7,
    total_reviews: 156,
    experience_years: 8,
    is_available: true,
    available_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    available_hours: { start: '08:00', end: '15:00' },
    profiles: {
      id: 'doc-3',
      role: 'doctor',
      full_name: 'dr. Budi Santoso, Sp.A',
      phone: '08345678901',
      avatar_url: null,
      gender: 'L',
      city: 'Bandung',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'doc-4',
    specialty: 'Kulit & Kelamin',
    sip_number: 'SIP-004/SBY/2023',
    str_number: 'STR-00456',
    hospital: 'RS Dr. Soetomo',
    bio: 'Ahli dermatologi yang berpengalaman dalam masalah kulit dan estetika.',
    consultation_fee: 90000,
    rating: 4.6,
    total_reviews: 78,
    experience_years: 10,
    is_available: false,
    available_days: ['Selasa', 'Kamis'],
    available_hours: { start: '10:00', end: '16:00' },
    profiles: {
      id: 'doc-4',
      role: 'doctor',
      full_name: 'dr. Diana Putri, Sp.KK',
      phone: '08456789012',
      avatar_url: null,
      gender: 'P',
      city: 'Surabaya',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'doc-5',
    specialty: 'Kebidanan',
    sip_number: 'SIP-005/JKT/2023',
    str_number: 'STR-00567',
    hospital: 'RS Bunda Menteng',
    bio: 'Spesialis kebidanan dan kandungan berpengalaman dalam kehamilan risiko tinggi.',
    consultation_fee: 95000,
    rating: 4.8,
    total_reviews: 203,
    experience_years: 14,
    is_available: true,
    available_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    available_hours: { start: '08:00', end: '17:00' },
    profiles: {
      id: 'doc-5',
      role: 'doctor',
      full_name: 'dr. Rina Wati, Sp.OG',
      phone: '08567890123',
      avatar_url: null,
      gender: 'P',
      city: 'Jakarta',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    patient_id: 'pat-1',
    doctor_id: 'doc-1',
    scheduled_at: new Date().toISOString(),
    consultation_type: 'video',
    status: 'confirmed',
    chief_complaint: 'Demam dan batuk selama 3 hari',
    daily_room_name: 'telezeta-apt-1',
    daily_room_url: 'https://telezeta.daily.co/telezeta-apt-1',
    consultation_fee: 75000,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    doctor: MOCK_DOCTORS[0],
  },
  {
    id: 'apt-2',
    patient_id: 'pat-1',
    doctor_id: 'doc-2',
    scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(),
    consultation_type: 'chat',
    status: 'pending',
    chief_complaint: 'Konsultasi tekanan darah tinggi',
    consultation_fee: 100000,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    doctor: MOCK_DOCTORS[1],
  },
  {
    id: 'apt-3',
    patient_id: 'pat-1',
    doctor_id: 'doc-3',
    scheduled_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    consultation_type: 'video',
    status: 'completed',
    chief_complaint: 'Kontrol rutin anak',
    consultation_fee: 85000,
    notes: 'Anak sehat, pertumbuhan normal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    doctor: MOCK_DOCTORS[2],
  },
];

export const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'presc-1',
    medical_record_id: 'rec-1',
    patient_id: 'pat-1',
    doctor_id: 'doc-1',
    pharmacist_id: undefined,
    status: 'pending',
    notes: 'Minum setelah makan, hindari makanan pedas',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    prescription_items: [
      { id: 'pi-1', prescription_id: 'presc-1', medicine_name: 'Paracetamol 500mg', dosage: '500mg', frequency: '3x sehari', quantity: 10, refills: 0, instructions: 'Diminum setelah makan' },
      { id: 'pi-2', prescription_id: 'presc-1', medicine_name: 'Amoxicillin 500mg', dosage: '500mg', frequency: '3x sehari', quantity: 15, refills: 0, instructions: 'Diminum sampai habis' },
      { id: 'pi-3', prescription_id: 'presc-1', medicine_name: 'OBH Combi', dosage: '10ml', frequency: '3x sehari', quantity: 1, refills: 0, instructions: 'Diminum sebelum tidur' },
    ],
    doctor: MOCK_DOCTORS[0],
  },
  {
    id: 'presc-2',
    medical_record_id: 'rec-2',
    patient_id: 'pat-1',
    doctor_id: 'doc-2',
    pharmacist_id: 'pharm-1',
    status: 'ready',
    notes: 'Obat antihipertensi, diminum rutin',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    prescription_items: [
      { id: 'pi-4', prescription_id: 'presc-2', medicine_name: 'Amlodipine 5mg', dosage: '5mg', frequency: '1x sehari', quantity: 30, refills: 2, instructions: 'Diminum pagi hari' },
      { id: 'pi-5', prescription_id: 'presc-2', medicine_name: 'Candesartan 8mg', dosage: '8mg', frequency: '1x sehari', quantity: 30, refills: 2, instructions: 'Diminum malam hari' },
    ],
    doctor: MOCK_DOCTORS[1],
  },
];

export const MOCK_MEDICAL_RECORDS: MedicalRecord[] = [
  {
    id: 'rec-1',
    appointment_id: 'apt-3',
    patient_id: 'pat-1',
    doctor_id: 'doc-1',
    diagnosis: 'ISPA (Infeksi Saluran Pernapasan Akut)',
    notes: 'Pasien mengeluh demam selama 3 hari disertai batuk berdahak. Pemeriksaan fisik menunjukkan faring hiperemis. Tidak ditemukan ronkhi atau wheezing.',
    follow_up_date: new Date(Date.now() + 86400000 * 7).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    doctor: MOCK_DOCTORS[0],
  },
  {
    id: 'rec-2',
    appointment_id: 'apt-3',
    patient_id: 'pat-1',
    doctor_id: 'doc-2',
    diagnosis: 'Hipertensi Grade I',
    notes: 'Tekanan darah 150/90 mmHg. Riwayat keluarga dengan hipertensi. Disarankan diet rendah garam dan olahraga teratur.',
    follow_up_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    doctor: MOCK_DOCTORS[1],
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'pat-1',
    title: 'Jadwal Konsultasi',
    body: 'Konsultasi Anda dengan dr. Ahmad Fadillah akan dimulai dalam 1 jam',
    type: 'appointment_reminder',
    target_url: '/dashboard/patient/appointments',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    user_id: 'pat-1',
    title: 'Resep Siap',
    body: 'Resep dari dr. Siti Rahayu sudah siap diambil',
    type: 'prescription_ready',
    target_url: '/dashboard/patient/prescriptions',
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif-3',
    user_id: 'pat-1',
    title: 'Rekam Medis Baru',
    body: 'dr. Ahmad Fadillah telah menyelesaikan rekam medis konsultasi Anda',
    type: 'medical_record_created',
    target_url: '/dashboard/patient/records',
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', pharmacist_id: 'pharm-1', medicine_name: 'Paracetamol 500mg', category: 'Analgesik', stock_quantity: 150, minimum_stock: 50, unit: 'strip', price_per_unit: 8000, updated_at: new Date().toISOString() },
  { id: 'inv-2', pharmacist_id: 'pharm-1', medicine_name: 'Amoxicillin 500mg', category: 'Antibiotik', stock_quantity: 8, minimum_stock: 20, unit: 'strip', price_per_unit: 15000, updated_at: new Date().toISOString() },
  { id: 'inv-3', pharmacist_id: 'pharm-1', medicine_name: 'Amlodipine 5mg', category: 'Antihipertensi', stock_quantity: 45, minimum_stock: 30, unit: 'strip', price_per_unit: 12000, updated_at: new Date().toISOString() },
  { id: 'inv-4', pharmacist_id: 'pharm-1', medicine_name: 'Omeprazole 20mg', category: 'Antasida', stock_quantity: 5, minimum_stock: 15, unit: 'strip', price_per_unit: 18000, updated_at: new Date().toISOString() },
  { id: 'inv-5', pharmacist_id: 'pharm-1', medicine_name: 'Cetirizine 10mg', category: 'Antihistamin', stock_quantity: 60, minimum_stock: 20, unit: 'strip', price_per_unit: 10000, updated_at: new Date().toISOString() },
  { id: 'inv-6', pharmacist_id: 'pharm-1', medicine_name: 'Metformin 500mg', category: 'Antidiabetes', stock_quantity: 3, minimum_stock: 25, unit: 'strip', price_per_unit: 9000, updated_at: new Date().toISOString() },
  { id: 'inv-7', pharmacist_id: 'pharm-1', medicine_name: 'OBH Combi', category: 'Obat Batuk', stock_quantity: 35, minimum_stock: 15, unit: 'botol', price_per_unit: 25000, updated_at: new Date().toISOString() },
];
