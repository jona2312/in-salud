import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { COLORS } from '@/constants/theme'
export default function AsistenteScreen() {
  const router = useRouter()
  return <View style={s.page}>
    <Text style={s.title}>Tus indicaciones, a mano</Text>
    <Text style={s.body}>El asistente con respuestas basadas en tus documentos está en preparación. Todavía no consulta tu historia ni interpreta estudios.</Text>
    <Text style={s.body}>Podés consultar los documentos e indicaciones que registraste desde la ficha de cada persona.</Text>
    <TouchableOpacity accessibilityRole="button" style={s.button} onPress={() => router.push('/(tabs)')}><Text style={s.buttonText}>Ir a mis personas</Text></TouchableOpacity>
    <Text style={s.note}>Las respuestas futuras deberán mostrar documento, fecha y autor. No decidirán tratamientos ni cambios de dosis.</Text>
  </View>
}
const s = StyleSheet.create({ page: { flex: 1, padding: 24, gap: 20, backgroundColor: COLORS.background }, title: { fontSize: 26, fontWeight: '700', color: COLORS.text }, body: { fontSize: 17, lineHeight: 26, color: COLORS.text }, button: { padding: 18, borderRadius: 12, backgroundColor: COLORS.primary }, buttonText: { color: 'white', fontWeight: '700', textAlign: 'center' }, note: { fontSize: 14, lineHeight: 22, color: COLORS.gray500 } })
