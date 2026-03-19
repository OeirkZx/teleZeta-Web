// [TeleZeta] Zod Validation Schemas
// Digunakan untuk validasi form di seluruh aplikasi

import { z } from 'zod';

// ============================================================
// Auth Schemas
// ============================================================

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid, contoh: nama@email.com'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

// Patient Registration - Step 1
export const patientStep1Schema = z.object({
  full_name: z.string().min(3, 'Nama minimal 3 karakter'),
  date_of_birth: z.string().min(1, 'Tanggal lahir wajib diisi'),
  gender: z.enum(['L', 'P'], { message: 'Jenis kelamin wajib dipilih' }),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').regex(/^[0-9+]+$/, 'Nomor telepon tidak valid'),
});

// Patient Registration - Step 2
export const patientStep2Schema = z.object({
  'register-email': z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

// Doctor Registration - Step 1
export const doctorStep1Schema = z.object({
  full_name: z.string().min(3, 'Nama dengan gelar minimal 3 karakter'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').regex(/^[0-9+]+$/, 'Nomor telepon tidak valid'),
  specialty: z.string().min(1, 'Spesialisasi wajib dipilih'),
});

// Doctor Registration - Step 2
export const doctorStep2Schema = z.object({
  sip_number: z.string().min(5, 'Nomor SIP wajib diisi'),
  str_number: z.string().optional(),
  hospital: z.string().min(3, 'Nama rumah sakit wajib diisi'),
});

// Doctor Registration - Step 3
export const doctorStep3Schema = z.object({
  'register-email': z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

// Pharmacist Registration - Step 1
export const pharmacistStep1Schema = z.object({
  full_name: z.string().min(3, 'Nama dengan gelar minimal 3 karakter'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').regex(/^[0-9+]+$/, 'Nomor telepon tidak valid'),
});

// Pharmacist Registration - Step 2
export const pharmacistStep2Schema = z.object({
  sipa_number: z.string().min(5, 'Nomor SIPA wajib diisi'),
  pharmacy_name: z.string().min(3, 'Nama apotek wajib diisi'),
});

// Pharmacist Registration - Step 3
export const pharmacistStep3Schema = z.object({
  'register-email': z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

// ============================================================
// Booking Schema
// ============================================================

export const bookingSchema = z.object({
  consultation_type: z.enum(['video', 'chat'], { message: 'Tipe konsultasi wajib dipilih' }),
  scheduled_at: z.string().min(1, 'Jadwal konsultasi wajib dipilih'),
  chief_complaint: z.string().min(10, 'Keluhan minimal 10 karakter'),
});

// ============================================================
// Medical Record Schema
// ============================================================

export const medicalRecordSchema = z.object({
  diagnosis: z.string().min(5, 'Diagnosis wajib diisi'),
  notes: z.string().optional(),
  follow_up_date: z.string().optional(),
  prescriptions: z.array(z.object({
    medicine_name: z.string().min(2, 'Nama obat wajib diisi'),
    dosage: z.string().min(1, 'Dosis wajib diisi'),
    frequency: z.string().min(1, 'Frekuensi wajib diisi'),
    quantity: z.number().min(1, 'Jumlah minimal 1'),
    instructions: z.string().optional(),
  })).optional(),
});

// ============================================================
// Profile Update Schema
// ============================================================

export const profileUpdateSchema = z.object({
  full_name: z.string().min(3, 'Nama minimal 3 karakter'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['L', 'P']).optional(),
  city: z.string().optional(),
});

// ============================================================
// Inventory Schema
// ============================================================

export const inventorySchema = z.object({
  medicine_name: z.string().min(2, 'Nama obat wajib diisi'),
  category: z.string().optional(),
  stock_quantity: z.number().min(0, 'Stok tidak boleh negatif'),
  minimum_stock: z.number().min(0, 'Stok minimum tidak boleh negatif'),
  unit: z.string().min(1, 'Satuan wajib diisi'),
  price_per_unit: z.number().min(0, 'Harga tidak boleh negatif'),
});

// ============================================================
// Review Schema
// ============================================================

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// Type exports for form data
export type LoginFormData = z.infer<typeof loginSchema>;
export type PatientStep1Data = z.infer<typeof patientStep1Schema>;
export type PatientStep2Data = z.infer<typeof patientStep2Schema>;
export type DoctorStep1Data = z.infer<typeof doctorStep1Schema>;
export type DoctorStep2Data = z.infer<typeof doctorStep2Schema>;
export type DoctorStep3Data = z.infer<typeof doctorStep3Schema>;
export type PharmacistStep1Data = z.infer<typeof pharmacistStep1Schema>;
export type PharmacistStep2Data = z.infer<typeof pharmacistStep2Schema>;
export type PharmacistStep3Data = z.infer<typeof pharmacistStep3Schema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
export type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type InventoryFormData = z.infer<typeof inventorySchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
