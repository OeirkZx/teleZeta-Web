// [TeleZeta] Supabase Middleware Helper
// Handles session refresh on every request
// Gracefully skips auth when Supabase is not configured (demo mode)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function isSupabaseConfigured(): boolean {
  return (
    SUPABASE_URL.startsWith('http') &&
    SUPABASE_ANON_KEY.length > 20
  )
}

export async function updateSession(request: NextRequest) {
  // If Supabase is not configured, allow all routes (demo mode)
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request })
  }

  const hasCookies = request.cookies.getAll().length > 0
  if (!hasCookies) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session - IMPORTANT: do not remove this
  const { data: { session }, error } = await supabase.auth.getSession()

  // Hanya anggap user authenticated jika session valid DAN tidak error
  const isAuthenticated = !error && session !== null && session.user !== null

  const { pathname } = request.nextUrl

  // Protected routes: redirect to login if not authenticated
  if (!isAuthenticated && (pathname.startsWith('/dashboard') || pathname.startsWith('/consultation'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('message', 'Silakan masuk terlebih dahulu')
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login/register
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
