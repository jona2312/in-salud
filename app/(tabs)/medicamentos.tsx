/**
 * app/(tabs)/medicamentos.tsx — Gestión de medicación
 * Vista por persona con FAB para agregar medicamentos
 */
/**
 * SEGURIDAD: RLS garantiza que solo el owner accede a sus datos.
 * owner_id nunca se acepta del cliente.
 */
import { useState, useMemo } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/constants/theme'
import { Person, Medication, MedicationType, MedicationLog } from '@/types/database'
import { AddMedModal } from '@/components/modals/AddMedModal'

async function fetchPersons(): Promise<Pick<Person, 'id' | 'full_name' | 'birth_date'>[]> {
  const { data, error } = await supabase
    .from('persons').select('id, full_name, birth_date').order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

async function fetchMedications(personId: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications').select('*').eq('person_id', personId).order('type')
  if (error) throw new Error(error.message)
  return data ?? []
}

const TYPE_CONFIG: Record<MedicationType, { label: string; color: string; icon: string }> = {
  prohibido:  { label: 'Medicamentos PROHIBIDOS', color: COLORS.medForbidden, icon: '🚫' },
  rescate:    { label: 'Medicación de rescate',   color: COLORS.medRescue,    icon: '🆘' },
  diario:     { label: 'Medicación diaria',        color: COLORS.medDaily,     icon: '💊' },
  suplemento: { label: 'Suplementos',              color: COLORS.medSupplement,icon: '🌿' },
}
const TYPE_ORDER: MedicationType[] = ['prohibido', 'rescate', 'diario', 'suplemento']
const LOGGABLE: MedicationType[] = ['diario', 'rescate']

async function fetchTodayLogs(personId: string): Promise<MedicationLog[]> {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('medication_logs').select('*')
    .eq('person_id', personId).eq('date', today)
    .order('taken_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

async function logMedTake(medicationId: string, personId: string): Promise<void> {
  const now = new Date()
  const { error } = await supabase.from('medication_logs').insert({
    medication_id: medicationId,
    person_id: personId,
    taken_at: now.toISOString(),
    date: now.toISOString().slice(0, 10),
  })
  if (error) throw new Error(error.message)
}

export default function MedicamentosScreen() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const personsQuery = useQuery({ queryKey: ['persons_meds'], queryFn: fetchPersons })
  const medsQuery = useQuery({
    queryKey: ['all_meds', selectedId],
    queryFn: () => fetchMedications(selectedId!),
    enabled: !!selectedId,
  })
  const logsQuery = useQuery({
    queryKey: ['today_logs', selectedId],
    queryFn: () => fetchTodayLogs(selectedId!),
    enabled: !!selectedId,
  })
  const logMutation = useMutation({
    mutationFn: ({ medId, pid }: { medId: string; pid: string }) => logMedTake(medId, pid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['today_logs', selectedId] }),
    onError: (e: any) => Alert.alert('Error', e.message),
  })

  const persons = personsQuery.data ?? []
  const selectedPerson = persons.find(p => p.id === selectedId)
  const meds = medsQuery.data ?? []
  const todayLogs = logsQuery.data ?? []
  const takesToday = useMemo(() =>
    todayLogs.reduce<Record<string, number>>((acc, l) => {
      acc[l.medication_id] = (acc[l.medication_id] ?? 0) + 1; return acc
    }, {}), [todayLogs])

  const handleLogTake = (m: Medication) => {
    if (!selectedId) return
    Alert.alert('Registrar toma', `Confirmar toma de ${m.name}${m.dose ? ` (${m.dose})` : ''}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: () => logMutation.mutate({ medId: m.id, pid: selectedId }) },
    ])
  }

  const grouped = meds.reduce<Record<string, Medication[]>>((acc, m) => {
    if (!acc[m.type]) acc[m.type] = []
    acc[m.type].push(m)
    return acc
  }, {})

  const handleSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ['all_meds', selectedId] })
    await queryClient.invalidateQueries({ queryKey: ['medications', selectedId] })
    await queryClient.invalidateQueries({ queryKey: ['critical', selectedId] })
    setShowModal(false)
    Alert.alert('✓ Guardado', 'Medicamento agregado correctamente.')
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Medicación</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.personScroll}>
          {personsQuery.isLoading
            ? <ActivityIndicator color={COLORS.primary} />
            : persons.map(p => (
              <TouchableOpacity key={p.id}
                style={[styles.personChip, selectedId === p.id && styles.personChipSelected]}
                onPress={() => setSelectedId(p.id)}>
                <Text style={[styles.personChipText, selectedId === p.id && styles.personChipTextSelected]}>
                  {p.full_name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))
          }
        </ScrollView>

        {!selectedId && (
          <View style={styles.hint}><Text style={styles.hintText}>Seleccioná una persona para ver su medicación</Text></View>
        )}
        {selectedId && medsQuery.isLoading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />}
        {selectedId && !medsQuery.isLoading && meds.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Sin medicación registrada</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
              <Text style={styles.emptyBtnText}>+ Agregar primer medicamento</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Resumen tomas del día */}
        {selectedId && todayLogs.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tomas de hoy</Text>
            <Text style={styles.summaryCount}>{todayLogs.length} registrada{todayLogs.length !== 1 ? 's' : ''}</Text>
          </View>
        )}

        {TYPE_ORDER.map(type => {
          const items = grouped[type]
          if (!items?.length) return null
          const cfg = TYPE_CONFIG[type]
          const canLog = LOGGABLE.includes(type)
          return (
            <View key={type} style={styles.group}>
              <View style={[styles.groupHeader, { borderLeftColor: cfg.color }]}>
                <Text style={styles.groupIcon}>{cfg.icon}</Text>
                <Text style={[styles.groupTitle, { color: cfg.color }]}>{cfg.label}</Text>
                <View style={[styles.countBadge, { backgroundColor: cfg.color }]}>
                  <Text style={styles.countText}>{items.length}</Text>
                </View>
              </View>
              {items.map((m, idx) => {
                const takes = takesToday[m.id] ?? 0
                return (
                  <View key={m.id} style={[styles.medItem, idx === items.length - 1 && styles.medItemLast]}>
                    <View style={styles.medLeft}>
                      <Text style={styles.medName}>{m.name}</Text>
                      {m.dose ? <Text style={styles.medDose}>{m.dose}</Text> : null}
                      {m.frequency ? <Text style={styles.medFreq}>{m.frequency}</Text> : null}
                      {(m.time_morning || m.time_afternoon || m.time_evening || m.time_night) ? (
                        <Text style={styles.medSchedule}>
                          {[m.time_morning && '\u{1F305}', m.time_afternoon && '\u2600\uFE0F', m.time_evening && '\u{1F307}', m.time_night && '\u{1F319}'].filter(Boolean).join(' ')}
                        </Text>
                      ) : null}
                      {m.notes ? <Text style={styles.medNotes}>{m.notes}</Text> : null}
                      {canLog && takes > 0 && (
                        <Text style={styles.takeCount}>✓ {takes}x hoy</Text>
                      )}
                    </View>
                    <View style={styles.medRight}>
                      {canLog && (
                        <TouchableOpacity
                          style={[styles.takeBtn, logMutation.isPending && styles.takeBtnDisabled]}
                          onPress={() => handleLogTake(m)}
                          disabled={logMutation.isPending}
                        >
                          <Text style={styles.takeBtnText}>Tomar</Text>
                        </TouchableOpacity>
                      )}
                      <View style={[styles.activeDot, { backgroundColor: m.is_active ? COLORS.success : COLORS.gray400 }]} />
                    </View>
                  </View>
                )
              })}
            </View>
          )
        })}
      </ScrollView>

      {selectedId && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {selectedId && (
        <AddMedModal
          visible={showModal}
          personId={selectedId}
          personName={selectedPerson?.full_name ?? ''}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  personScroll: { marginBottom: 20 },
  personChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray200, marginRight: 8,
  },
  personChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  personChipText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  personChipTextSelected: { color: COLORS.white },
  hint: { paddingVertical: 48, alignItems: 'center' },
  hintText: { fontSize: 14, color: COLORS.gray400, textAlign: 'center' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', marginBottom: 16 },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  group: {
    backgroundColor: COLORS.white, borderRadius: 14, marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, borderLeftWidth: 4, backgroundColor: COLORS.gray100, gap: 8 },
  groupIcon: { fontSize: 18 },
  groupTitle: { flex: 1, fontSize: 14, fontWeight: '700', textTransform: 'uppercase' },
  countBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { fontSize: 12, fontWeight: '700', color: COLORS.white },
  medItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  medItemLast: { borderBottomWidth: 0 },
  medLeft: { flex: 1 },
  medRight: { alignItems: 'flex-end', gap: 8 },
  medName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  medDose: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  medFreq: { fontSize: 12, color: COLORS.gray500, marginTop: 1 },
  medSchedule: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  medNotes: { fontSize: 12, color: COLORS.gray400, marginTop: 2, fontStyle: 'italic' },
  takeCount: { fontSize: 11, color: COLORS.success, fontWeight: '700', marginTop: 4 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  takeBtn: { backgroundColor: COLORS.success, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  takeBtnDisabled: { opacity: 0.5 },
  takeBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  summaryCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderLeftWidth: 4, borderLeftColor: COLORS.success,
  },
  summaryLabel: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  summaryCount: { fontSize: 13, color: COLORS.success, fontWeight: '700' },
  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabText: { fontSize: 28, color: COLORS.white, lineHeight: 32 },
})
