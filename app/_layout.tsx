import { useEffect } from 'react'
import { AppState } from 'react-native'
import { Slot } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/useAuthStore'
import { IS_PREVIEW } from '@/lib/preview'
import DemoPreview from '@/components/DemoPreview'

function SessionLifecycle() {
  useEffect(() => {
    let active = true
    let authEventReceived = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true
      if (active) useAuthStore.getState().setSession(session)
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (active && !authEventReceived) useAuthStore.getState().setSession(error ? null : data.session)
    }).catch(() => {
      if (active && !authEventReceived) useAuthStore.getState().setSession(null)
    })
    const app = AppState.addEventListener('change', state => {
      if (state !== 'active') useAuthStore.getState().lockAppNow()
    })
    return () => { active = false; subscription.unsubscribe(); app.remove() }
  }, [])
  return <Slot />
}
export default function RootLayout() {
  if (IS_PREVIEW) return <DemoPreview />
  return <QueryClientProvider client={queryClient}><SessionLifecycle /></QueryClientProvider>
}
