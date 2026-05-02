/**
 * lib/supabase.ts — Cliente Supabase seguro para in-salud
 *
 * SEGURIDAD:
 * - Usa SecureStore para persistir sesiones (no AsyncStorage)
 * - Solo el anon key en el cliente — service role NUNCA aquí
 * - Schema 'salud' especificado para aislamiento de tablas
 * - RLS se aplica automáticamente para todas las queries
 */

import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Database } from '@/types/database'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno de Supabase. ' +
    'Copia .env.example a .env y completa los valores.'
  )
}

/**
 * Adaptador de SecureStore para Supabase Auth
 * Reemplaza el storage por defecto (localStorage/AsyncStorage)
 * SecureStore usa el keychain de iOS y el keystore de Android — encriptado por OS
 */
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient<Database, 'salud'>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Deshabilitado en mobile — usa deep links
  },
  db: {
    schema: 'salud', // Schema dedicado — aislado del schema public de in-mejora
  },
  global: {
    headers: {
      'x-app-name': 'in-salud',
    },
  },
})
