// [TeleZeta] Landing Page
// Halaman publik pertama dengan hero, fitur, dan preview dokter
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import TeleZetaLogo from '@/components/common/TeleZetaLogo';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import { MOCK_DOCTORS } from '@/lib/types';
import type { Doctor, Profile } from '@/lib/types';
import { ArrowRight, Video, MessageSquare, Clock, Shield, Star, Users, Phone, FileText } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/formatters';

// Fetch doctors server-side
async function getDoctors() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*, profiles(*)')
      .eq('is_available', true)
      .limit(3);

    if (error || !data || data.length === 0) {
      // Fallback to mock data
      return MOCK_DOCTORS.filter(d => d.is_available).slice(0, 3);
    }
    return data as (Doctor & { profiles: Profile })[];
  } catch (err) {
    return MOCK_DOCTORS.filter(d => d.is_available).slice(0, 3);
  }
}

export default async function LandingPage() {
  const doctors = await getDoctors();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar - Using sticky header with backdrop blur */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <TeleZetaLogo variant="dark" size="md" />
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="btn-ripple hidden sm:flex items-center justify-center rounded-full px-6 py-2.5 text-white font-medium transition-transform hover:-translate-y-0.5"
                style={{ background: 'var(--blue-accent)', boxShadow: '0 4px 14px rgba(74, 159, 212, 0.4)' }}
              >
                Daftar Gratis
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden py-24 sm:py-32"
          style={{ background: 'linear-gradient(135deg, var(--navy-primary) 0%, var(--navy-secondary) 100%)' }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-10">
            <svg width="404" height="404" fill="none" viewBox="0 0 404 404" aria-hidden="true">
              <defs>
                <pattern id="85737c0e-0916-41d7-917f-596dc7edfa27" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="4" height="4" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)" />
            </svg>
          </div>
          <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 opacity-20" style={{ filter: 'blur(100px)' }}>
            <div className="w-96 h-96 rounded-full" style={{ background: 'var(--blue-accent)' }} />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center animate-fadeUp">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight mb-6">
              Konsultasi Kesehatan <span className="italic" style={{ color: 'var(--blue-accent-light)' }}>Lebih Mudah</span><br />
              Kapan Saja, Di Mana Saja
            </h1>
            <p className="mt-4 text-xl sm:text-2xl max-w-3xl mx-auto mb-10" style={{ color: 'var(--silver-primary)' }}>
              Akses cepat ke dokter spesialis terpercaya melalui video call dan chat. Dapatkan resep obat langsung ke aplikasi Anda.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                href="/register"
                className="btn-ripple w-full sm:w-auto flex items-center justify-center rounded-full px-8 py-4 text-white font-semibold text-lg transition-transform hover:-translate-y-1"
                style={{ background: 'var(--blue-accent)', boxShadow: '0 8px 24px rgba(74, 159, 212, 0.4)' }}
              >
                Mulai Konsultasi <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
            
            {/* Quick Stats below hero */}
            <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4 border-t border-white/10 pt-10">
              {[
                { label: 'Dokter Spesialis', value: '500+' },
                { label: 'Pasien Aktif', value: '10K+' },
                { label: 'Ulasan Positif', value: '4.9/5' },
                { label: 'Mitra Apotek', value: '200+' },
              ].map((stat, i) => (
                <div key={i} className={`animate-fadeUp d${i + 2}`}>
                  <p className="text-3xl font-serif text-white mb-2">{stat.value}</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--silver-primary)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 animate-fadeUp">
              <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">Layanan Kesehatan Lengkap dalam Satu Genggaman</h2>
              <p className="text-lg text-gray-600">
                TeleZeta menyediakan ekosistem kesehatan digital end-to-end untuk kenyamanan Anda dan keluarga.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <Video className="w-8 h-8 text-blue-500" />, title: 'Video Call HD', desc: 'Konsultasi tatap muka virtual dengan dokter dari rumah Anda menggunakan kualitas video terbaik.' },
                { icon: <MessageSquare className="w-8 h-8 text-green-500" />, title: 'Chat Realtime', desc: 'Tanya jawab teks langsung dengan dokter untuk keluhan ringan atau konsultasi lanjutan.' },
                { icon: <FileText className="w-8 h-8 text-indigo-500" />, title: 'Resep Digital', desc: 'Dapatkan resep elektronik langsung di aplikasi yang terintegrasi dengan jaringan apotek.' },
                { icon: <Clock className="w-8 h-8 text-orange-500" />, title: 'Booking 24/7', desc: 'Jadwalkan konsultasi kapan saja sesuai dengan waktu luang Anda, tanpa perlu antre di klinik.' },
                { icon: <Shield className="w-8 h-8 text-red-500" />, title: 'Rekam Medis Aman', desc: 'Riwayat kesehatan Anda tersimpan dengan aman dan terenkripsi, mudah diakses jika dibutuhkan.' },
                { icon: <Users className="w-8 h-8 text-teal-500" />, title: 'Multi Role', desc: 'Platform terintegrasi untuk Pasien, Dokter, dan Apoteker dalam memberikan layanan kesehatan.' },
              ].map((feature, i) => (
                <div key={i} className="card p-8 hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-xl rounded-2xl border border-gray-100">
                  <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Doctor Preview Section */}
        <section className="py-24" style={{ background: 'var(--bg-light)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12">
              <div className="max-w-2xl">
                <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4 animate-slideRight">Dokter Spesialis Siap Membantu</h2>
                <p className="text-lg text-gray-600 animate-slideRight d1">Pilih dari ratusan dokter spesialis berpengalaman yang telah terverifikasi dan siap memberikan solusi untuk kesehatan Anda.</p>
              </div>
              <Link
                href="/register"
                className="mt-6 md:mt-0 flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                Lihat Semua Dokter <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {doctors.map((doctor, i) => (
                <div key={doctor.id} className={`card p-6 animate-fadeUp d${i + 1}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar
                      name={doctor.profiles.full_name}
                      src={doctor.profiles.avatar_url}
                      size={64}
                    />
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{doctor.profiles.full_name}</h3>
                      <p className="text-sm font-medium text-blue-600 mb-2">{doctor.specialty}</p>
                      <Badge status={doctor.is_available ? 'online' : 'offline'} />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 border-t border-b border-gray-100 py-3 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium text-gray-900">{doctor.rating}</span>
                      <span>({doctor.total_reviews})</span>
                    </div>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{doctor.experience_years} thn</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Biaya Konsultasi</p>
                      <p className="font-bold text-gray-900">{formatRupiah(doctor.consultation_fee)}</p>
                    </div>
                    <Link
                      href="/register"
                      className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg font-medium text-sm transition-colors"
                    >
                      Buat Janji
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl text-center text-gray-900 mb-16">Cara Kerja TeleZeta</h2>
            
            <div className="relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-gray-200" />
              
              <div className="grid md:grid-cols-4 gap-12 relative z-10">
                {[
                  { step: '1', title: 'Daftar & Pilih Dokter', desc: 'Buat akun dan temukan dokter spesialis yang sesuai dengan keluhan Anda.' },
                  { step: '2', title: 'Buat Janji', desc: 'Pilih jadwal yang tersedia dan jenis konsultasi (Video atau Chat).' },
                  { step: '3', title: 'Konfirmasi', desc: 'Tunggu dokter mengkonfirmasi jadwal konsultasi Anda.' },
                  { step: '4', title: 'Dapatkan Resep', desc: 'Setelah selesai, dokter akan memberikan rekam medis dan resep digital.' },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="w-24 h-24 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white relative">
                      <span className="text-3xl font-bold text-blue-600 font-serif">{item.step}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className="py-20 relative overflow-hidden"
          style={{ background: 'var(--navy-primary)' }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl text-white mb-6">Siap Memulai Konsultasi Pertama Anda?</h2>
            <p className="text-xl mb-10 text-blue-100 max-w-2xl mx-auto">
              Bergabung dengan ribuan pasien lainnya yang mempercayakan kesehatan mereka pada layanan dokter ahli dari TeleZeta.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-4 bg-white text-gray-900 rounded-full font-bold text-lg hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                Buat Akun Sekarang
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-transparent border-2 border-white/30 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-colors"
              >
                Masuk
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <TeleZetaLogo variant="dark" size="sm" />
              <p className="mt-4 text-gray-500 text-sm">
                TeleZeta adalah platform telemedicine terdepan di Indonesia, menghubungkan Anda dengan dokter spesialis dan apoteker terpercaya.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4 tracking-wide">Layanan</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link href="/" className="hover:text-blue-600 transition-colors">Video Call Dokter</Link></li>
                <li><Link href="/" className="hover:text-blue-600 transition-colors">Chat Medis</Link></li>
                <li><Link href="/" className="hover:text-blue-600 transition-colors">Penebusan Resep</Link></li>
                <li><Link href="/" className="hover:text-blue-600 transition-colors">Rekam Medis Digital</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4 tracking-wide">Bantuan</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link href="/" className="hover:text-blue-600 transition-colors">FAQ</Link></li>
                <li><Link href="/" className="hover:text-blue-600 transition-colors">Syarat & Ketentuan</Link></li>
                <li><Link href="/" className="hover:text-blue-600 transition-colors">Kebijakan Privasi</Link></li>
                <li><Link href="/" className="hover:text-blue-600 transition-colors">Kontak Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4 tracking-wide">Hubungi Kami</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> 0800-1-TELEZETA</li>
                <li className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-gray-400" /> support@telezeta.id</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm text-center md:text-left">
              © {new Date().getFullYear()} TeleZeta Indonesia. Diperuntukkan sebagai Tugas Akhir Kuliah.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
