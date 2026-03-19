// [TeleZeta] Next.js Middleware
// Protects dashboard and consultation routes, refreshes auth sessions
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes that don't need auth
    '/((?!_next/static|_next/image|favicon.ico|logo.png|logo-white.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
