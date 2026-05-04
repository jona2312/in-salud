/**
 * app/(tabs)/vitales.tsx — Registro de signos vitales en el tiempo
 * v2: PA, glucemia, peso, SpO2, FC, temperatura
 *
 * SEGURIDAD: RLS garantiza que cada usuario solo ve sus propios registros
 */
import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/constants/theme'
import { Person, Vital } from '@/types/database'

async function fetchPersons(): Promise<Pick<Person, 'id' | 'full_name'>[]> {
  const { data, error } = await supabase
    .from('persons').select('id, full_name').order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

async function fetchVitals(personId: string): Promise<Vital[]> {
  const { data, error } = await supabase
    .from('vitals').select('*').eq('person_id', personId)
    .order('date', { ascending: false }).limit(30)
  if (error) throw new Error(error.message)
  return data ?? []
}

const VITAL_TYPES = [
  { key: 'bp',      label: 'Presión',    icon: '🫀', unit: 'mmHg' },
  { key: 'hr',      label: 'Frec. card.', icon: '💓', unit: 'lpm' },
  { key: 'glucose', label: 'Glucemia',   icon: '🩸', unit: 'mg/dL' },
  { key: 'weight',  label: 'Peso',       icon: '⚖️',  unit: 'kg' },
  { key: 'spo2',    label: 'SpO2',       icon: '🫁', unit: '%' },
  { key: 'temp',    label: 'Temperatura', icon: '🌡️', unit: '°C' },
]

function VitalRow({ vital }: { vital: Vital }) {
  const parts: string[] = []
  if (vital.bp_systolic && vital.bp_diastolic)
    parts.push(`🫀 ${vital.bp_systolic}/${vital.bp_diastolic} mmHg`)
  if (vital.heart_rate) parts.push(`💓 ${vital.heart_rate} lpm`)
  if (vital.glucose_mgdl) parts.push(`🩸 ${vital.glucose_mgdl} mg/dL`)
  if (vital.weight_kg) parts.push(`⚖️ ${vital.weight_kg} kg`)
  if (vital.spo2) parts.push(`🫁 ${vital.spo2}%`)
  if (vital.temperature_c) parts.push(`🌡️ ${vital.temperature_c}°C`)

  return (
    <View style={s.card}>
      <Text style={s.cardDate}>{vital.date}</Text>
      <View style={s.vitalGrid}>
        {parts.map((p, i) => (
          <View key={i} style={s.vitalPill}>
            <Text style={s.vitalPillText}>{p}</Text>
          </View>
        ))}
      </View>
      {vital.notes ? <Text style={s.cardNotes}>{vital.notes}</Text> : null}
    </View>
  )
}

export default function VitalesScreen() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const [bpS, setBpS]   = useState('')
  const [bpD, setBpD]   = useState('')
  const [hr, setHr]     = useState('')
  const [gluc, setGluc] = useState('')
  const [wt, setWt]     = useState('')
  const [spo2, setSpo2] = useState('')
  const [temp, setTemp] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const personsQ = useQuery({ queryKey: ['persons_vitals'], queryFn: fetchPersons })
  const vitalsQ  = useQuery({
    queryKey: ['vitals', selectedId],
    queryFn: () => fetchVitals(selectedId!),
    enabled: !!selectedId,
  })

  const persons = personsQ.data ?? []
  const vitals  = vitalsQ.data ?? []

  const resetForm = () => {
    setBpS(''); setBpD(''); setHr(''); setGluc('')
    setWt(''); setSpo2(''); setTemp(''); setNotes('')
  }

  const handleSave = async () => {
    if (!selectedId) return
    const sys = parseInt(bpS), dia = parseInt(bpD)
    const hasBP = bpS && bpD && !isNaN(sys) && !isNaN(dia)
    const hasAny = hasBP || hr || gluc || wt || spo2 || temp
    if (!hasAny) {
      Alert.alert('Sin datos', 'Ingresá al menos un signo vital.')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('vitals').insert({
        person_id:    selectedId,
        bp_systolic:  hasBP ? sys : null,
        bp_diastolic: hasBP ? dia : null,
        heart_rate:   hr ? parseInt(hr) : null,
        glucose_mgdl: gluc ? parseInt(gluc) : null,
        weight_kg:    wt ? parseFloat(wt) : null,
        spo2:         spo2 ? parseInt(spo2) : null,
        temperature_c: temp ? parseFloat(temp) : null,
        notes:        notes.trim() || null,
      })
      if (error) throw new Error(error.message)
      await queryClient.invalidateQueries({ queryKey: ['vitals', selectedId] })
      resetForm()
      setShowModal(false)
      Alert.alert('✓ Guardado', 'Signos vitales registrados.')
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.title}>Signos vitales</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.personScroll}>
          {personsQ.isLoading
            ? <ActivityIndicator color={COLORS.primary} />
            : persons.map(p => (
              <TouchableOpacity key={p.id}
                style={[s.chip, selectedId === p.id && s.chipSel]}
                onPress={() => setSelectedId(p.id)}>
                <Text style={[s.chipText, selectedId === p.id && s.chipTextSel]}>
                  {p.full_name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))
          }
        </ScrollView>

        {!selectedId && (
          <View style={s.hint}><Text style={s.hintText}>Seleccioná una persona para ver sus vitales</Text></View>
        )}

        {selectedId && vitalsQ.isLoading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />}

        {selectedId && !vitalsQ.isLoading && vitals.length === 0 && (
          <Text style={s.empty}>Sin registros todavía. Tocá + para agregar.</Text>
        )}

        {vitals.map(v => <VitalRow key={v.id} vital={v} />)}
      </ScrollView>

      {selectedId && (
        <TouchableOpacity style={s.fab} onPress={() => setShowModal(true)}>
          <Text style={s.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={s.modal} contentContainerStyle={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Registrar vitales</Text>
              <TouchableOpacity onPress={() => { resetForm(); setShowModal(false) }}>
                <Text style={s.modalClose}>Cancelar</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.fieldLabel}>Presión arterial (mmHg)</Text>
            <View style={s.bpRow}>
              <TextInput style={[s.input, s.bpInput]} value={bpS} onChangeText={setBpS}
                placeholder="Sistólica" keyboardType="numeric" maxLength={3} placeholderTextColor={COLORS.gray400} />
              <Text style={s.bpSep}>/</Text>
              <TextInput style={[s.input, s.bpInput]} value={bpD} onChangeText={setBpD}
                placeholder="Diastólica" keyboardType="numeric" maxLength={3} placeholderTextColor={COLORS.gray400} />
            </View>

            <Text style={s.fieldLabel}>Frecuencia cardíaca (lpm)</Text>
            <TextInput style={s.input} value={hr} onChangeText={setHr}
              placeholder="Ej: 72" keyboardType="numeric" maxLength={3} placeholderTextColor={COLORS.gray400} />

            <Text style={s.fieldLabel}>Glucemia (mg/dL)</Text>
            <TextInput style={s.input} value={gluc} onChangeText={setGluc}
              placeholder="Ej: 95" keyboardType="numeric" maxLength={4} placeholderTextColor={COLORS.gray400} />

            <Text style={s.fieldLabel}>Peso (kg)</Text>
            <TextInput style={s.input} value={wt} onChangeText={setWt}
              placeholder="Ej: 70.5" keyboardType="decimal-pad" maxLength={5} placeholderTextColor={COLORS.gray400} />

            <Text style={s.fieldLabel}>SpO2 (%)</Text>
            <TextInput style={s.input} value={spo2} onChangeText={setSpo2}
              placeholder="Ej: 98" keyboardType="numeric" maxLength={3} placeholderTextColor={COLORS.gray400} />

            <Text style={s.fieldLabel}>Temperatura (°C)</Text>
            <TextInput style={s.input} value={temp} onChangeText={setTemp}
              placeholder="Ej: 36.5" keyboardType="decimal-pad" maxLength={4} placeholderTextColor={COLORS.gray400} />

            <Text style={s.fieldLabel}>Notas</Text>
            <TextInput style={[s.input, s.inputMulti]} value={notes} onChangeText={setNotes}
              placeholder="Contexto, síntomas, observaciones…" multiline numberOfLines={2}
              maxLength={500} textAlignVertical="top" placeholderTextColor={COLORS.gray400} />

            <TouchableOpacity style={[s.btnSave, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={s.btnSaveText}>Guardar</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  personScroll: { marginBottom: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray200, marginRight: 8 },
  chipSel: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  chipTextSel: { color: COLORS.white },
  hint: { paddingVertical: 48, alignItems: 'center' },
  hintText: { fontSize: 14, color: COLORS.gray400, textAlign: 'center' },
  empty: { fontSize: 13, color: COLORS.gray400, textAlign: 'center', paddingVertical: 32 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardDate: { fontSize: 12, color: COLORS.gray500, fontWeight: '600', marginBottom: 8 },
  vitalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  vitalPill: { backgroundColor: COLORS.gray100, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  vitalPillText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  cardNotes: { fontSize: 12, color: COLORS.gray500, marginTop: 8 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabText: { fontSize: 28, color: COLORS.white, lineHeight: 32 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalContent: { padding: 20, paddingBottom: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  modalClose: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  input: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.gray200, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: COLORS.text },
  inputMulti: { minHeight: 80, paddingTop: 12 },
  bpRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bpInput: { flex: 1 },
  bpSep: { fontSize: 24, fontWeight: '300', color: COLORS.gray400 },
  btnSave: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnSaveText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
})
