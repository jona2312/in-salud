/**
 * components/modals/AddContactModal.tsx
 * SEGURIDAD: person_id siempre del prop
 */
import { useState } from 'react'
import {
  Modal, ScrollView, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Switch
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/constants/theme'
import { ContactType } from '@/types/database'
import { ModalField, mStyles } from './ModalField'

const CONTACT_TYPES: { value: ContactType; label: string }[] = [
  { value: 'familiar', label: '👨‍👩‍👧 Familiar' },
  { value: 'medico',   label: '👨‍⚕️ Médico' },
  { value: 'otro',     label: '📋 Otro' },
]

type Props = { visible: boolean; personId: string; onClose: () => void; onSaved: () => void }

export function AddContactModal({ visible, personId, onClose, onSaved }: Props) {
  const [cName, setCName] = useState('')
  const [type, setType] = useState<ContactType>('familiar')
  const [phone, setPhone] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [saving, setSaving] = useState(false)

  const reset = () => { setCName(''); setType('familiar'); setPhone(''); setSpecialty(''); setIsPrimary(false) }

  const handleSave = async () => {
    if (!cName.trim()) { Alert.alert('Nombre requerido', 'Ingresá el nombre del contacto.'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('emergency_contacts').insert({
        person_id: personId, name: cName.trim(), type,
        phone: phone.trim() || null, specialty: specialty.trim() || null, is_primary: isPrimary,
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
          <Text style={mStyles.title}>Nuevo contacto</Text>

          <ModalField label="Nombre completo *">
            <TextInput style={mStyles.input} value={cName} onChangeText={setCName}
              placeholder="Ej: Dr. Carlos Pérez" placeholderTextColor={COLORS.gray400}
              autoCapitalize="words" maxLength={100} />
          </ModalField>

          <ModalField label="Tipo *">
            <View style={mStyles.chipRow}>
              {CONTACT_TYPES.map(ct => (
                <TouchableOpacity key={ct.value}
                  style={[mStyles.chip, type === ct.value && mStyles.chipSelected]}
                  onPress={() => setType(ct.value)}>
                  <Text style={[mStyles.chipText, type === ct.value && { color: COLORS.white }]}>
                    {ct.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ModalField>

          <ModalField label="Teléfono">
            <TextInput style={mStyles.input} value={phone} onChangeText={setPhone}
              placeholder="Ej: +54 9 11 1234-5678" placeholderTextColor={COLORS.gray400}
              keyboardType="phone-pad" maxLength={30} />
          </ModalField>

          <ModalField label="Especialidad (si es médico)">
            <TextInput style={mStyles.input} value={specialty} onChangeText={setSpecialty}
              placeholder="Ej: Cardiólogo, Clínico" placeholderTextColor={COLORS.gray400}
              autoCapitalize="sentences" maxLength={80} />
          </ModalField>

          <ModalField label="Contacto principal">
            <View style={mStyles.toggleCard}>
              <Text style={mStyles.toggleDesc}>Aparece primero en pantalla SOS</Text>
              <Switch value={isPrimary} onValueChange={setIsPrimary}
                trackColor={{ false: COLORS.gray200, true: COLORS.primary }} thumbColor={COLORS.white} />
            </View>
          </ModalField>

          <TouchableOpacity style={[mStyles.btnSave, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={mStyles.btnSaveText}>Guardar contacto</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={mStyles.btnCancel} onPress={onClose} disabled={saving}>
            <Text style={mStyles.btnCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
