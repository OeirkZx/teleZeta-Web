// [TeleZeta] Next.js Middleware
// Protects dashboard and consultation routes, refreshes auth sessions
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/consultation/:path*',
    '/login',
    '/register',
  ],
}
