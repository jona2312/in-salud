/**
 * app/(tabs)/medicamentos.tsx — Gestión de medicación
 * Vista por persona: diarios, suplementos, rescate, prohibidos
 */

import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/constants/theme'
import { Person, Medication, MedicationType } from '@/types/database'

async function fetchPersons(): Promise<Pick<Person, 'id' | 'full_name' | 'birth_date'>[]> {
  const { data, error } = await supabase
    .from('persons').select('id, full_name, birth_date')
    .order('created_at', { ascending: true })
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
  prohibido: { label: 'Medicamentos PROHIBIDOS', color: COLORS.medForbidden, icon: '🚫' },
  rescate: { label: 'Medicación de rescate', color: COLORS.medRescue, icon: '🆘' },
  diario: { label: 'Medicación diaria', color: COLORS.medDaily, icon: '💊' },
  suplemento: { label: 'Suplementos', color: COLORS.medSupplement, icon: '🌿' },
}

const TYPE_ORDER: MedicationType[] = ['prohibido', 'rescate', 'diario', 'suplemento']

export default function MedicamentosScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const personsQuery = useQuery({ queryKey: ['persons_meds'], queryFn: fetchPersons })
  const medsQuery = useQuery({
    queryKey: ['all_meds', selectedId],
    queryFn: () => fetchMedications(selectedId!),
    enabled: !!selectedId,
  })

  const persons = personsQuery.data ?? []
  const selectedPerson = persons.find(p => p.id === selectedId)
  const meds = medsQuery.data ?? []

  const grouped = meds.reduce<Record<string, Medication[]>>((acc, m) => {
    if (!acc[m.type]) acc[m.type] = []
    acc[m.type].push(m)
    return acc
  }, {})

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Medicación</Text>

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
          <Text style={styles.hintText}>Seleccioná una persona para ver su medicación</Text>
        </View>
      )}

      {selectedId && medsQuery.isLoading && (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      )}

      {selectedId && !medsQuery.isLoading && meds.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Sin medicación registrada para {selectedPerson?.full_name}
          </Text>
        </View>
      )}

      {/* Grupos de medicación (orden: prohibido → rescate → diario → suplemento) */}
      {TYPE_ORDER.map(type => {
        const items = grouped[type]
        if (!items || items.length === 0) return null
        const config = TYPE_CONFIG[type]
        return (
          <View key={type} style={styles.group}>
            <View style={[styles.groupHeader, { borderLeftColor: config.color }]}>
              <Text style={styles.groupIcon}>{config.icon}</Text>
              <Text style={[styles.groupTitle, { color: config.color }]}>{config.label}</Text>
              <View style={[styles.countBadge, { backgroundColor: config.color }]}>
                <Text style={styles.countText}>{items.length}</Text>
              </View>
            </View>
            {items.map((m, idx) => (
              <View
                key={m.id}
                style={[styles.medItem, idx === items.length - 1 && styles.medItemLast]}
              >
                <View style={styles.medLeft}>
                  <Text style={styles.medName}>{m.name}</Text>
                  {m.dose ? <Text style={styles.medDose}>{m.dose}</Text> : null}
                  {m.frequency ? <Text style={styles.medFrequency}>{m.frequency}</Text> : null}
                  {/* Horarios */}
                  {(m.time_morning || m.time_afternoon || m.time_evening || m.time_night) ? (
                    <Text style={styles.medSchedule}>
                      {[
                        m.time_morning && '🌅 Mañana',
                        m.time_afternoon && '☀️ Tarde',
                        m.time_evening && '🌇 Noche',
                        m.time_night && '🌙 Noche tardía',
                      ].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                  {m.notes ? <Text style={styles.medNotes}>{m.notes}</Text> : null}
                </View>
                <View style={[
                  styles.activeDot,
                  { backgroundColor: m.is_active ? COLORS.success : COLORS.gray400 }
                ]} />
              </View>
            ))}
          </View>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  personScroll: { marginBottom: 20 },
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
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.gray500, textAlign: 'center' },
  group: {
    backgroundColor: COLORS.white, borderRadius: 14, marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderLeftWidth: 4, backgroundColor: COLORS.gray100, gap: 8,
  },
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
  medName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  medDose: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  medFrequency: { fontSize: 12, color: COLORS.gray500, marginTop: 1 },
  medSchedule: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  medNotes: { fontSize: 12, color: COLORS.gray400, marginTop: 2, fontStyle: 'italic' },
  activeDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 12 },
})
