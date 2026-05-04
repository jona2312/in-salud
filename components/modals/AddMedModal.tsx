/**
 * components/modals/AddMedModal.tsx
 * Modal para agregar medicamento a una persona
 * SEGURIDAD: person_id siempre del prop, nunca del input
 */
import { useState } from 'react'
import {
  Modal, ScrollView, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Switch
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/constants/theme'
import { MedicationType } from '@/types/database'
import { ModalField, mStyles } from './ModalField'

const TYPE_CONFIG: Record<MedicationType, { label: string; color: string; icon: string }> = {
  prohibido:  { label: 'prohibido',  color: COLORS.medForbidden, icon: '🚫' },
  rescate:    { label: 'rescate',    color: COLORS.medRescue,    icon: '🆘' },
  diario:     { label: 'diario',     color: COLORS.medDaily,     icon: '💊' },
  suplemento: { label: 'suplemento', color: COLORS.medSupplement,icon: '🌿' },
}

type Props = {
  visible: boolean
  personId: string
  personName: string
  onClose: () => void
  onSaved: () => void
}

export function AddMedModal({ visible, personId, personName, onClose, onSaved }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<MedicationType>('diario')
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState('')
  const [morning, setMorning] = useState(false)
  const [afternoon, setAfternoon] = useState(false)
  const [evening, setEvening] = useState(false)
  const [night, setNight] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setName(''); setType('diario'); setDose(''); setFrequency('')
    setMorning(false); setAfternoon(false); setEvening(false); setNight(false); setNotes('')
  }

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Nombre requerido', 'Ingresá el nombre del medicamento.'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('medications').insert({
        person_id: personId, name: name.trim(), type,
        dose: dose.trim() || null, frequency: frequency.trim() || null,
        time_morning: morning, time_afternoon: afternoon,
        time_evening: evening, time_night: night,
        notes: notes.trim() || null, is_active: true,
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
          <Text style={mStyles.title}>Nuevo medicamento</Text>
          <Text style={mStyles.subtitle}>Para: {personName}</Text>

          <ModalField label="Nombre *">
            <TextInput style={mStyles.input} value={name} onChangeText={setName}
              placeholder="Ej: Ibuprofeno, Metformina" placeholderTextColor={COLORS.gray400}
              autoCapitalize="sentences" maxLength={100} />
          </ModalField>

          <ModalField label="Tipo *">
            <View style={mStyles.chipRow}>
              {(Object.keys(TYPE_CONFIG) as MedicationType[]).map(t => (
                <TouchableOpacity key={t}
                  style={[mStyles.chip, type === t && { backgroundColor: TYPE_CONFIG[t].color, borderColor: TYPE_CONFIG[t].color }]}
                  onPress={() => setType(t)}>
                  <Text style={[mStyles.chipText, type === t && { color: COLORS.white }]}>
                    {TYPE_CONFIG[t].icon} {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ModalField>

          <ModalField label="Dosis">
            <TextInput style={mStyles.input} value={dose} onChangeText={setDose}
              placeholder="Ej: 500mg, 10 gotas" placeholderTextColor={COLORS.gray400} maxLength={50} />
          </ModalField>

          <ModalField label="Frecuencia">
            <TextInput style={mStyles.input} value={frequency} onChangeText={setFrequency}
              placeholder="Ej: cada 8hs, 1 vez por día" placeholderTextColor={COLORS.gray400} maxLength={100} />
          </ModalField>

          <ModalField label="Horarios">
            {[
              { label: '🌅 Mañana',     val: morning,   set: setMorning },
              { label: '☀️ Tarde',       val: afternoon, set: setAfternoon },
              { label: '🌇 Tarde-noche', val: evening,   set: setEvening },
              { label: '🌙 Noche',       val: night,     set: setNight },
            ].map(({ label, val, set }) => (
              <View key={label} style={mStyles.toggleRow}>
                <Text style={mStyles.toggleLabel}>{label}</Text>
                <Switch value={val} onValueChange={set}
                  trackColor={{ false: COLORS.gray200, true: COLORS.primary }} thumbColor={COLORS.white} />
              </View>
            ))}
          </ModalField>

          <ModalField label="Notas">
            <TextInput style={[mStyles.input, mStyles.inputMultiline]} value={notes} onChangeText={setNotes}
              placeholder="Instrucciones especiales…" placeholderTextColor={COLORS.gray400}
              multiline numberOfLines={3} maxLength={500} textAlignVertical="top" />
          </ModalField>

          <TouchableOpacity style={[mStyles.btnSave, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={mStyles.btnSaveText}>Guardar medicamento</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={mStyles.btnCancel} onPress={onClose} disabled={saving}>
            <Text style={mStyles.btnCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
