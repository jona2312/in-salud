/**
 * components/modals/AddAntecedentModal.tsx
 * SEGURIDAD: person_id siempre del prop
 */
import { useState } from 'react'
import {
  Modal, ScrollView, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/constants/theme'
import { AntecedentType } from '@/types/database'
import { ModalField, mStyles } from './ModalField'

const ANTECEDENT_TYPES: { value: AntecedentType; label: string }[] = [
  { value: 'enfermedad', label: '🫀 Enfermedad' },
  { value: 'cirugia',   label: '🔪 Cirugía' },
  { value: 'accidente', label: '⚠️ Accidente' },
  { value: 'otro',      label: '📌 Otro' },
]

type Props = { visible: boolean; personId: string; onClose: () => void; onSaved: () => void }

export function AddAntecedentModal({ visible, personId, onClose, onSaved }: Props) {
  const [type, setType] = useState<AntecedentType>('enfermedad')
  const [description, setDescription] = useState('')
  const [year, setYear] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => { setType('enfermedad'); setDescription(''); setYear(''); setNotes('') }

  const handleSave = async () => {
    if (!description.trim()) { Alert.alert('Descripción requerida', 'Ingresá una descripción del antecedente.'); return }
    const yearStr = year.trim()
    let yearNum: number | null = null
    if (yearStr) {
      yearNum = parseInt(yearStr, 10)
      const currentYear = new Date().getFullYear()
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
        Alert.alert('Año inválido', 'Ingresá un año válido (ej: 2010).')
        return
      }
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('antecedents').insert({
        person_id: personId, type, description: description.trim(),
        year: yearNum, notes: notes.trim() || null,
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
          <Text style={mStyles.title}>Nuevo antecedente</Text>

          <ModalField label="Tipo *">
            <View style={mStyles.chipRow}>
              {ANTECEDENT_TYPES.map(t => (
                <TouchableOpacity key={t.value}
                  style={[mStyles.chip, type === t.value && mStyles.chipSelected]}
                  onPress={() => setType(t.value)}>
                  <Text style={[mStyles.chipText, type === t.value && { color: COLORS.white }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ModalField>

          <ModalField label="Descripción *">
            <TextInput style={[mStyles.input, mStyles.inputMultiline]} value={description} onChangeText={setDescription}
              placeholder="Ej: Diabetes tipo 2, apendicectomía, fractura de cadera"
              placeholderTextColor={COLORS.gray400} multiline numberOfLines={3}
              maxLength={500} textAlignVertical="top" autoCapitalize="sentences" />
          </ModalField>

          <ModalField label="Año aproximado">
            <TextInput style={mStyles.input} value={year} onChangeText={setYear}
              placeholder="Ej: 2010" placeholderTextColor={COLORS.gray400}
              keyboardType="numeric" maxLength={4} />
          </ModalField>

          <ModalField label="Notas">
            <TextInput style={[mStyles.input, mStyles.inputMultiline]} value={notes} onChangeText={setNotes}
              placeholder="Observaciones adicionales…" placeholderTextColor={COLORS.gray400}
              multiline numberOfLines={2} maxLength={300} textAlignVertical="top" />
          </ModalField>

          <TouchableOpacity style={[mStyles.btnSave, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={mStyles.btnSaveText}>Guardar antecedente</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={mStyles.btnCancel} onPress={onClose} disabled={saving}>
            <Text style={mStyles.btnCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
