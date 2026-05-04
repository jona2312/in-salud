/**
 * app/(tabs)/turnos.tsx — Agenda de turnos médicos
 * v2: próximas citas, historial, recordatorio
 *
 * SEGURIDAD: RLS garantiza acceso solo al owner
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
import { Person, Appointment, AppointmentType, AppointmentStatus } from '@/types/database'

async function fetchPersons(): Promise<Pick<Person, 'id' | 'full_name'>[]> {
  const { data, error } = await supabase
    .from('persons').select('id, full_name').order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

async function fetchAppointments(personId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments').select('*').eq('person_id', personId)
    .order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

const TYPE_OPTIONS: { value: AppointmentType; label: string; icon: string }[] = [
  { value: 'consulta',  label: 'Consulta',   icon: '🩺' },
  { value: 'estudio',   label: 'Estudio',    icon: '🔬' },
  { value: 'control',   label: 'Control',    icon: '📋' },
  { value: 'cirugia',   label: 'Cirugía',    icon: '🔪' },
  { value: 'otro',      label: 'Otro',       icon: '📌' },
]

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string }> = {
  pendiente:  { label: 'Pendiente',  color: COLORS.warning },
  completado: { label: 'Completado', color: COLORS.success },
  cancelado:  { label: 'Cancelado',  color: COLORS.gray400 },
}

function isUpcoming(date: string) {
  return new Date(date) >= new Date(new Date().toDateString())
}

export default function TurnosScreen() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'proximos' | 'todos'>('proximos')

  const [date, setDate]         = useState('')
  const [time, setTime]         = useState('')
  const [title, setTitle]       = useState('')
  const [doctor, setDoctor]     = useState('')
  const [institution, setInstitution] = useState('')
  const [specialty, setSpecialty]     = useState('')
  const [type, setType]         = useState<AppointmentType>('consulta')
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)

  const personsQ = useQuery({ queryKey: ['persons_turnos'], queryFn: fetchPersons })
  const turnosQ  = useQuery({
    queryKey: ['appointments', selectedId],
    queryFn: () => fetchAppointments(selectedId!),
    enabled: !!selectedId,
  })

  const persons = personsQ.data ?? []
  const allTurnos = turnosQ.data ?? []
  const turnos = filter === 'proximos'
    ? allTurnos.filter(t => t.status === 'pendiente' && isUpcoming(t.date))
    : allTurnos

  const resetForm = () => {
    setDate(''); setTime(''); setTitle(''); setDoctor('')
    setInstitution(''); setSpecialty(''); setType('consulta'); setNotes('')
  }

  const handleSave = async () => {
    if (!selectedId) return
    if (!date.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      Alert.alert('Fecha requerida', 'Ingresá la fecha en formato AAAA-MM-DD.')
      return
    }
    if (!title.trim()) {
      Alert.alert('Título requerido', 'Ingresá un título para el turno.')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('appointments').insert({
        person_id:   selectedId,
        date:        date.trim(),
        time:        time.trim() || null,
        title:       title.trim(),
        doctor:      doctor.trim() || null,
        institution: institution.trim() || null,
        specialty:   specialty.trim() || null,
        type,
        notes:       notes.trim() || null,
        status:      'pendiente',
      })
      if (error) throw new Error(error.message)
      await queryClient.invalidateQueries({ queryKey: ['appointments', selectedId] })
      resetForm()
      setShowModal(false)
      Alert.alert('✓ Guardado', 'Turno agendado correctamente.')
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const markDone = async (id: string) => {
    await supabase.from('appointments').update({ status: 'completado' }).eq('id', id)
    await queryClient.invalidateQueries({ queryKey: ['appointments', selectedId] })
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.title}>Turnos</Text>

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
          <View style={s.hint}><Text style={s.hintText}>Seleccioná una persona para ver sus turnos</Text></View>
        )}

        {selectedId && (
          <>
            <View style={s.filterRow}>
              {(['proximos', 'todos'] as const).map(f => (
                <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterBtnSel]}
                  onPress={() => setFilter(f)}>
                  <Text style={[s.filterText, filter === f && s.filterTextSel]}>
                    {f === 'proximos' ? 'Próximos' : 'Todos'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {turnosQ.isLoading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} />}

            {!turnosQ.isLoading && turnos.length === 0 && (
              <Text style={s.empty}>
                {filter === 'proximos' ? 'No hay turnos pendientes.' : 'Sin turnos registrados.'}
              </Text>
            )}

            {turnos.map(t => {
              const sc = STATUS_CONFIG[t.status]
              const icon = TYPE_OPTIONS.find(o => o.value === t.type)?.icon ?? '📌'
              return (
                <View key={t.id} style={s.card}>
                  <View style={s.cardHeader}>
                    <Text style={s.cardIcon}>{icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTitle}>{t.title}</Text>
                      <Text style={s.cardDate}>{t.date}{t.time ? ` · ${t.time}` : ''}</Text>
                      {t.doctor && <Text style={s.cardSub}>Dr/a. {t.doctor}</Text>}
                      {t.institution && <Text style={s.cardSub}>{t.institution}</Text>}
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: sc.color }]}>
                      <Text style={s.statusText}>{sc.label}</Text>
                    </View>
                  </View>
                  {t.notes ? <Text style={s.cardNotes}>{t.notes}</Text> : null}
                  {t.status === 'pendiente' && (
                    <TouchableOpacity style={s.doneBtn} onPress={() => markDone(t.id)}>
                      <Text style={s.doneBtnText}>Marcar completado</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )
            })}
          </>
        )}
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
              <Text style={s.modalTitle}>Nuevo turno</Text>
              <TouchableOpacity onPress={() => { resetForm(); setShowModal(false) }}>
                <Text style={s.modalClose}>Cancelar</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.fieldLabel}>Tipo</Text>
            <View style={s.typeRow}>
              {TYPE_OPTIONS.map(o => (
                <TouchableOpacity key={o.value}
                  style={[s.typeChip, type === o.value && s.typeChipSel]}
                  onPress={() => setType(o.value)}>
                  <Text style={[s.typeChipText, type === o.value && s.typeChipTextSel]}>
                    {o.icon} {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fieldLabel}>Título *</Text>
            <TextInput style={s.input} value={title} onChangeText={setTitle}
              placeholder="Ej: Control cardiológico" maxLength={200} placeholderTextColor={COLORS.gray400} />

            <Text style={s.fieldLabel}>Fecha * (AAAA-MM-DD)</Text>
            <TextInput style={s.input} value={date} onChangeText={setDate}
              placeholder="2025-06-15" keyboardType="numeric" maxLength={10} placeholderTextColor={COLORS.gray400} />

            <Text style={s.fieldLabel}>Hora</Text>
            <TextInput style={s.input} value={time} onChangeText={setTime}
              placeholder="10:30" maxLength={5} placeholderTextColor={COLORS.gray400} />

            <Text style={s.fieldLabel}>Médico / Profesional</Text>
            <TextInput style={s.input} value={doctor} onChangeText={setDoctor}
              placeholder="Dr/a. Rodríguez" maxLength={100} placeholderTextColor={COLORS.gray400} />

            <Text style={s.fieldLabel}>Institución / Clínica</Text>
            <TextInput style={s.input} value={institution} onChangeText={setInstitution}
              placeholder="Hospital Italiano, etc." maxLength={100} placeholderTextColor={COLORS.gray400} />

            <Text style={s.fieldLabel}>Especialidad</Text>
            <TextInput style={s.input} value={specialty} onChangeText={setSpecialty}
              placeholder="Cardiología, Pediatría…" maxLength={100} placeholderTextColor={COLORS.gray400} />

            <Text style={s.fieldLabel}>Notas</Text>
            <TextInput style={[s.input, s.inputMulti]} value={notes} onChangeText={setNotes}
              placeholder="Qué llevar, ayuno, etc." multiline numberOfLines={2}
              maxLength={1000} textAlignVertical="top" placeholderTextColor={COLORS.gray400} />

            <TouchableOpacity style={[s.btnSave, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={s.btnSaveText}>Guardar turno</Text>}
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
  personScroll: { marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray200, marginRight: 8 },
  chipSel: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  chipTextSel: { color: COLORS.white },
  hint: { paddingVertical: 48, alignItems: 'center' },
  hintText: { fontSize: 14, color: COLORS.gray400, textAlign: 'center' },
  filterRow: { flexDirection: 'row', backgroundColor: COLORS.gray100, borderRadius: 10, padding: 4, marginBottom: 16 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  filterBtnSel: { backgroundColor: COLORS.white, elevation: 2 },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  filterTextSel: { color: COLORS.primary },
  empty: { fontSize: 13, color: COLORS.gray400, textAlign: 'center', paddingVertical: 32 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardIcon: { fontSize: 20, marginTop: 2 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  cardDate: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  cardSub: { fontSize: 12, color: COLORS.gray500, marginTop: 2 },
  cardNotes: { fontSize: 12, color: COLORS.gray500, marginTop: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700', color: COLORS.white },
  doneBtn: { marginTop: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.gray100, alignItems: 'center' },
  doneBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
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
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray200 },
  typeChipSel: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  typeChipTextSel: { color: COLORS.white },
  btnSave: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnSaveText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
})
