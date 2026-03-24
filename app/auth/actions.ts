'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function loginWithEmail(email: string, password: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Email atau password yang Anda masukkan salah' }
      } else if (error.message.includes('Email not confirmed')) {
        return { error: 'Akun Anda belum dikonfirmasi, hubungi administrator' }
      }
      return { error: error.message || 'Terjadi kesalahan, silakan coba lagi' }
    }

    if (!data.session) {
      return { error: 'Gagal membuat sesi. Silakan coba lagi.' }
    }

    // Refresh the router cache so that next navigations pick up the new auth state
    revalidatePath('/', 'layout')
    
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Terjadi kesalahan tidak terduga' }
  }
}

export async function logoutUser() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) throw error

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Gagal logout' }
  }
}
