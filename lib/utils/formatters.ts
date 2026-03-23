// [TeleZeta] Formatter Utilities
// Format angka, tanggal, dan waktu untuk Bahasa Indonesia

/**
 * Format angka ke format Rupiah Indonesia
 * Contoh: 75000 → "Rp 75.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal ke format Indonesia
 * Contoh: "2024-01-15" → "15 Januari 2024"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Format tanggal pendek
 * Contoh: "2024-01-15" → "15 Jan 2024"
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format waktu saja (WIB)
 * Contoh: "2024-01-15T09:30:00" → "09:30"
 */
export function formatTimeWIB(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Format waktu saja (Legacy)
 * Contoh: "2024-01-15T09:30:00" → "09:30"
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Format tanggal dan waktu lengkap
 * Contoh: "2024-01-15T09:30:00" → "15 Januari 2024, 09:30"
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Format hari dalam bahasa Indonesia
 * Contoh: "2024-01-15" → "Senin"
 */
export function formatDay(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(date);
}

/**
 * Format waktu relatif (time ago)
 * Contoh: 5 menit lalu, 2 jam lalu, kemarin
 */
export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan lalu`;
  return `${Math.floor(diffDays / 365)} tahun lalu`;
}

/**
 * Format nama hari dari array ke string
 * Contoh: ['Senin', 'Selasa', 'Rabu'] → "Senin, Selasa, Rabu"
 */
export function formatDays(days: string[]): string {
  return days.join(', ');
}

/**
 * Format jam praktek
 * Contoh: { start: "08:00", end: "17:00" } → "08:00 - 17:00 WIB"
 */
export function formatHours(hours: { start: string; end: string }): string {
  return `${hours.start} - ${hours.end} WIB`;
}

/**
 * Mendapatkan inisial dari nama lengkap
 * Contoh: "dr. Ahmad Fadillah" → "AF"
 */
export function getInitials(name: string): string {
  return name
    .replace(/^(dr\.|Dr\.|prof\.|Prof\.)\s*/i, '')
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

/**
 * Format rating ke string
 * Contoh: 4.8 → "4.8"
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Cek apakah tanggal adalah hari ini
 */
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Cek apakah tanggal sudah lewat
 */
export function isPast(dateString: string): boolean {
  return new Date(dateString) < new Date();
}
