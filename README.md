# TeleZeta — Platform Telemedicine

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)

TeleZeta adalah platform telemedicine fullstack yang menghubungkan pasien dengan dokter spesialis dan apoteker secara digital. Dibangun sebagai proyek tugas Mata kuliah Telemedicine dengan tech stack modern yang semuanya gratis.

---

## ✨ Fitur Utama

- 💬 **Chat Realtime** — Konsultasi langsung dengan dokter via pesan terenkripsi
- 📹 **Video Call HD** — Tatap muka virtual tanpa aplikasi tambahan (Daily.co)
- 📅 **Booking Jadwal** — Pilih dokter dan atur waktu konsultasi dengan mudah
- 📋 **Rekam Medis Digital** — Riwayat konsultasi dan diagnosis tersimpan aman
- 💊 **Resep Digital** — Dokter terbitkan resep, apoteker proses di sistem yang sama
- 🔔 **Notifikasi Realtime** — Update status resep dan jadwal secara otomatis
- 👥 **Multi Role** — Dashboard khusus untuk Pasien, Dokter, dan Apoteker

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + Custom Design System |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Video Call | Daily.co |
| Deployment | Vercel |
| Form Validation | React Hook Form + Zod |

---

## 🚀 Cara Menjalankan

### Prerequisites
- Node.js v18+
- Akun Supabase (gratis)
- Akun Daily.co (gratis)

### Instalasi
```bash
# Clone repository
git clone https://github.com/OeirkZx/teleZeta-Web.git
cd teleZeta-Web

# Install dependencies
npm install
```

### Konfigurasi Environment

Buat file `.env.local` di root project:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DAILY_API_KEY=your_daily_api_key
NEXT_PUBLIC_DAILY_URL=your_daily_room_url
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Setup Database

Jalankan migration SQL di Supabase SQL Editor:
```bash
# Buka file ini dan jalankan di Supabase SQL Editor
supabase/migrations/001_initial.sql
```

### Jalankan Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 👥 Role Pengguna

### 🧑‍💼 Pasien
- Cari dan booking dokter berdasarkan spesialisasi
- Konsultasi via chat atau video call
- Akses rekam medis dan resep digital

### 👨‍⚕️ Dokter
- Kelola jadwal konsultasi harian
- Tulis rekam medis dan resep digital
- Lihat statistik praktik dan rating

### 💊 Apoteker
- Terima dan proses antrian resep secara realtime
- Update status resep (diproses / siap diambil)
- Kelola stok obat

---

## 📁 Struktur Project
```
telezeta/
├── app/
│   ├── dashboard/
│   │   ├── patient/      # Dashboard pasien
│   │   ├── doctor/       # Dashboard dokter
│   │   └── pharmacist/   # Dashboard apoteker
│   ├── consultation/     # Halaman video call
│   ├── login/
│   └── register/
├── components/
│   ├── common/           # Avatar, Badge, StatCard, Logo
│   └── layout/           # Sidebar, TopBar, DashboardLayout
├── lib/
│   ├── hooks/            # useAuth, useRealtimeChat, useNotifications
│   ├── supabase/         # Client, Server, Middleware
│   └── types/            # TypeScript interfaces & mock data
└── supabase/
    └── migrations/       # SQL schema database
```

---

## 🎨 Design System

- **Primary Color:** Navy `#0B1F3A`
- **Accent Color:** Blue `#4A9FD4`
- **Silver:** `#C8D6E8`
- **Font:** DM Sans + DM Serif Display

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan tugas Mata kuliah Telemedicine oleh Ranu Kumbolo.

---

<p align="center">Dibuat dengan ❤️ menggunakan Next.js & Supabase</p>
