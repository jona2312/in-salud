import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { clearPrivateCache } from '@/lib/queryClient'
import { cancelAllReminders } from '@/lib/notifications'

interface AuthState {
  session: Session | null
  user: User | null
  isLocked: boolean
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  setSession: (session: Session | null) => void
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  unlockApp: () => void
  lockAppNow: () => void
  clearError: () => void
}
let authOperation = 0
export const useAuthStore = create<AuthState>((set, get) => ({
  session: null, user: null, isLocked: true, isInitialized: false, isLoading: false, error: null,
  setSession: (session) => {
    const changed = get().user?.id !== session?.user.id
    if (changed || !session) clearPrivateCache()
    set({ session, user: session?.user ?? null, isInitialized: true,
      isLocked: changed || !session ? true : get().isLocked })
  },
  signIn: async (email, password) => {
    if (!email.trim() || !password) { set({ error: 'Email y contraseña requeridos' }); return }
    const operation = ++authOperation
    const expectedUser = get().user?.id
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
      if (operation !== authOperation) return
      if (error || !data.session || (expectedUser && data.user?.id !== expectedUser)) {
        set({ error: 'No se pudo verificar la identidad.', isLocked: true }); return
      }
      // A fresh password verification is itself the fallback, not a local PIN.
      get().setSession(data.session)
      set({ isLocked: false })
    } catch { if (operation === authOperation) set({ error: 'No se pudo conectar. Intentá nuevamente.', isLocked: true }) }
    finally { if (operation === authOperation) set({ isLoading: false }) }
  },
  signOut: async () => {
    ++authOperation
    // Block/unmount private views before asynchronous cleanup, even when offline.
    set({ isLocked: true, error: null, isLoading: false })
    clearPrivateCache()
    try {
      await cancelAllReminders()
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
      get().setSession(null)
    } catch {
      set({ error: 'No se pudo completar el cierre. La app sigue bloqueada; reintentá con conexión.' })
    }
  },
  unlockApp: () => { if (get().session) set({ isLocked: false }) },
  lockAppNow: () => set({ isLocked: true }),
  clearError: () => set({ error: null }),
}))
