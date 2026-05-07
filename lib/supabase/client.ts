// [TeleZeta] Supabase Browser Client
// Digunakan di Client Components untuk mengakses Supabase dari browser
// Falls back to a dummy client when Supabase is not configured (demo mode)
import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Use a placeholder URL that won't throw during client creation
// Actual requests will fail gracefully, and pages fall back to mock data
const FALLBACK_URL = 'https://placeholder.supabase.co'
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder'

// Module-level singleton — @supabase/ssr sudah punya cache internal,
// tapi kita guard di sini juga untuk keamanan ekstra.
let _browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (_browserClient) return _browserClient;

  const url = SUPABASE_URL.startsWith('https://') && 
              !SUPABASE_URL.includes('placeholder')
    ? SUPABASE_URL : FALLBACK_URL
  const key = SUPABASE_ANON_KEY.length > 20 
    ? SUPABASE_ANON_KEY : FALLBACK_KEY

  _browserClient = createBrowserClient(url, key, {
    auth: {
      // FIX: Disable navigator.locks untuk mencegah cross-tab deadlock.
      // Cookies sudah inherently shared antar tab, jadi lock-based
      // coordination dari GoTrueClient tidak diperlukan dan justru
      // menyebabkan browser freeze saat 2+ tab terbuka bersamaan.
      lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
        return await fn();
      },
    },
    // Override default cookie handling untuk membuat "Session Cookie"
    // Secara default Supabase set maxAge 1 tahun. Kita hapus maxAge-nya 
    // agar token otomatis terhapus saat browser ditutup (Auto-Logout).
    cookies: {
      getAll() {
        if (typeof document === 'undefined') return [];
        return document.cookie.split(';').map(c => c.trim()).filter(Boolean).map(c => {
          const idx = c.indexOf('=');
          if (idx === -1) return { name: c, value: '' };
          const name = c.substring(0, idx);
          let value = c.substring(idx + 1);
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          try {
            return { name, value: decodeURIComponent(value) };
          } catch {
            return { name, value };
          }
        });
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') return;
        cookiesToSet.forEach(({ name, value, options }) => {
          let cookieStr = `${name}=${encodeURIComponent(value)}`;
          if (options.path) cookieStr += `; Path=${options.path}`;
          if (options.domain) cookieStr += `; Domain=${options.domain}`;
          if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
          if (options.secure) cookieStr += `; Secure`;
          
          // Jika value kosong, hapus cookie dengan maxAge=0
          // Jika tidak kosong, JANGAN set maxAge agar menjadi Session Cookie
          if (!value) {
            cookieStr += '; Max-Age=0';
          }
          
          document.cookie = cookieStr;
        });
      }
    }
  });

  return _browserClient;
}
