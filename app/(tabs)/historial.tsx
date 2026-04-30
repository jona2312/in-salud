/**
 * app/(tabs)/historial.tsx — Historial médico
 * Eventos médicos, antecedentes y vacunas por persona
 */

import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/constants/theme'
import {
  Person, MedicalEvent, Antecedent, Vaccine,
  AntecedentType, MedicalEventType
} from '@/types/database'

async function fetchPersons(): Promise<Pick<Person, 'id' | 'full_name'>[]> {
  const { data, error } = await supabase
    .from('persons').select('id, full_name').order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

async function fetchMedicalEvents(personId: string): Promise<MedicalEvent[]> {
  const { data, error } = await supabase
    .from('medical_events').select('*').eq('person_id', personId)
    .order('date', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

async function fetchAntecedents(personId: string): Promise<Antecedent[]> {
  const { data, error } = await supabase
    .from('antecedents').select('*').eq('person_id', personId)
    .order('year', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

async function fetchVaccines(personId: string): Promise<Vaccine[]> {
  const { data, error } = await supabase
    .from('vaccines').select('*').eq('person_id', personId)
    .order('date_applied', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

type Tab = 'eventos' | 'antecedentes' | 'vacunas'

const EVENT_TYPE_ICON: Record<MedicalEventType, string> = {
  consulta: '🩺',
  estudio: '🔬',
  internacion: '🏥',
  cirugia: '🔪',
  vacuna: '💉',
  otro: '📌',
}

const ANTECEDENT_TYPE_LABEL: Record<AntecedentType, string> = {
  enfermedad: '🫀 Enfermedad',
  cirugia: '🔪 Cirugía',
  accidente: '⚠️ Accidente',
  otro: '📌 Otro',
}

export default function HistorialScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('eventos')

  const personsQuery = useQuery({ queryKey: ['persons_hist'], queryFn: fetchPersons })
  const eventsQuery = useQuery({
    queryKey: ['events', selectedId],
    queryFn: () => fetchMedicalEvents(selectedId!),
    enabled: !!selectedId && activeTab === 'eventos',
  })
  const antQuery = useQuery({
    queryKey: ['antecedents', selectedId],
    queryFn: () => fetchAntecedents(selectedId!),
    enabled: !!selectedId && activeTab === 'antecedentes',
  })
  const vaccineQuery = useQuery({
    queryKey: ['vaccines', selectedId],
    queryFn: () => fetchVaccines(selectedId!),
    enabled: !!selectedId && activeTab === 'vacunas',
  })

  const persons = personsQuery.data ?? []

  const formatDate = (d: string | null): string => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-AR', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Historial médico</Text>

      {/* Selector de persona */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.personScroll}>
        {personsQuery.isLoading
          ? <ActivityIndicator color={COLORS.primary} />
          : persons.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[styles.personChip, selectedId === p.id && styles.personChipSelected]}
              onPress={() => setSelectedId(p.id)}
            >
              <Text style={[styles.personChipText, selectedId === p.id && styles.personChipTextSelected]}>
                {p.full_name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))
        }
      </ScrollView>

      {!selectedId && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Seleccioná una persona para ver su historial</Text>
        </View>
      )}

      {selectedId && (
        <>
          {/* Tabs internos */}
          <View style={styles.tabs}>
            {(['eventos', 'antecedentes', 'vacunas'] as Tab[]).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Eventos médicos */}
          {activeTab === 'eventos' && (
            eventsQuery.isLoading
              ? <ActivityIndicator color={COLORS.primary} style={styles.loader} />
              : eventsQuery.data?.length === 0
              ? <EmptyState text="Sin eventos registrados" />
              : eventsQuery.data?.map(e => (
                <View key={e.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>{EVENT_TYPE_ICON[e.type] ?? '📌'}</Text>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.cardTitle}>{e.title}</Text>
                      <Text style={styles.cardDate}>{formatDate(e.date)}</Text>
                    </View>
                  </View>
                  {e.description ? <Text style={styles.cardBody}>{e.description}</Text> : null}
                  {e.doctor ? <Text style={styles.cardSub}>Dr/a. {e.doctor}</Text> : null}
                  {e.institution ? <Text style={styles.cardSub}>🏥 {e.institution}</Text> : null}
                  {e.notes ? <Text style={styles.cardNotes}>{e.notes}</Text> : null}
                </View>
              ))
          )}

          {/* Antecedentes */}
          {activeTab === 'antecedentes' && (
            antQuery.isLoading
              ? <ActivityIndicator color={COLORS.primary} style={styles.loader} />
              : antQuery.data?.length === 0
              ? <EmptyState text="Sin antecedentes registrados" />
              : antQuery.data?.map(a => (
                <View key={a.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.antType}>{ANTECEDENT_TYPE_LABEL[a.type]}</Text>
                      {a.year ? <Text style={styles.cardDate}>{a.year}</Text> : null}
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{a.description}</Text>
                  {a.notes ? <Text style={styles.cardNotes}>{a.notes}</Text> : null}
                </View>
              ))
          )}

          {/* Vacunas */}
          {activeTab === 'vacunas' && (
            vaccineQuery.isLoading
              ? <ActivityIndicator color={COLORS.primary} style={styles.loader} />
              : vaccineQuery.data?.length === 0
              ? <EmptyState text="Sin vacunas registradas" />
              : vaccineQuery.data?.map(v => (
                <View key={v.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>💉</Text>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.cardTitle}>{v.name}</Text>
                      <Text style={styles.cardDate}>{formatDate(v.date_applied)}</Text>
                    </View>
                    <View style={[styles.statusBadge, {
                      backgroundColor:
                        v.status === 'completa' ? COLORS.success
                        : v.status === 'pendiente' ? COLORS.warning
                        : COLORS.danger,
                    }]}>
                      <Text style={styles.statusText}>{v.status}</Text>
                    </View>
                  </View>
                  {v.next_dose ? <Text style={styles.cardFollowUp}>📅 Próxima: {formatDate(v.next_dose)}</Text> : null}
                  {v.notes ? <Text style={styles.cardNotes}>{v.notes}</Text> : null}
                </View>
              ))
          )}
        </>
      )}
    </ScrollView>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  personScroll: { marginBottom: 16 },
  personChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1.5,
    borderColor: COLORS.gray200, marginRight: 8,
  },
  personChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  personChipText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  personChipTextSelected: { color: COLORS.white },
  hint: { paddingVertical: 48, alignItems: 'center' },
  hintText: { fontSize: 14, color: COLORS.gray400, textAlign: 'center' },
  tabs: {
    flexDirection: 'row', backgroundColor: COLORS.gray100,
    borderRadius: 12, padding: 4, marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 2, elevation: 1,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  tabTextActive: { color: COLORS.primary },
  loader: { marginTop: 24 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  cardIcon: { fontSize: 20, marginRight: 10, marginTop: 2 },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardDate: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  cardBody: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  cardSub: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  cardNotes: { fontSize: 12, color: COLORS.gray400, marginTop: 4, fontStyle: 'italic' },
  cardFollowUp: { fontSize: 12, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  antType: { fontSize: 13, fontWeight: '600', color: COLORS.primary, marginBottom: 4 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: '700', color: COLORS.white, textTransform: 'capitalize' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.gray500, textAlign: 'center' },
})
