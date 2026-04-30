/**
 * app/(auth)/login.tsx — Pantalla de login
 *
 * SEGURIDAD:
 * - Rate limit visual: deshabilita botón por 3 segundos después de error
 * - No muestra si el email existe o no (previene enumeración de usuarios)
 * - Limpia el error al tipear para no confundir al usuario
 */

import { useState, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert
} from 'react-native'
import { useAuthStore } from '@/stores/useAuthStore'
import { authenticateWithBiometric } from '@/lib/biometric'
import { COLORS } from '@/constants/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cooldown, setCooldown] = useState(false)

  const { signIn, isLoading, error, clearError, unlockApp, session } = useAuthStore()

  // Si ya hay sesión, mostrar pantalla de biometría
  const handleBiometric = useCallback(async () => {
    const result = await authenticateWithBiometric()
    if (result.success) {
      unlockApp()
    } else if (result.fallbackToPin) {
      Alert.alert('Usar PIN', 'Ingresá tu PIN de 4 dígitos', [
        { text: 'Cancelar', style: 'cancel' },
      ])
    }
  }, [unlockApp])

  const handleLogin = useCallback(async () => {
    if (cooldown || isLoading) return
    clearError()
    await signIn(email, password)

    // Cooldown visual después de intento fallido
    if (error) {
      setCooldown(true)
      setTimeout(() => setCooldown(false), 3000)
    }
  }, [email, password, cooldown, isLoading, signIn, clearError, error])

  // Si hay sesión activa, mostrar pantalla de desbloqueo biométrico
  if (session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>in-salud</Text>
        <Text style={styles.subtitle}>Tu familia. Tu salud. Segura.</Text>
        <TouchableOpacity style={styles.biometricButton} onPress={handleBiometric}>
          <Text style={styles.biometricText}>🔐 Desbloquear con biometría</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>in-salud</Text>
      <Text style={styles.subtitle}>Tu familia. Tu salud. Segura.</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.gray400}
          value={email}
          onChangeText={(v) => { setEmail(v); clearError() }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={COLORS.gray400}
          value={password}
          onChangeText={(v) => { setPassword(v); clearError() }}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, (isLoading || cooldown) && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading || cooldown}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Ingresar</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray500,
    marginBottom: 48,
  },
  form: {
    width: '100%',
    gap: 12,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  biometricButton: {
    marginTop: 32,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  biometricText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
})
