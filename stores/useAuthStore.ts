/**
 * stores/useAuthStore.ts — Estado global de autenticación
 *
 * SEGURIDAD:
 * - La sesión de Supabase se persiste en SecureStore (ver lib/supabase.ts)
 * - El estado biométrico es SOLO local — no se envía a Supabase
 * - isLocked controla el acceso a la app después del re-lock por inactividad
 */

import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { lockApp, isAuthStillValid } from '@/lib/biometric'

interface AuthState {
  session: Session | null
  user: User | null
  isLocked: boolean       // App bloqueada por biometría (no por sesión)
  isLoading: boolean
  error: string | null

  // Actions
  setSession: (session: Session | null) => void
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  unlockApp: () => void
  lockAppNow: () => Promise<void>
  checkBiometricLock: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLocked: true,
  isLoading: false,
  error: null,

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      // Si hay sesión, bloquear app hasta que pase biometría
      isLocked: session !== null,
    })
  },

  signIn: async (email: string, password: string) => {
    // Validación básica antes de llamar a Supabase
    if (!email || !password) {
      set({ error: 'Email y contraseña requeridos' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      set({ error: 'Email inválido' })
      return
    }
    if (password.length < 6) {
      set({ error: 'Contraseña demasiado corta' })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })

      if (error) {
        // No exponer mensajes internos de Supabase al usuario
        set({ error: 'Credenciales incorrectas. Intentá de nuevo.', isLoading: false })
        return
      }

      set({
        session: data.session,
        user: data.user,
        isLocked: true, // Siempre bloquear después de login — requiere biometría
        isLoading: false,
        error: null,
      })
    } catch {
      set({ error: 'Error de conexión. Verificá tu internet.', isLoading: false })
    }
  },

  signOut: async () => {
    await lockApp()
    await supabase.auth.signOut()
    set({ session: null, user: null, isLocked: true, error: null })
  },

  unlockApp: () => {
    set({ isLocked: false })
  },

  lockAppNow: async () => {
    await lockApp()
    set({ isLocked: true })
  },

  checkBiometricLock: async () => {
    const { session } = get()
    if (!session) return
    const valid = await isAuthStillValid()
    if (!valid) {
      set({ isLocked: true })
    }
  },

  clearError: () => set({ error: null }),
}))
