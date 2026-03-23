-- ============================================================
-- TeleZeta Database Schema
-- Platform Telemedicine Fullstack
-- ============================================================

-- EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABEL PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'pharmacist')),
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('L', 'P')),
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL DOCTORS (detail tambahan untuk role doctor)
-- ============================================================
CREATE TABLE doctors (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  specialty TEXT NOT NULL,
  sip_number TEXT UNIQUE,
  str_number TEXT,
  hospital TEXT,
  bio TEXT,
  consultation_fee INTEGER DEFAULT 75000,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  experience_years INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  available_days TEXT[] DEFAULT ARRAY['Senin','Selasa','Rabu','Kamis','Jumat'],
  available_hours JSONB DEFAULT '{"start": "08:00", "end": "17:00"}'
);

-- ============================================================
-- TABEL PHARMACISTS (detail tambahan untuk role pharmacist)
-- ============================================================
CREATE TABLE pharmacists (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  sipa_number TEXT UNIQUE,
  pharmacy_name TEXT,
  pharmacy_address TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- TABEL APPOINTMENTS (booking konsultasi)
-- ============================================================
CREATE TABLE appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('video', 'chat')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ongoing', 'completed', 'cancelled')),
  chief_complaint TEXT,
  daily_room_name TEXT,
  daily_room_url TEXT,
  consultation_fee INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL MESSAGES (chat realtime)
-- ============================================================
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL MEDICAL RECORDS (rekam medis)
-- ============================================================
CREATE TABLE medical_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  diagnosis TEXT NOT NULL,
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL PRESCRIPTIONS (resep digital)
-- ============================================================
CREATE TABLE prescriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  pharmacist_id UUID REFERENCES pharmacists(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'dispensed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL PRESCRIPTION ITEMS (detail obat dalam resep)
-- ============================================================
CREATE TABLE prescription_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE NOT NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  refills INTEGER DEFAULT 0,
  instructions TEXT
);

-- ============================================================
-- TABEL REVIEWS (ulasan pasien untuk dokter)
-- ============================================================
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  target_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL INVENTORY (stok obat apoteker)
-- ============================================================
CREATE TABLE inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pharmacist_id UUID REFERENCES pharmacists(id) ON DELETE CASCADE NOT NULL,
  medicine_name TEXT NOT NULL,
  category TEXT,
  stock_quantity INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 10,
  unit TEXT DEFAULT 'strip',
  price_per_unit INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacists ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Profiles: user hanya bisa lihat dan edit profil sendiri, tapi bisa lihat profil dokter
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Doctors: semua bisa lihat, dokter bisa edit profil sendiri
CREATE POLICY "Doctors are viewable by everyone" ON doctors FOR SELECT USING (true);
CREATE POLICY "Doctors can update own data" ON doctors FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Doctors can insert own data" ON doctors FOR INSERT WITH CHECK (auth.uid() = id);

-- Pharmacists
CREATE POLICY "Pharmacists are viewable by everyone" ON pharmacists FOR SELECT USING (true);
CREATE POLICY "Pharmacists can update own data" ON pharmacists FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Pharmacists can insert own data" ON pharmacists FOR INSERT WITH CHECK (auth.uid() = id);

-- Appointments: pasien dan dokter hanya bisa lihat appointment mereka sendiri
CREATE POLICY "Patients can view own appointments" ON appointments FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
CREATE POLICY "Patients can create appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Doctors can update appointment status" ON appointments FOR UPDATE USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

-- Messages: hanya peserta appointment yang bisa lihat dan kirim pesan
CREATE POLICY "Participants can view messages" ON messages FOR SELECT USING (
  auth.uid() IN (SELECT patient_id FROM appointments WHERE id = appointment_id UNION SELECT doctor_id FROM appointments WHERE id = appointment_id)
);
CREATE POLICY "Participants can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Medical Records
CREATE POLICY "Patients can view own records" ON medical_records FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
CREATE POLICY "Doctors can create records" ON medical_records FOR INSERT WITH CHECK (auth.uid() = doctor_id);

-- Prescriptions
CREATE POLICY "View own prescriptions" ON prescriptions FOR SELECT USING (
  auth.uid() = patient_id OR auth.uid() = doctor_id OR
  auth.uid() IN (SELECT id FROM pharmacists)
);
CREATE POLICY "Doctors can create prescriptions" ON prescriptions FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Pharmacists can update prescription status" ON prescriptions FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM pharmacists) OR auth.uid() = doctor_id
);

-- Prescription Items
CREATE POLICY "View prescription items" ON prescription_items FOR SELECT USING (
  prescription_id IN (
    SELECT id FROM prescriptions WHERE
    patient_id = auth.uid() OR doctor_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM pharmacists)
  )
);
CREATE POLICY "Doctors can create prescription items" ON prescription_items FOR INSERT WITH CHECK (
  prescription_id IN (SELECT id FROM prescriptions WHERE doctor_id = auth.uid())
);

-- Reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Patients can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can mark own notifications read" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Inventory
CREATE POLICY "Pharmacists can view own inventory" ON inventory FOR SELECT USING (auth.uid() = pharmacist_id);
CREATE POLICY "Pharmacists can manage own inventory" ON inventory FOR INSERT WITH CHECK (auth.uid() = pharmacist_id);
CREATE POLICY "Pharmacists can update own inventory" ON inventory FOR UPDATE USING (auth.uid() = pharmacist_id);
CREATE POLICY "Pharmacists can delete own inventory" ON inventory FOR DELETE USING (auth.uid() = pharmacist_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: buat profil otomatis setelah user register
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: update rating dokter saat ada review baru
CREATE OR REPLACE FUNCTION update_doctor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE doctors
  SET
    rating = (SELECT AVG(rating) FROM reviews WHERE doctor_id = NEW.doctor_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE doctor_id = NEW.doctor_id)
  WHERE id = NEW.doctor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_doctor_rating();

-- Trigger: update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Realtime untuk tabel yang butuh live updates
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE prescriptions;
