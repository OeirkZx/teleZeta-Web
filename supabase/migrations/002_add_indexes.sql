-- ============================================================
-- TeleZeta: Performance Indexes Migration
-- Dibuat berdasarkan analisis query pattern aktual di codebase.
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ============================================================
-- APPOINTMENTS — tabel paling sering di-query dengan filter
-- ============================================================

-- Digunakan oleh: patient dashboard (patient_id + status + scheduled_at)
CREATE INDEX IF NOT EXISTS idx_appointments_patient_status_date
  ON appointments (patient_id, status, scheduled_at DESC);

-- Digunakan oleh: doctor dashboard & schedule (doctor_id + scheduled_at)
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
  ON appointments (doctor_id, scheduled_at DESC);

-- Digunakan oleh: realtime subscription filter
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id
  ON appointments (patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id
  ON appointments (doctor_id);

-- ============================================================
-- MEDICAL RECORDS — di-query berdasarkan patient_id / doctor_id
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_medical_records_patient_created
  ON medical_records (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_created
  ON medical_records (doctor_id, created_at DESC);

-- Digunakan untuk join ke appointments
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment_id
  ON medical_records (appointment_id);

-- ============================================================
-- PRESCRIPTIONS — tabel paling banyak di-query oleh pharmacist
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_created
  ON prescriptions (patient_id, created_at DESC);

-- Digunakan oleh pharmacist queue (pharmacist_id + status)
CREATE INDEX IF NOT EXISTS idx_prescriptions_pharmacist_status
  ON prescriptions (pharmacist_id, status);

-- Digunakan oleh pharmacist dashboard (status filter)
CREATE INDEX IF NOT EXISTS idx_prescriptions_status_updated
  ON prescriptions (status, updated_at DESC);

-- Digunakan untuk join ke prescription_items
CREATE INDEX IF NOT EXISTS idx_prescriptions_id
  ON prescriptions (id);

-- ============================================================
-- PRESCRIPTION ITEMS — join dari prescriptions
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id
  ON prescription_items (prescription_id);

-- ============================================================
-- NOTIFICATIONS — sorted by created_at, filtered by user_id + is_read
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON notifications (user_id, is_read, created_at DESC);

-- Digunakan oleh realtime filter
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications (user_id);

-- ============================================================
-- MESSAGES — filtered by appointment_id, sorted by created_at
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_messages_appointment_created
  ON messages (appointment_id, created_at ASC);

-- ============================================================
-- INVENTORY — filtered by pharmacist_id, sorted by name
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_inventory_pharmacist_name
  ON inventory (pharmacist_id, medicine_name ASC);

-- ============================================================
-- REVIEWS — filtered by doctor_id (for rating calculation)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_reviews_doctor_id
  ON reviews (doctor_id);

-- ============================================================
-- DOCTORS — filtered by is_available (very common query)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_doctors_is_available
  ON doctors (is_available);

-- Verifikasi: tampilkan semua index yang baru dibuat
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
