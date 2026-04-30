/**
 * app/(tabs)/emergencia.tsx — Modo SOS
 *
 * SEGURIDAD:
 * - Muestra datos críticos sin requerir re-auth (acceso rápido de emergencia)
 * - Solo expone info mínima necesaria: sangre, alergias graves, meds prohibidos/rescate, contactos
 * - No permite edición desde esta pantalla
 * - Solo visible para persons con is_emergency_visible = true
 */

import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Linking, Alert
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/constants/theme'
import { Person, Allergy, Medication, EmergencyContact } from '@/types/database'

async function fetchAllPersons(): Promise<Person[]> {
  const { data, error } = await supabase
    .from('persons').select('*').order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

async function fetchCriticalData(personId: string) {
  const [allergiesRes, medsRes, contactsRes] = await Promise.all([
    supabase.from('allergies').select('*').eq('person_id', personId).eq('severity', 'grave'),
    supabase.from('medications').select('*').eq('person_id', personId)
      .in('type', ['rescate', 'prohibido']).eq('is_active', true),
    supabase.from('emergency_contacts').select('*').eq('person_id', personId)
      .eq('is_primary', true).limit(2),
  ])
  return {
    allergies: (allergiesRes.data ?? []) as Allergy[],
    medications: (medsRes.data ?? []) as Medication[],
    contacts: (contactsRes.data ?? []) as EmergencyContact[],
  }
}

export default function EmergenciaScreen() {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)

  const personsQuery = useQuery({ queryKey: ['persons_sos'], queryFn: fetchAllPersons })
  const criticalQuery = useQuery({
    queryKey: ['critical', selectedPersonId],
    queryFn: () => fetchCriticalData(selectedPersonId!),
    enabled: !!selectedPersonId,
  })

  const persons = personsQuery.data ?? []
  const selectedPerson = persons.find(p => p.id === selectedPersonId)

  const callNumber = (phone: string) => {
    const url = `tel:${phone.replace(/\s/g, '')}`
    Linking.canOpenURL(url).then(ok => {
      if (ok) Linking.openURL(url)
      else Alert.alert('No se puede llamar desde este dispositivo')
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header SOS */}
      <View style={styles.sosHeader}>
        <Text style={styles.sosTitle}>🚨 SOS</Text>
        <Text style={styles.sosSubtitle}>Información de emergencia</Text>
      </View>

      {/* Selector de persona */}
      <Text style={styles.sectionLabel}>¿Para quién?</Text>
      {personsQuery.isLoading
        ? <ActivityIndicator color={COLORS.white} />
        : (
          <View style={styles.personSelector}>
            {persons.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.personChip, selectedPersonId === p.id && styles.personChipSelected]}
                onPress={() => setSelectedPersonId(p.id)}
              >
                <Text style={[styles.personChipText, selectedPersonId === p.id && styles.personChipTextSelected]}>
                  {p.full_name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )
      }

      {selectedPerson && (
        <>
          {/* Datos críticos del paciente */}
          <View style={styles.criticalCard}>
            <View style={styles.criticalRow}>
              <CriticalBadge label="Nombre" value={selectedPerson.full_name} />
              <CriticalBadge label="Sangre" value={selectedPerson.blood_type ?? '—'} highlight />
            </View>
            {(selectedPerson.bp_systolic && selectedPerson.bp_diastolic) ? (
              <CriticalBadge
                label="Presión habitual"
                value={`${selectedPerson.bp_systolic}/${selectedPerson.bp_diastolic}`}
              />
            ) : null}
            {selectedPerson.notes ? (
              <View style={styles.urgentBox}>
                <Text style={styles.urgentLabel}>⚠️ NOTAS URGENTES:</Text>
                <Text style={styles.urgentText}>{selectedPerson.notes}</Text>
              </View>
            ) : null}
          </View>

          {criticalQuery.isLoading ? (
            <ActivityIndicator color={COLORS.white} style={{ marginTop: 16 }} />
          ) : (
            <>
              {/* Alergias graves */}
              {(criticalQuery.data?.allergies ?? []).length > 0 && (
                <View style={styles.dangerCard}>
                  <Text style={styles.dangerTitle}>🚫 Alergias graves</Text>
                  {criticalQuery.data!.allergies.map(a => (
                    <Text key={a.id} style={styles.dangerItem}>
                      • {a.name}{a.notes ? ` → ${a.notes}` : ''}
                    </Text>
                  ))}
                </View>
              )}

              {/* Medicamentos prohibidos / rescate */}
              {(criticalQuery.data?.medications ?? []).length > 0 && (
                <View style={styles.medCard}>
                  <Text style={styles.medTitle}>💊 Medicación crítica</Text>
                  {criticalQuery.data!.medications.map(m => (
                    <View key={m.id} style={styles.medItem}>
                      <Text style={[styles.medType, m.type === 'prohibido' ? styles.forbidden : styles.rescue]}>
                        {m.type === 'prohibido' ? '🚫 PROHIBIDO' : '🆘 RESCATE'}
                      </Text>
                      <Text style={styles.medName}>
                        {m.name}{m.dose ? ` · ${m.dose}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Contactos de emergencia */}
              {(criticalQuery.data?.contacts ?? []).length > 0 && (
                <View style={styles.contactsCard}>
                  <Text style={styles.contactsTitle}>📞 Contacto principal</Text>
                  {criticalQuery.data!.contacts.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.callButton}
                      onPress={() => c.phone && callNumber(c.phone)}
                      disabled={!c.phone}
                    >
                      <View>
                        <Text style={styles.callName}>{c.name}</Text>
                        <Text style={styles.callRelation}>{c.type}{c.specialty ? ` · ${c.specialty}` : ''}</Text>
                      </View>
                      {c.phone ? (
                        <View style={styles.callBadge}>
                          <Text style={styles.callBadgeText}>📞 {c.phone}</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Botón 112 */}
              <TouchableOpacity style={styles.emergencyCallBtn} onPress={() => callNumber('112')}>
                <Text style={styles.emergencyCallText}>📞 Llamar Emergencias (112)</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}

      {!selectedPersonId && persons.length > 0 && (
        <Text style={styles.hint}>Seleccioná una persona para ver su info de emergencia</Text>
      )}
    </ScrollView>
  )
}

function CriticalBadge({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[styles.badge, highlight && styles.badgeHighlight]}>
      <Text style={styles.badgeLabel}>{label}</Text>
      <Text style={[styles.badgeValue, highlight && styles.badgeValueHighlight]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.danger },
  content: { padding: 20, paddingBottom: 40 },
  sosHeader: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  sosTitle: { fontSize: 36, fontWeight: '900', color: COLORS.white },
  sosSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 10, textTransform: 'uppercase' },
  personSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  personChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  personChipSelected: { backgroundColor: COLORS.white },
  personChipText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  personChipTextSelected: { color: COLORS.danger },
  criticalCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12 },
  criticalRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  badge: { flex: 1, backgroundColor: COLORS.gray100, borderRadius: 10, padding: 10 },
  badgeHighlight: { backgroundColor: '#FEE2E2' },
  badgeLabel: { fontSize: 11, color: COLORS.gray500, textTransform: 'uppercase', fontWeight: '600', marginBottom: 2 },
  badgeValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  badgeValueHighlight: { color: COLORS.danger },
  urgentBox: {
    marginTop: 8, backgroundColor: '#FEF3C7', borderRadius: 10,
    padding: 10, borderLeftWidth: 3, borderLeftColor: COLORS.warning,
  },
  urgentLabel: { fontSize: 12, fontWeight: '700', color: COLORS.warning, marginBottom: 4 },
  urgentText: { fontSize: 14, color: COLORS.text },
  dangerCard: {
    backgroundColor: '#FEE2E2', borderRadius: 14, padding: 14,
    marginBottom: 12, borderLeftWidth: 4, borderLeftColor: COLORS.danger,
  },
  dangerTitle: { fontSize: 14, fontWeight: '800', color: COLORS.danger, marginBottom: 8 },
  dangerItem: { fontSize: 14, color: COLORS.text, marginBottom: 4 },
  medCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 12 },
  medTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  medItem: { marginBottom: 8 },
  medType: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  forbidden: { color: COLORS.danger },
  rescue: { color: COLORS.warning },
  medName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  contactsCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 16 },
  contactsTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  callButton: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.gray100, borderRadius: 10, padding: 12, marginBottom: 8,
  },
  callName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  callRelation: { fontSize: 12, color: COLORS.gray500 },
  callBadge: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  callBadgeText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  emergencyCallBtn: { backgroundColor: COLORS.white, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 4 },
  emergencyCallText: { fontSize: 16, fontWeight: '800', color: COLORS.danger },
  hint: { textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 24 },
})
