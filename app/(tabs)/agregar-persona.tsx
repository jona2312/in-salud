/**
 * app/(tabs)/agregar-persona.tsx — Formulario de alta de persona
 *
 * SEGURIDAD:
 * - owner_id se toma SIEMPRE de la sesión autenticada (nunca del input)
 * - Validación de campos antes de insertar
 * - RLS en Supabase garantiza que solo el owner puede insertar
 */

import { useState } from 'react'
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { COLORS } from '@/constants/theme'
import { BloodType, Gender } from '@/types/database'

// Opciones de grupo sanguíneo y sexo (solo las válidas en el schema)
const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENDERS: { value: Gender; label: string }[] = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
]

// Valida formato de fecha AAAA-MM-DD
function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(s)
  return !isNaN(d.getTime()) && d.getFullYear() >= 1900 && d <= new Date()
}

export default function AgregarPersonaScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { session } = useAuthStore()

  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [bloodType, setBloodType] = useState<BloodType | null>(null)
  const [gender, setGender] = useState<Gender | null>(null)
  const [obraSocial, setObraSocial] = useState('')
  const [obraSocialNum, setObraSocialNum] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    // Validar nombre
    const name = fullName.trim()
    if (name.length < 2) {
      Alert.alert('Nombre requerido', 'Ingresá el nombre completo de la persona.')
      return
    }

    // Validar fecha si se ingresó
    if (birthDate.trim() && !isValidDate(birthDate.trim())) {
      Alert.alert('Fecha inválida', 'Usá el formato AAAA-MM-DD (ej: 1990-05-20).')
      return
    }

    // Validar sesión activa
    if (!session?.user?.id) {
      Alert.alert('Error', 'Tu sesión expiró. Volvé a iniciar sesión.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('persons').insert({
        owner_id: session.user.id,       // SIEMPRE del token, nunca del input
        full_name: name,
        birth_date: birthDate.trim() || null,
        blood_type: bloodType,
        gender: gender,
        obra_social: obraSocial.trim() || null,
        obra_social_num: obraSocialNum.trim() || null,
        notes: notes.trim() || null,
        is_emergency_visible: true,      // default seguro
      })

      if (error) throw new Error(error.message)

      // Invalidar cache para que Home y otras pantallas refresquen
      await queryClient.invalidateQueries({ queryKey: ['persons'] })
      await queryClient.invalidateQueries({ queryKey: ['persons_meds'] })
      await queryClient.invalidateQueries({ queryKey: ['persons_hist'] })

      Alert.alert('¡Listo!', `${name} fue agregado/a.`, [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      Alert.alert('Error al guardar', msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Nueva persona</Text>
        <Text style={styles.pageSubtitle}>Completá los datos básicos. Podés agregar más información después.</Text>

        {/* ── Nombre ── */}
        <View style={styles.field}>
          <Text style={styles.label}>Nombre completo <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Ej: María García"
            placeholderTextColor={COLORS.gray400}
            autoCapitalize="words"
            returnKeyType="next"
            maxLength={100}
          />
        </View>

        {/* ── Fecha de nacimiento ── */}
        <View style={styles.field}>
          <Text style={styles.label}>Fecha de nacimiento</Text>
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="AAAA-MM-DD (ej: 1990-05-20)"
            placeholderTextColor={COLORS.gray400}
            keyboardType="numeric"
            returnKeyType="next"
            maxLength={10}
          />
        </View>

        {/* ── Grupo sanguíneo ── */}
        <View style={styles.field}>
          <Text style={styles.label}>Grupo sanguíneo</Text>
          <View style={styles.chipRow}>
            {BLOOD_TYPES.map(bt => (
              <TouchableOpacity
                key={bt}
                style={[styles.chip, bloodType === bt && styles.chipSelected]}
                onPress={() => setBloodType(prev => prev === bt ? null : bt)}
              >
                <Text style={[styles.chipText, bloodType === bt && styles.chipTextSelected]}>
                  {bt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Sexo ── */}
        <View style={styles.field}>
          <Text style={styles.label}>Sexo</Text>
          <View style={styles.chipRow}>
            {GENDERS.map(g => (
              <TouchableOpacity
                key={g.value}
                style={[styles.chip, styles.chipWide, gender === g.value && styles.chipSelected]}
                onPress={() => setGender(prev => prev === g.value ? null : g.value)}
              >
                <Text style={[styles.chipText, gender === g.value && styles.chipTextSelected]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Obra Social ── */}
        <View style={styles.field}>
          <Text style={styles.label}>Obra social / Prepaga</Text>
          <TextInput
            style={styles.input}
            value={obraSocial}
            onChangeText={setObraSocial}
            placeholder="Ej: OSDE, Swiss Medical"
            placeholderTextColor={COLORS.gray400}
            autoCapitalize="words"
            returnKeyType="next"
            maxLength={100}
          />
        </View>

        {/* ── Número de afiliado ── */}
        <View style={styles.field}>
          <Text style={styles.label}>Número de afiliado</Text>
          <TextInput
            style={styles.input}
            value={obraSocialNum}
            onChangeText={setObraSocialNum}
            placeholder="Ej: 1234567-890"
            placeholderTextColor={COLORS.gray400}
            keyboardType="default"
            returnKeyType="next"
            maxLength={50}
          />
        </View>

        {/* ── Notas ── */}
        <View style={styles.field}>
          <Text style={styles.label}>Notas generales</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Observaciones urgentes, condiciones especiales…"
            placeholderTextColor={COLORS.gray400}
            multiline
            numberOfLines={3}
            maxLength={500}
            textAlignVertical="top"
          />
        </View>

        {/* ── Botones ── */}
        <TouchableOpacity
          style={[styles.btnSave, isSubmitting && styles.btnDisabled]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.btnSaveText}>Guardar persona</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnCancel}
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <Text style={styles.btnCancelText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 60 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: COLORS.gray500, marginBottom: 28, lineHeight: 20 },

  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  required: { color: COLORS.danger },

  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  inputMultiline: { minHeight: 90, paddingTop: 12 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  chipWide: { paddingHorizontal: 18 },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  chipTextSelected: { color: COLORS.white },

  btnSave: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.6 },
  btnSaveText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  btnCancel: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnCancelText: { color: COLORS.gray500, fontSize: 15, fontWeight: '600' },
})
