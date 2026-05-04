/**
 * components/modals/ModalField.tsx
 * Campo reutilizable para modales + estilos compartidos
 */
import { type ReactNode } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '@/constants/theme'

export function ModalField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={mStyles.field}>
      <Text style={mStyles.fieldLabel}>{label}</Text>
      {children}
    </View>
  )
}

export const mStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 60 },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.gray200, alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.gray500, marginBottom: 24 },
  field: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.gray200,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16, color: COLORS.text,
  },
  inputMultiline: { minHeight: 80, paddingTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.gray200,
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  toggleLabel: { fontSize: 15, color: COLORS.text },
  toggleCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: COLORS.gray200,
  },
  toggleDesc: { fontSize: 14, color: COLORS.text, flex: 1 },
  btnSave: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  btnSaveText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  btnCancel: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnCancelText: { color: COLORS.gray500, fontSize: 15, fontWeight: '600' },
})
