/**
 * components/modals/AddEventModal.tsx
 * SEGURIDAD: person_id siempre del prop
 */
import { useState } from 'react'
import {
  Modal, ScrollView, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/constants/theme'
import { MedicalEventType } from '@/types/database'
import { ModalField, mStyles } from './ModalField'

const EVENT_TYPES: { value: MedicalEventType; label: string }[] = [
  { value: 'consulta',    label: '🩺 Consulta' },
  { value: 'estudio',     label: '🔬 Estudio' },
  { value: 'internacion', label: '🏥 Internación' },
  { value: 'cirugia',     label: '🔪 Cirugía' },
  { value: 'vacuna',      label: '💉 Vacuna' },
  { value: 'otro',        label: '📌 Otro' },
]

function isValidDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  return !isNaN(new Date(s).getTime())
}

type Props = { visible: boolean; personId: string; onClose: () => void; onSaved: () => void }

export function AddEventModal({ visible, personId, onClose, onSaved }: Props) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<MedicalEventType>('consulta')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [doctor, setDoctor] = useState('')
  const [institution, setInstitution] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setTitle(''); setType('consulta'); setDate(''); setDescription(''); setDoctor(''); setInstitution(''); setNotes('')
  }

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Título requerido', 'Ingresá un título para el evento.'); return }
    if (!date.trim() || !isValidDate(date.trim())) { Alert.alert('Fecha inválida', 'Usá el formato AAAA-MM-DD.'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('medical_events').insert({
        person_id: personId, title: title.trim(), type, date: date.trim(),
        description: description.trim() || null, doctor: doctor.trim() || null,
        institution: institution.trim() || null, notes: notes.trim() || null,
      })
      if (error) throw new Error(error.message)
      reset(); onSaved()
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Error desconocido')
    } finally { setSaving(false) }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={mStyles.container} contentContainerStyle={mStyles.content} keyboardShouldPersistTaps="handled">
          <View style={mStyles.handle} />
          <Text style={mStyles.title}>Nuevo evento médico</Text>

          <ModalField label="Título *">
            <TextInput style={mStyles.input} value={title} onChangeText={setTitle}
              placeholder="Ej: Consulta cardiológica, Resonancia" placeholderTextColor={COLORS.gray400}
              autoCapitalize="sentences" maxLength={150} />
          </ModalField>

          <ModalField label="Tipo *">
            <View style={mStyles.chipRow}>
              {EVENT_TYPES.map(t => (
                <TouchableOpacity key={t.value}
                  style={[mStyles.chip, type === t.value && mStyles.chipSelected]}
                  onPress={() => setType(t.value)}>
                  <Text style={[mStyles.chipText, type === t.value && { color: COLORS.white }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ModalField>

          <ModalField label="Fecha * (AAAA-MM-DD)">
            <TextInput style={mStyles.input} value={date} onChangeText={setDate}
              placeholder="Ej: 2024-03-15" placeholderTextColor={COLORS.gray400}
              keyboardType="numeric" maxLength={10} />
          </ModalField>

          <ModalField label="Descripción / Resultado">
            <TextInput style={[mStyles.input, mStyles.inputMultiline]} value={description} onChangeText={setDescription}
              placeholder="Resultados, observaciones, diagnóstico…" placeholderTextColor={COLORS.gray400}
              multiline numberOfLines={3} maxLength={500} textAlignVertical="top" />
          </ModalField>

          <ModalField label="Médico">
            <TextInput style={mStyles.input} value={doctor} onChangeText={setDoctor}
              placeholder="Ej: Dr. García" placeholderTextColor={COLORS.gray400}
              autoCapitalize="words" maxLength={100} />
          </ModalField>

          <ModalField label="Institución">
            <TextInput style={mStyles.input} value={institution} onChangeText={setInstitution}
              placeholder="Ej: Hospital Italiano, Clínica Santa María" placeholderTextColor={COLORS.gray400}
              autoCapitalize="words" maxLength={100} />
          </ModalField>

          <TouchableOpacity style={[mStyles.btnSave, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={mStyles.btnSaveText}>Guardar evento</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={mStyles.btnCancel} onPress={onClose} disabled={saving}>
            <Text style={mStyles.btnCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
