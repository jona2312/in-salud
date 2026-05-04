/**
 * app/(tabs)/editar-persona.tsx — Edición de datos de una persona + foto de perfil
 *
 * SEGURIDAD:
 * - Solo el owner puede editar (RLS en Supabase lo garantiza)
 * - La foto se sube a Storage con path: avatars/{user_id}/{person_id}.jpg
 * - No se expone el path completo al cliente, solo se guarda en avatar_url
 * - owner_id nunca se modifica desde el cliente
 *
 * STORAGE: Requiere bucket "avatars" en Supabase con política:
 *   INSERT/UPDATE/SELECT solo para usuarios autenticados cuyo uid == carpeta
 */

import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, ScrollView, StyleSheet, Image,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { COLORS } from '@/constants/theme'
import { BloodType, Gender, Person } from '@/types/database'

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENDERS: { value: Gender; label: string }[] = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
]

function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(s)
  return !isNaN(d.getTime()) && d.getFullYear() >= 1900 && d <= new Date()
}

function parseBP(val: string): number | null {
  const n = parseInt(val.trim(), 10)
  return (!isNaN(n) && n > 0 && n < 300) ? n : null
}

export default function EditarPersonaScreen() {
  const { id: personId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { session } = useAuthStore()

  // Estado del formulario
  const [isLoading, setIsLoading]         = useState(true)
  const [isSubmitting, setIsSubmitting]   = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [avatarUrl, setAvatarUrl]         = useState<string | null>(null)
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null)

  const [fullName, setFullName]           = useState('')
  const [birthDate, setBirthDate]         = useState('')
  const [bloodType, setBloodType]         = useState<BloodType | null>(null)
  const [gender, setGender]               = useState<Gender | null>(null)
  const [obraSocial, setObraSocial]       = useState('')
  const [obraSocialNum, setObraSocialNum] = useState('')
  const [obraSocialPlan, setObraSocialPlan] = useState('')
  const [obraSocialExpiry, setObraSocialExpiry] = useState('')
  const [bpSystolic, setBpSystolic]       = useState('')
  const [bpDiastolic, setBpDiastolic]     = useState('')
  const [notes, setNotes]                 = useState('')

  // Cargar datos existentes
  useEffect(() => {
    if (!personId) return
    const load = async () => {
      const { data, error } = await supabase
        .from('persons').select('*').eq('id', personId).single()
      if (error || !data) {
        Alert.alert('Error', 'No se pudo cargar la persona.')
        router.back()
        return
      }
      const p = data as Person
      setFullName(p.full_name)
      setBirthDate(p.birth_date ?? '')
      setBloodType(p.blood_type ?? null)
      setGender(p.gender ?? null)
      setObraSocial(p.obra_social ?? '')
      setObraSocialNum(p.obra_social_num ?? '')
      setObraSocialPlan((p as any).obra_social_plan ?? '')
      setObraSocialExpiry((p as any).obra_social_expiry ?? '')
      setBpSystolic(p.bp_systolic?.toString() ?? '')
      setBpDiastolic(p.bp_diastolic?.toString() ?? '')
      setNotes(p.notes ?? '')
      setAvatarUrl(p.avatar_url ?? null)
      setIsLoading(false)
    }
    load()
  }, [personId])

  // Selección de foto
  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar la foto.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      setLocalPhotoUri(result.assets[0].uri)
    }
  }

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para tomar la foto.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      setLocalPhotoUri(result.assets[0].uri)
    }
  }

  const showPhotoOptions = () => {
    Alert.alert('Foto de perfil', 'Elegí una opción', [
      { text: 'Cámara', onPress: takePhoto },
      { text: 'Galería', onPress: pickPhoto },
      { text: 'Cancelar', style: 'cancel' },
    ])
  }

  // Subir foto a Supabase Storage
  const uploadPhoto = async (uri: string, userId: string, pId: string): Promise<string | null> => {
    try {
      setIsUploadingPhoto(true)
      const response = await fetch(uri)
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      const filePath = `${userId}/${pId}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, uint8Array, {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      return data.publicUrl
    } catch (err) {
      console.error('Error subiendo foto:', err)
      return null
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    const name = fullName.trim()
    if (name.length < 2) {
      Alert.alert('Nombre requerido', 'Ingresá el nombre completo de la persona.')
      return
    }

    if (birthDate.trim() && !isValidDate(birthDate.trim())) {
      Alert.alert('Fecha inválida', 'Usá el formato AAAA-MM-DD (ej: 1990-05-20).')
      return
    }

    const sys = bpSystolic.trim() ? parseBP(bpSystolic) : null
    const dia = bpDiastolic.trim() ? parseBP(bpDiastolic) : null
    if ((bpSystolic.trim() && sys === null) || (bpDiastolic.trim() && dia === null)) {
      Alert.alert('Presión inválida', 'Ingresá valores numéricos válidos (ej: 120 / 80).')
      return
    }

    if (!session?.user?.id) {
      Alert.alert('Error', 'Tu sesión expiró. Volvé a iniciar sesión.')
      return
    }

    setIsSubmitting(true)
    try {
      // Subir foto si hay una nueva
      let newAvatarUrl = avatarUrl
      if (localPhotoUri) {
        const uploaded = await uploadPhoto(localPhotoUri, session.user.id, personId!)
        if (uploaded) {
          newAvatarUrl = uploaded
        } else {
          Alert.alert('Foto no guardada', 'No se pudo subir la foto, pero el resto de los datos sí se guardará.')
        }
      }

      const { error } = await supabase.from('persons').update({
        full_name:         name,
        birth_date:        birthDate.trim() || null,
        blood_type:        bloodType,
        gender:            gender,
        obra_social:       obraSocial.trim() || null,
        obra_social_num: obraSocialNum.trim() || null,
        obra_social_plan:  obraSocialPlan.trim() || null,
        obra_social_expiry: obraSocialExpiry.trim() || null,
        bp_systolic:       sys,
        bp_diastolic:      dia,
        notes:             notes.trim() || null,
        avatar_url:        newAvatarUrl,
      }).eq('id', personId!)

      if (error) throw new Error(error.message)

      // Invalidar todos los queries que usan datos de personas
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['persons'] }),
        queryClient.invalidateQueries({ queryKey: ['persons_sos'] }),
        queryClient.invalidateQueries({ queryKey: ['persons_meds'] }),
        queryClient.invalidateQueries({ queryKey: ['persons_hist'] }),
        queryClient.invalidateQueries({ queryKey: ['person', personId] }),
      ])

      Alert.alert('Listo', `Los datos de ${name} fueron actualizados.`, [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      Alert.alert('Error al guardar', msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  const photoSource = localPhotoUri ?? avatarUrl
  const initials = fullName.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Editar persona</Text>

        {/* Foto de perfil */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={showPhotoOptions}>
            {photoSource ? (
              <Image source={{ uri: photoSource }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarEdit}>
              <Text style={styles.avatarEditIcon}>📷</Text>
            </View>
            {isUploadingPhoto && (
              <View style={styles.avatarUploading}>
                <ActivityIndicator color={COLORS.white} size="small" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tocá para cambiar la foto</Text>
        </View>

        {/* Nombre */}
        <View style={styles.field}>
          <Text style={styles.label}>Nombre completo <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input} value={fullName} onChangeText={setFullName}
            placeholder="Ej: María García" placeholderTextColor={COLORS.gray400}
            autoCapitalize="words" maxLength={100}
          />
        </View>

        {/* Fecha de nacimiento */}
        <View style={styles.field}>
          <Text style={styles.label}>Fecha de nacimiento</Text>
          <TextInput
            style={styles.input} value={birthDate} onChangeText={setBirthDate}
            placeholder="AAAA-MM-DD" placeholderTextColor={COLORS.gray400}
            keyboardType="numeric" maxLength={10}
          />
        </View>

        {/* Grupo sanguíneo */}
        <View style={styles.field}>
          <Text style={styles.label}>Grupo sanguíneo</Text>
          <View style={styles.chipRow}>
            {BLOOD_TYPES.map(bt => (
              <TouchableOpacity
                key={bt}
                style={[styles.chip, bloodType === bt && styles.chipSelected]}
                onPress={() => setBloodType(prev => prev === bt ? null : bt)}
              >
                <Text style={[styles.chipText, bloodType === bt && styles.chipTextSelected]}>{bt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sexo */}
        <View style={styles.field}>
          <Text style={styles.label}>Sexo</Text>
          <View style={styles.chipRow}>
            {GENDERS.map(g => (
              <TouchableOpacity
                key={g.value}
                style={[styles.chip, styles.chipWide, gender === g.value && styles.chipSelected]}
                onPress={() => setGender(prev => prev === g.value ? null : g.value)}
              >
                <Text style={[styles.chipText, gender === g.value && styles.chipTextSelected]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Presión arterial habitual */}
        <View style={styles.field}>
          <Text style={styles.label}>Presión arterial habitual</Text>
          <Text style={styles.sublabel}>El valor normal típico es 120/80 mmHg</Text>
          <View style={styles.bpRow}>
            <TextInput
              style={[styles.input, styles.bpInput]} value={bpSystolic} onChangeText={setBpSystolic}
              placeholder="Sistólica" placeholderTextColor={COLORS.gray400}
              keyboardType="numeric" maxLength={3}
            />
            <Text style={styles.bpSeparator}>/</Text>
            <TextInput
              style={[styles.input, styles.bpInput]} value={bpDiastolic} onChangeText={setBpDiastolic}
              placeholder="Diastólica" placeholderTextColor={COLORS.gray400}
              keyboardType="numeric" maxLength={3}
            />
            <Text style={styles.bpUnit}>mmHg</Text>
          </View>
        </View>

        {/* Sección Obra Social */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>Cobertura médica</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Obra social / Prepaga</Text>
          <TextInput
            style={styles.input} value={obraSocial} onChangeText={setObraSocial}
            placeholder="Ej: OSDE, Swiss Medical, IOMA"
            placeholderTextColor={COLORS.gray400} autoCapitalize="words" maxLength={100}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Plan</Text>
          <TextInput
            style={styles.input} value={obraSocialPlan} onChangeText={setObraSocialPlan}
            placeholder="Ej: 310, 210, Gold"
            placeholderTextColor={COLORS.gray400} maxLength={50}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Número de afiliado</Text>
          <TextInput
            style={styles.input} value={obraSocialNum} onChangeText={setObraSocialNum}
            placeholder="Ej: 1234567-890"
            placeholderTextColor={COLORS.gray400} maxLength={50}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Vencimiento del carnet</Text>
          <TextInput
            style={styles.input} value={obraSocialExpiry} onChangeText={setObraSocialExpiry}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={COLORS.gray400} keyboardType="numeric" maxLength={10}
          />
        </View>

        {/* Notas urgentes */}
        <View style={styles.field}>
          <Text style={styles.label}>Notas urgentes</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]} value={notes} onChangeText={setNotes}
            placeholder="Observaciones críticas, condiciones especiales…"
            placeholderTextColor={COLORS.gray400} multiline numberOfLines={3}
            maxLength={500} textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.btnSave, isSubmitting && styles.btnDisabled]}
          onPress={handleSave} disabled={isSubmitting}
        >
          {isSubmitting
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.btnSaveText}>Guardar cambios</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnCancel} onPress={() => router.back()} disabled={isSubmitting}>
          <Text style={styles.btnCancelText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 60 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 24 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: { position: 'relative', width: 100, height: 100, marginBottom: 8 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.gray200 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 36, fontWeight: '800', color: COLORS.white },
  avatarEdit: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.gray200,
  },
  avatarEditIcon: { fontSize: 15 },
  avatarUploading: {
    position: 'absolute', inset: 0, borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  avatarHint: { fontSize: 13, color: COLORS.gray400 },

  // Sección divider
  sectionDivider: {
    borderTopWidth: 1, borderTopColor: COLORS.gray200,
    paddingTop: 20, marginBottom: 16, marginTop: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  // Campos
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  sublabel: { fontSize: 12, color: COLORS.gray400, marginBottom: 8, marginTop: -4 },
  required: { color: COLORS.danger },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1.5,
    borderColor: COLORS.gray200, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16, color: COLORS.text,
  },
  inputMultiline: { minHeight: 90, paddingTop: 12 },

  bpRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bpInput: { flex: 1 },
  bpSeparator: { fontSize: 24, fontWeight: '300', color: COLORS.gray400 },
  bpUnit: { fontSize: 13, color: COLORS.gray500, fontWeight: '600', marginLeft: 4 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray200 },
  chipWide: { paddingHorizontal: 18 },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  chipTextSelected: { color: COLORS.white },

  btnSave: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  btnDisabled: { opacity: 0.6 },
  btnSaveText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  btnCancel: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnCancelText: { color: COLORS.gray500, fontSize: 15, fontWeight: '600' },
})
