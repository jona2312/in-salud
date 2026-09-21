// Device authentication only. No app PIN stored or accepted.
import * as LocalAuthentication from 'expo-local-authentication'
import { Platform } from 'react-native'
export async function authenticateWithBiometric(): Promise<{ success: boolean }> {
  if (Platform.OS === 'web') return { success: false }
  try {
    // OS credential fallback is allowed; failure never unlocks the app.
    return await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear INsalud', cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar credencial del dispositivo', disableDeviceFallback: false,
    })
  } catch { return { success: false } }
}
