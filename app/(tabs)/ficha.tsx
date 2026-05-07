/**
 * app/(tabs)/ficha.tsx — Ficha clínica de una persona
 *
 * Recibe el parámetro ?id= desde Home.
 * Accesos rápidos a Medicamentos, Historial, Vitales y Turnos
 * (que ya no están en el tab bar).
 *
 * SEGURIDAD:
 * - RLS garantiza que solo el owner puede ver estos datos
 * - No se permite edición directa aquí (va a editar-persona)
 */

import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, Image,
  ActivityIndicator, TouchableOpacity, Alert
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/constants/theme'
import { Person, Allergy, Medication, EmergencyContact } from '@/types/database'
import { AddAllergyModal } from '@/components/modals/AddAllergyModal'
import { AddContactModal } from '@/components/modals/AddContactModal'

async function fetchPerson(id: string): Promise<Person | null> {
  const { data, error } = await supabase.from('persons').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}
async function fetchAllergies(personId: string): Promise<Allergy[]> {
  const { data, error } = await supabase
    .from('allergies').select('*').eq('person_id', personId).order('severity')
  if (error) throw new Error(error.message)
  return data ?? []
}
async function fetchMedications(personId: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications').select('*').eq('person_id', personId).eq('is_active', true).order('type')
  if (error) throw new Error(error.message)
  return data ?? []
}
async function fetchContacts(personId: string): Promise<EmergencyContact[]> {
  const { data, error } = await supabase
    .from('emergency_contacts').select('*').eq('person_id', personId)
    .order('is_primary', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

const SEVERITY_CONFIG = {
  grave:    { label: 'GRAVE',    color: COLORS.danger  },
  moderada: { label: 'MODERADA', color: COLORS.warning },
  leve:     { label: 'LEVE',     color: COLORS.success },
}
const MED_TYPE_LABEL: Record<string, string> = {
  prohibido: '🚫 Prohibido', rescate: '🆘 Rescate',
  diario: '💊 Diario', suplemento: '🌿 Suplemento',
}

export default function FichaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showAllergyModal, setShowAllergyModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const personQuery  = useQuery({ queryKey: ['person', id],      queryFn: () => fetchPerson(id!),      enabled: !!id })
  const allergyQuery = useQuery({ queryKey: ['allergies', id],   queryFn: () => fetchAllergies(id!),   enabled: !!id })
  const medsQuery    = useQuery({ queryKey: ['medications', id], queryFn: () => fetchMedications(id!), enabled: !!id })
  const contactQuery = useQuery({ queryKey: ['contacts', id],    queryFn: () => fetchContacts(id!),    enabled: !!id })

  const person    = personQuery.data
  const allergies = allergyQuery.data ?? []
  const meds      = medsQuery.data ?? []
  const contacts  = contactQuery.data ?? []

  const handleAllergySaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ['allergies', id] })
    await queryClient.invalidateQueries({ queryKey: ['critical', id] })
    setShowAllergyModal(false)
    Alert.alert('✓ Guardado', 'Alergia agregada correctamente.')
  }
  const handleContactSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ['contacts', id] })
    await queryClient.invalidateQueries({ queryKey: ['critical', id] })
    setShowContactModal(false)
    Alert.alert('✓ Guardado', 'Contacto agregado correctamente.')
  }

  if (!id) {
    return (
      <View style={s.center}>
        <Text style={s.hint}>Seleccioná una persona desde Inicio</Text>
      </View>
    )
  }

  if (personQuery.isLoading) {
    return <ActivityIndicator style={s.center} color={COLORS.primary} size="large" />
  }

  const age = person?.birth_date
    ? Math.floor((Date.now() - new Date(person.birth_date).getTime()) / 31_557_600_000)
    : null

  const obraSocialPlan = (person as any)?.obra_social_plan as string | null

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backText}>← Inicio</Text>
        </TouchableOpacity>

        {/* Header con avatar y datos básicos */}
        {person && (
          <View style={s.header}>
            <View style={s.avatar}>
              {person.avatar_url ? (
                <Image source={{ uri: person.avatar_url }} style={s.avatarImage} />
              ) : (
                <Text style={s.avatarText}>{person.full_name[0]}</Text>
              )}
            </View>
            <View style={s.headerInfo}>
              <Text style={s.name}>{person.full_name}</Text>
              {age !== null && <Text style={s.sub}>{age} años</Text>}
              {person.blood_type && <Text style={s.blood}>🩸 {person.blood_type}</Text>}
              {person.obra_social && (
                <Text style={s.sub}>
                  🏥 {person.obra_social}
                  {obraSocialPlan ? ` · Plan ${obraSocialPlan}` : ''}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={s.editBtn}
              onPress={() => router.push(`/(tabs)/editar-persona?id=${id}`)}
            >
              <Text style={s.editBtnText}>✏️</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Accesos rápidos a pantallas secundarias */}
        <View style={s.quickActions}>
          <TouchableOpacity
            style={s.quickBtn}
            onPress={() => router.push(`/(tabs)/medicamentos?id=${id}`)}
          >
            <Text style={s.quickBtnIcon}>💊</Text>
            <Text style={s.quickBtnLabel}>Medicación</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.quickBtn}
            onPress={() => router.push(`/(tabs)/historial?id=${id}`)}
          >
            <Text style={s.quickBtnIcon}>📋</Text>
            <Text style={s.quickBtnLabel}>Historial</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.quickBtn}
            onPress={() => router.push(`/(tabs)/vitales?id=${id}`)}
          >
            <Text style={s.quickBtnIcon}>❤️</Text>
            <Text style={s.quickBtnLabel}>Vitales</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.quickBtn}
            onPress={() => router.push(`/(tabs)/turnos?id=${id}`)}
          >
            <Text style={s.quickBtnIcon}>📅</Text>
            <Text style={s.quickBtnLabel}>Turnos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.quickBtn}
            onPress={() => router.push(`/(tabs)/documentos?id=${id}`)}
          >
            <Text style={s.quickBtnIcon}>📁</Text>
            <Text style={s.quickBtnLabel}>Documentos</Text>
          </TouchableOpacity>
        </View>

        {/* Alergias */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Alergias</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => setShowAllergyModal(true)}>
              <Text style={s.addBtnText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
          {allergyQuery.isLoading
            ? <ActivityIndicator color={COLORS.primary} />
            : allergies.length === 0
              ? <Text style={s.empty}>Sin alergias registradas</Text>
              : allergies.map(a => {
                  const cfg = SEVERITY_CONFIG[a.severity as keyof typeof SEVERITY_CONFIG]
                  return (
                    <View key={a.id} style={s.row}>
                      <Text style={s.rowMain}>{a.name}</Text>
                      <View style={[s.badge, { backgroundColor: cfg?.color ?? COLORS.gray400 }]}>
                        <Text style={s.badgeText}>{cfg?.label ?? a.severity}</Text>
                      </View>
                    </View>
                  )
                })
          }
        </View>

        {/* Medicación activa */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Medicación activa</Text>
          {medsQuery.isLoading
            ? <ActivityIndicator color={COLORS.primary} />
            : meds.length === 0
              ? <Text style={s.empty}>Sin medicación activa</Text>
              : meds.map(m => (
                  <View key={m.id} style={s.row}>
                    <Text style={s.rowMain}>{m.name}{m.dose ? ` — ${m.dose}` : ''}</Text>
                    <Text style={s.rowSub}>{MED_TYPE_LABEL[m.type] ?? m.type}</Text>
                  </View>
                ))
          }
        </View>

        {/* Contactos de emergencia */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Contactos de emergencia</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => setShowContactModal(true)}>
              <Text style={s.addBtnText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
          {contactQuery.isLoading
            ? <ActivityIndicator color={COLORS.primary} />
            : contacts.length === 0
              ? <Text style={s.empty}>Sin contactos registrados</Text>
              : contacts.map(c => (
                  <View key={c.id} style={s.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowMain}>{c.name}{c.is_primary ? ' ⭐' : ''}</Text>
                      {c.specialty && <Text style={s.rowSub}>{c.specialty}</Text>}
                      {c.phone && <Text style={s.rowSub}>📞 {c.phone}</Text>}
                    </View>
                  </View>
                ))
          }
        </View>
      </ScrollView>

      {/* Modales */}
      {id && (
        <>
          <AddAllergyModal
            visible={showAllergyModal}
            personId={id}
            onClose={() => setShowAllergyModal(false)}
            onSaved={handleAllergySaved}
          />
          <AddContactModal
            visible={showContactModal}
            personId={id}
            onClose={() => setShowContactModal(false)}
            onSaved={handleContactSaved}
          />
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint: { fontSize: 14, color: COLORS.gray400 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 14, padding: 16, marginBottom: 12, gap: 14,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  avatarText: { fontSize: 24, color: COLORS.white, fontWeight: '700' },
  headerInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  sub: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  blood: { fontSize: 13, color: COLORS.danger, marginTop: 2, fontWeight: '600' },
  editBtn: { padding: 8 },
  editBtnText: { fontSize: 20 },

  // Accesos rápidos
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  quickBtn: {
    width: '18%', minWidth: 60, flexGrow: 1,
    backgroundColor: COLORS.white, borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.gray200,
  },
  quickBtnIcon: { fontSize: 22, marginBottom: 4 },
  quickBtnLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray500, textAlign: 'center' },

  // Secciones
  section: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  addBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  empty: { fontSize: 13, color: COLORS.gray400, textAlign: 'center', paddingVertical: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, bord