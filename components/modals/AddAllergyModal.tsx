/**
 * components/modals/AddAllergyModal.tsx
 * SEGURIDAD: person_id siempre del prop
 */
import { useState } from 'react'
import {
  Modal, ScrollView, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/constants/theme'
import { AllergySeverity } from '@/types/database'
import { ModalField, mStyles } from './ModalField'

const SEVERITY_OPTIONS: AllergySeverity[] = ['leve', 'moderada', 'grave']
const SEVERITY_COLOR: Record<AllergySeverity, string> = {
  leve: COLORS.severityLeve, moderada: COLORS.severityModerada, grave: COLORS.severityGrave,
}
const SEVERITY_LABEL: Record<AllergySeverity, string> = {
  leve: '🟡 Leve', moderada: '🟠 Moderada', grave: '🔴 Grave',
}

type Props = { visible: boolean; personId: string; onClose: () => void; onSaved: () => void }

export function AddAllergyModal({ visible, personId, onClose, onSaved }: Props) {
  const [name, setName] = useState('')
  const [severity, setSeverity] = useState<AllergySeverity>('moderada')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => { setName(''); setSeverity('moderada'); setNotes('') }

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Nombre requerido', 'Ingresá la alergia o sustancia.'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('allergies').insert({
        person_id: personId, name: name.trim(), severity, notes: notes.trim() || null,
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
          <Text style={mStyles.title}>Nueva alergia</Text>

          <ModalField label="Sustancia o alergia *">
            <TextInput style={mStyles.input} value={name} onChangeText={setName}
              placeholder="Ej: Penicilina, mariscos, látex" placeholderTextColor={COLORS.gray400}
              autoCapitalize="sentences" maxLength={100} />
          </ModalField>

          <ModalField label="Severidad *">
            <View style={mStyles.chipRow}>
              {SEVERITY_OPTIONS.map(s => (
                <TouchableOpacity key={s}
                  style={[mStyles.chip, severity === s && { backgroundColor: SEVERITY_COLOR[s], borderColor: SEVERITY_COLOR[s] }]}
                  onPress={() => setSeverity(s)}>
                  <Text style={[mStyles.chipText, severity === s && { color: COLORS.white }]}>
                    {SEVERITY_LABEL[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ModalField>

          <ModalField label="Notas / Reacción">
            <TextInput style={[mStyles.input, mStyles.inputMultiline]} value={notes} onChangeText={setNotes}
              placeholder="Ej: Causa anafilaxia, evitar contacto directo…" placeholderTextColor={COLORS.gray400}
              multiline numberOfLines={3} maxLength={300} textAlignVertical="top" />
          </ModalField>

          <TouchableOpacity style={[mStyles.btnSave, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={mStyles.btnSaveText}>Guardar alergia</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={mStyles.btnCancel} onPress={onClose} disabled={saving}>
            <Text style={mStyles.btnCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
