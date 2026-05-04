/**
 * app/(tabs)/historial.tsx — Historial médico
 * Eventos médicos, antecedentes y vacunas por persona
 */
import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/constants/theme'
import { Person, MedicalEvent, Antecedent, Vaccine } from '@/types/database'
import { AddEventModal } from '@/components/modals/AddEventModal'
import { AddAntecedentModal } from '@/components/modals/AddAntecedentModal'
import { AddVaccineModal } from '@/components/modals/AddVaccineModal'

async function fetchPersons(): Promise<Pick<Person, 'id' | 'full_name'>[]> {
  const { data, error } = await supabase
    .from('persons').select('id, full_name').order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
async function fetchEvents(personId: string): Promise<MedicalEvent[]> {
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

const TABS = ['Eventos', 'Antecedentes', 'Vacunas'] as const
type Tab = typeof TABS[number]

const EVENT_ICON: Record<string, string> = {
  consulta: '🩺', estudio: '🔬', internacion: '🏥',
  cirugia: '🔪', vacuna: '💉', otro: '📌',
}
const ANTECEDENT_ICON: Record<string, string> = {
  enfermedad: '🫀', cirugia: '🔪', accidente: '⚠️', otro: '📌',
}
const VACCINE_COLOR: Record<string, string> = {
  completa: COLORS.success, pendiente: COLORS.warning, vencida: COLORS.danger,
}

export default function HistorialScreen() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('Eventos')
  const [showEventModal, setShowEventModal] = useState(false)
  const [showAntecedentModal, setShowAntecedentModal] = useState(false)
  const [showVaccineModal, setShowVaccineModal] = useState(false)

  const personsQuery     = useQuery({ queryKey: ['persons_hist'], queryFn: fetchPersons })
  const eventsQuery      = useQuery({ queryKey: ['events', selectedId],      queryFn: () => fetchEvents(selectedId!),      enabled: !!selectedId })
  const antecedentsQuery = useQuery({ queryKey: ['antecedents', selectedId], queryFn: () => fetchAntecedents(selectedId!), enabled: !!selectedId })
  const vaccinesQuery    = useQuery({ queryKey: ['vaccines', selectedId],    queryFn: () => fetchVaccines(selectedId!),    enabled: !!selectedId })

  const persons     = personsQuery.data ?? []
  const events      = eventsQuery.data ?? []
  const antecedents = antecedentsQuery.data ?? []
  const vaccines    = vaccinesQuery.data ?? []

  const handleEventSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ['events', selectedId] })
    setShowEventModal(false)
    Alert.alert('✓ Guardado', 'Evento médico agregado correctamente.')
  }
  const handleAntecedentSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ['antecedents', selectedId] })
    setShowAntecedentModal(false)
    Alert.alert('✓ Guardado', 'Antecedente agregado correctamente.')
  }
  const handleVaccineSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ['vaccines', selectedId] })
    setShowVaccineModal(false)
    Alert.alert('✓ Guardado', 'Vacuna agregada correctamente.')
  }

  const openAddModal = () => {
    if (activeTab === 'Eventos') setShowEventModal(true)
    else if (activeTab === 'Antecedentes') setShowAntecedentModal(true)
    else setShowVaccineModal(true)
  }

  const isLoading = activeTab === 'Eventos' ? eventsQuery.isLoading
    : activeTab === 'Antecedentes' ? antecedentsQuery.isLoading
    : vaccinesQuery.isLoading

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.title}>Historial médico</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.personScroll}>
          {personsQuery.isLoading
            ? <ActivityIndicator color={COLORS.primary} />
            : persons.map(p => (
              <TouchableOpacity key={p.id}
                style={[s.chip, selectedId === p.id && s.chipSelected]}
                onPress={() => setSelectedId(p.id)}>
                <Text style={[s.chipText, selectedId === p.id && s.chipTextSelected]}>
                  {p.full_name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))
          }
        </ScrollView>

        {!selectedId && (
          <View style={s.hint}><Text style={s.hintText}>Seleccioná una persona para ver su historial</Text></View>
        )}

        {selectedId && (
          <>
            <View style={s.tabs}>
              {TABS.map(tab => (
                <TouchableOpacity key={tab}
                  style={[s.tab, activeTab === tab && s.tabActive]}
                  onPress={() => setActiveTab(tab)}>
                  <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {isLoading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />}

            {!isLoading && activeTab === 'Eventos' && (
              events.length === 0
                ? <Text style={s.empty}>Sin eventos registrados</Text>
                : events.map(e => (
                    <View key={e.id} style={s.card}>
                      <View style={s.cardHeader}>
                        <Text style={s.cardIcon}>{EVENT_ICON[e.type] ?? '📌'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.cardTitle}>{e.title}</Text>
                          <Text style={s.cardDate}>{e.date}</Text>
                        </View>
                      </View>
                      {e.description ? <Text style={s.cardBody}>{e.description}</Text> : null}
                      {e.doctor ? <Text style={s.cardSub}>Dr. {e.doctor}</Text> : null}
                      {e.institution ? <Text style={s.cardSub}>{e.institution}</Text> : null}
                    </View>
                  ))
            )}

            {!isLoading && activeTab === 'Antecedentes' && (
              antecedents.length === 0
                ? <Text style={s.empty}>Sin antecedentes registrados</Text>
                : antecedents.map(a => (
                    <View key={a.id} style={s.card}>
                      <View style={s.cardHeader}>
                        <Text style={s.cardIcon}>{ANTECEDENT_ICON[a.type] ?? '📌'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.cardTitle}>{a.description}</Text>
                          {a.year ? <Text style={s.cardDate}>Año: {a.year}</Text> : null}
                        </View>
                      </View>
                      {a.notes ? <Text style={s.cardBody}>{a.notes}</Text> : null}
                    </View>
                  ))
            )}

            {!isLoading && activeTab === 'Vacunas' && (
              vaccines.length === 0
                ? <Text style={s.empty}>Sin vacunas registradas</Text>
                : vaccines.map(v => (
                    <View key={v.id} style={s.card}>
                      <View style={s.cardHeader}>
                        <Text style={s.cardIcon}>💉</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.cardTitle}>{v.name}</Text>
                          {v.date_applied ? <Text style={s.cardDate}>Aplicada: {v.date_applied}</Text> : null}
                        </View>
                        <View style={[s.statusBadge, { backgroundColor: VACCINE_COLOR[v.status] ?? COLORS.gray400 }]}>
                          <Text style={s.statusText}>{v.status}</Text>
                        </View>
                      </View>
                      {v.next_dose ? <Text style={s.cardSub}>Próxima: {v.next_dose}</Text> : null}
                      {v.notes ? <Text style={s.cardBody}>{v.notes}</Text> : null}
                    </View>
                  ))
            )}
          </>
        )}
      </ScrollView>

      {selectedId && (
        <TouchableOpacity style={s.fab} onPress={openAddModal}>
          <Text style={s.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {selectedId && (
        <>
          <AddEventModal
            visible={showEventModal}
            personId={selectedId}
            onClose={() => setShowEventModal(false)}
            onSaved={handleEventSaved}
          />
          <AddAntecedentModal
            visible={showAntecedentModal}
            personId={selectedId}
            onClose={() => setShowAntecedentModal(false)}
            onSaved={handleAntecedentSaved}
          />
          <AddVaccineModal
            visible={showVaccineModal}
            personId={selectedId}
            onClose={() => setShowVaccineModal(false)}
            onSaved={handleVaccineSaved}
          />
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  personScroll: { marginBottom: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray200, marginRight: 8 },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  chipTextSelected: { color: COLORS.white },
  hint: { paddingVertical: 48, alignItems: 'center' },
  hintText: { fontSize: 14, color: COLORS.gray400, textAlign: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.gray100, borderRadius: 10, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  tabTextActive: { color: COLORS.primary },
  empty: { fontSize: 13, color: COLORS.gray400, textAlign: 'center', paddingVertical: 32 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardIcon: { fontSize: 20, marginTop: 2 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  cardDate: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  cardBody: { fontSize: 13, color: COLORS.gray500, marginTop: 6 },
  cardSub: { fontSize: 12, color: COLORS.gray500, marginTop: 4 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700', color: COLORS.white },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  fabText: { fontSize: 28, color: COLORS.white, lineHeight: 32 },
})
