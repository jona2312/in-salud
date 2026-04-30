/**
 * app/(tabs)/ficha.tsx — Ficha clínica de una persona
 * Recibe el parámetro ?id= desde Home
 */

import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/constants/theme'
import {
  Person, Allergy, Medication, EmergencyContact,
  AllergySeverity, MedicationType
} from '@/types/database'

async function fetchPerson(id: string): Promise<Person | null> {
  const { data, error } = await supabase
    .from('persons').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}

async function fetchAllergies(personId: string): Promise<Allergy[]> {
  const { data, error } = await supabase
    .from('allergies').select('*').eq('person_id', personId)
    .order('severity', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

async function fetchMedications(personId: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications').select('*').eq('person_id', personId)
    .eq('is_active', true).order('type')
  if (error) throw new Error(error.message)
  return data ?? []
}

async function fetchEmergencyContacts(personId: string): Promise<EmergencyContact[]> {
  const { data, error } = await supabase
    .from('emergency_contacts').select('*').eq('person_id', personId)
    .order('is_primary', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

const SEVERITY_COLOR: Record<AllergySeverity, string> = {
  leve: COLORS.severityLeve,
  moderada: COLORS.severityModerada,
  grave: COLORS.severityGrave,
}

const MED_TYPE_COLOR: Record<MedicationType, string> = {
  diario: COLORS.medDaily,
  suplemento: COLORS.medSupplement,
  rescate: COLORS.medRescue,
  prohibido: COLORS.medForbidden,
}

const MED_TYPE_LABEL: Record<MedicationType, string> = {
  diario: 'Diario',
  suplemento: 'Suplemento',
  rescate: '🆘 Rescate',
  prohibido: '🚫 Prohibido',
}

export default function FichaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const personQuery = useQuery({
    queryKey: ['person', id],
    queryFn: () => fetchPerson(id!),
    enabled: !!id,
  })
  const allergiesQuery = useQuery({
    queryKey: ['allergies', id],
    queryFn: () => fetchAllergies(id!),
    enabled: !!id,
  })
  const medsQuery = useQuery({
    queryKey: ['medications', id],
    queryFn: () => fetchMedications(id!),
    enabled: !!id,
  })
  const contactsQuery = useQuery({
    queryKey: ['emergency_contacts', id],
    queryFn: () => fetchEmergencyContacts(id!),
    enabled: !!id,
  })

  if (!id) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Seleccioná una persona desde Familia</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Ir a Familia</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (personQuery.isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
  }

  const person = personQuery.data
  if (!person) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Persona no encontrada</Text>
      </View>
    )
  }

  const getAge = (birthDate: string | null): string => {
    if (!birthDate) return '—'
    const years = Math.floor(
      (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    )
    return `${years} años`
  }

  const bpText = person.bp_systolic && person.bp_diastolic
    ? `${person.bp_systolic}/${person.bp_diastolic}`
    : '—'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header persona */}
      <View style={styles.personHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{person.full_name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.personInfo}>
          <Text style={styles.personName}>{person.full_name}</Text>
          <Text style={styles.personMeta}>
            {getAge(person.birth_date)}{person.obra_social ? ` · ${person.obra_social}` : ''}
          </Text>
        </View>
      </View>

      {/* Datos críticos */}
      <View style={styles.criticalRow}>
        <View style={styles.criticalBadge}>
          <Text style={styles.criticalLabel}>Sangre</Text>
          <Text style={styles.criticalValue}>{person.blood_type ?? '—'}</Text>
        </View>
        <View style={styles.criticalBadge}>
          <Text style={styles.criticalLabel}>PA habitual</Text>
          <Text style={styles.criticalValue}>{bpText}</Text>
        </View>
        <View style={styles.criticalBadge}>
          <Text style={styles.criticalLabel}>Género</Text>
          <Text style={styles.criticalValue}>{person.gender ?? '—'}</Text>
        </View>
      </View>

      {/* Notas urgentes */}
      {person.notes ? (
        <View style={styles.urgentBox}>
          <Text style={styles.urgentLabel}>⚠️ Notas importantes</Text>
          <Text style={styles.urgentText}>{person.notes}</Text>
        </View>
      ) : null}

      {/* Alergias */}
      <Section title="Alergias">
        {allergiesQuery.isLoading
          ? <ActivityIndicator color={COLORS.primary} />
          : allergiesQuery.data?.length === 0
          ? <EmptyItem text="Sin alergias registradas" />
          : allergiesQuery.data?.map((a) => (
            <View key={a.id} style={styles.listItem}>
              <View style={[styles.dot, { backgroundColor: SEVERITY_COLOR[a.severity] }]} />
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{a.name}</Text>
                <Text style={styles.listItemSub}>
                  {a.severity}{a.notes ? ` · ${a.notes}` : ''}
                </Text>
              </View>
            </View>
          ))
        }
      </Section>

      {/* Medicación activa */}
      <Section title="Medicación activa">
        {medsQuery.isLoading
          ? <ActivityIndicator color={COLORS.primary} />
          : medsQuery.data?.length === 0
          ? <EmptyItem text="Sin medicación registrada" />
          : medsQuery.data?.map((m) => (
            <View key={m.id} style={styles.listItem}>
              <View style={[styles.dot, { backgroundColor: MED_TYPE_COLOR[m.type] }]} />
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>
                  {m.name}{m.dose ? ` · ${m.dose}` : ''}
                </Text>
                <Text style={styles.listItemSub}>
                  {MED_TYPE_LABEL[m.type]}{m.frequency ? ` · ${m.frequency}` : ''}
                </Text>
              </View>
            </View>
          ))
        }
      </Section>

      {/* Contactos de emergencia */}
      <Section title="Contactos de emergencia">
        {contactsQuery.isLoading
          ? <ActivityIndicator color={COLORS.primary} />
          : contactsQuery.data?.length === 0
          ? <EmptyItem text="Sin contactos registrados" />
          : contactsQuery.data?.map((c) => (
            <View key={c.id} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>
                  {c.name}{c.is_primary ? ' ⭐' : ''}
                </Text>
                <Text style={styles.listItemSub}>
                  {c.type}{c.phone ? ` · ${c.phone}` : ''}
                  {c.specialty ? ` · ${c.specialty}` : ''}
                </Text>
              </View>
            </View>
          ))
        }
      </Section>
    </ScrollView>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  )
}

function EmptyItem({ text }: { text: string }) {
  return <Text style={styles.emptyItem}>{text}</Text>
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  personHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 20,
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center', marginRight: 16,
  },
  avatarInitial: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  personInfo: { flex: 1 },
  personName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  personMeta: { fontSize: 14, color: COLORS.gray500, marginTop: 2 },
  criticalRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  criticalBadge: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12,
    padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  criticalLabel: {
    fontSize: 11, color: COLORS.gray400, marginBottom: 4,
    textTransform: 'uppercase', fontWeight: '600',
  },
  criticalValue: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  urgentBox: {
    backgroundColor: '#FEF3C7', borderRadius: 12,
    padding: 14, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.warning,
  },
  urgentLabel: { fontSize: 13, fontWeight: '700', color: COLORS.warning, marginBottom: 4 },
  urgentText: { fontSize: 14, color: COLORS.text },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  sectionContent: {
    backgroundColor: COLORS.white, borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  listItemContent: { flex: 1 },
  listItemTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  listItemSub: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  emptyItem: { fontSize: 14, color: COLORS.gray400, padding: 14, fontStyle: 'italic' },
  emptyText: { fontSize: 15, color: COLORS.gray500, marginBottom: 16, textAlign: 'center' },
  backButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.primary },
  backButtonText: { color: COLORS.white, fontWeight: '600' },
})
