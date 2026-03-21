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

export function createClient() {
  if (!SUPABASE_URL.startsWith('https://') || SUPABASE_URL.includes('placeholder')) {
    // Return mock client yang selalu return null session
    return createBrowserClient(FALLBACK_URL, FALLBACK_KEY)
  }

  const url = SUPABASE_URL.startsWith('http') ? SUPABASE_URL : FALLBACK_URL
  const key = SUPABASE_ANON_KEY.length > 20 ? SUPABASE_ANON_KEY : FALLBACK_KEY

  return createBrowserClient(url, key)
}
