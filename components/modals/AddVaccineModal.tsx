/**
 * components/modals/AddVaccineModal.tsx
 * SEGURIDAD: person_id siempre del prop
 */
import { useState } from 'react'
import {
  Modal, ScrollView, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/constants/theme'
import { VaccineStatus } from '@/types/database'
import { ModalField, mStyles } from './ModalField'

const VACCINE_STATUSES: { value: VaccineStatus; label: string; color: string }[] = [
  { value: 'completa',  label: '✓ Completa',  color: COLORS.success },
  { value: 'pendiente', label: '⏳ Pendiente', color: COLORS.warning },
  { value: 'vencida',   label: '✗ Vencida',   color: COLORS.danger  },
]

function isValidDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  return !isNaN(new Date(s).getTime())
}

type Props = { visible: boolean; personId: string; onClose: () => void; onSaved: () => void }

export function AddVaccineModal({ visible, personId, onClose, onSaved }: Props) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState<VaccineStatus>('completa')
  const [dateApplied, setDateApplied] = useState('')
  const [nextDose, setNextDose] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => { setName(''); setStatus('completa'); setDateApplied(''); setNextDose(''); setNotes('') }

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Nombre requerido', 'Ingresá el nombre de la vacuna.'); return }
    if (dateApplied.trim() && !isValidDate(dateApplied.trim())) { Alert.alert('Fecha inválida', 'Usá el formato AAAA-MM-DD.'); return }
    if (nextDose.trim() && !isValidDate(nextDose.trim())) { Alert.alert('Próxima dosis inválida', 'Usá el formato AAAA-MM-DD.'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('vaccines').insert({
        person_id: personId, name: name.trim(), status,
        date_applied: dateApplied.trim() || null, next_dose: nextDose.trim() || null,
        notes: notes.trim() || null,
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
          <Text style={mStyles.title}>Nueva vacuna</Text>

          <ModalField label="Nombre *">
            <TextInput style={mStyles.input} value={name} onChangeText={setName}
              placeholder="Ej: Doble viral, Hepatitis B, COVID-19" placeholderTextColor={COLORS.gray400}
              autoCapitalize="sentences" maxLength={100} />
          </ModalField>

          <ModalField label="Estado *">
            <View style={mStyles.chipRow}>
              {VACCINE_STATUSES.map(s => (
                <TouchableOpacity key={s.value}
                  style={[mStyles.chip, status === s.value && { backgroundColor: s.color, borderColor: s.color }]}
                  onPress={() => setStatus(s.value)}>
                  <Text style={[mStyles.chipText, status === s.value && { color: COLORS.white }]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ModalField>

          <ModalField label="Fecha aplicada (AAAA-MM-DD)">
            <TextInput style={mStyles.input} value={dateApplied} onChangeText={setDateApplied}
              placeholder="Ej: 2023-05-10" placeholderTextColor={COLORS.gray400}
              keyboardType="numeric" maxLength={10} />
          </ModalField>

          <ModalField label="Próxima dosis (AAAA-MM-DD)">
            <TextInput style={mStyles.input} value={nextDose} onChangeText={setNextDose}
              placeholder="Ej: 2024-05-10" placeholderTextColor={COLORS.gray400}
              keyboardType="numeric" maxLength={10} />
          </ModalField>

          <ModalField label="Notas">
            <TextInput style={[mStyles.input, mStyles.inputMultiline]} value={notes} onChangeText={setNotes}
              placeholder="Lote, lugar, observaciones…" placeholderTextColor={COLORS.gray400}
              multiline numberOfLines={2} maxLength={300} textAlignVertical="top" />
          </ModalField>

          <TouchableOpacity style={[mStyles.btnSave, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={mStyles.btnSaveText}>Guardar vacuna</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={mStyles.btnCancel} onPress={onClose} disabled={saving}>
            <Text style={mStyles.btnCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
