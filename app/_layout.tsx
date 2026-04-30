/**
 * app/_layout.tsx — Root layout de la app
 *
 * SEGURIDAD:
 * - Escucha cambios de sesión de Supabase
 * - Re-lock automático al volver al foreground después de 5 min
 * - Redirige a login si no hay sesión activa
 */

import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
})

function RootLayoutNav() {
  const router = useRouter()
  const segments = useSegments()
  const { session, isLocked, setSession, lockAppNow, checkBiometricLock } = useAuthStore()
  const appState = useRef(AppState.currentState)
  const backgroundTimestamp = useRef<number | null>(null)

  // Escuchar cambios de sesión de Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Re-lock automático al volver de background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (appState.current === 'active' && nextState === 'background') {
        backgroundTimestamp.current = Date.now()
      }

      if (nextState === 'active' && backgroundTimestamp.current) {
        const elapsed = Date.now() - backgroundTimestamp.current
        const FIVE_MINUTES = 5 * 60 * 1000
        if (elapsed > FIVE_MINUTES) {
          await lockAppNow()
        } else {
          await checkBiometricLock()
        }
        backgroundTimestamp.current = null
      }

      appState.current = nextState
    })

    return () => subscription.remove()
  }, [])

  // Protección de rutas
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)'

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [session, segments])

  return <Slot />
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  )
}
