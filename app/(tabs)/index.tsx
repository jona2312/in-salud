/**
 * app/(tabs)/index.tsx — Home: selector de miembros de la familia
 *
 * SEGURIDAD:
 * - No se muestran datos sensibles aquí, solo nombre y metadata básica
 * - Navegación a ficha y edición por person.id (UUID opaco)
 */

import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image
} from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { Person } from '@/types/database'
import { COLORS } from '@/constants/theme'

async function fetchPersons(): Promise<Person[]> {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export default function HomeScreen() {
  const router = useRouter()
  const { signOut } = useAuthStore()

  const { data: persons, isLoading, error, refetch } = useQuery({
    queryKey: ['persons'],
    queryFn: fetchPersons,
  })

  const getAge = (birthDate: string | null): string => {
    if (!birthDate) return '—'
    const years = Math.floor(
      (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    )
    return `${years} años`
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error cargando datos</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>in-salud</Text>
          <Text style={styles.subtitle}>Ficha clínica familiar</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Cerrar sesión', '¿Salir de la app?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: signOut },
        ])}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Mi familia</Text>

      {persons?.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay personas cargadas todavía</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(tabs)/agregar-persona')}>
            <Text style={styles.addButtonText}>+ Agregar persona</Text>
          </TouchableOpacity>
        </View>
      ) : (
        persons?.map((person) => (
          <View key={person.id} style={styles.personCard}>
            {/* Área principal → va a la ficha */}
            <TouchableOpacity
              style={styles.personCardMain}
              onPress={() => router.push(`/(tabs)/ficha?id=${person.id}`)}
            >
              <View style={styles.personAvatar}>
                {person.avatar_url ? (
                  <Image
                    source={{ uri: person.avatar_url }}
                    style={styles.personAvatarImage}
                  />
                ) : (
                  <Text style={styles.personInitial}>
                    {person.full_name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{person.full_name}</Text>
                <Text style={styles.personMeta}>
                  {getAge(person.birth_date)} · {person.blood_type ?? 'Sangre no cargada'}
                  {person.obra_social ? ` · ${person.obra_social}` : ''}
                </Text>
              </View>
              <View style={styles.personChevron}>
                <Text style={styles.chevronText}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Botón editar → va a editar-persona */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/(tabs)/editar-persona?id=${person.id}`)}
            >
              <Text style={styles.editButtonText}>✏️ Editar</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity
        style={styles.addPersonButton}
        onPress={() => router.push('/(tabs)/agregar-persona')}
      >
        <Text style={styles.addPersonText}>+ Agregar familiar</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 32,
  },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: 14, color: COLORS.gray500, marginTop: 2 },
  logoutText: { fontSize: 14, color: COLORS.gray400, paddingTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16 },

  // Tarjeta de persona
  personCard: {
    backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: 'hidden',
  },
  personCardMain: {
    padding: 16, flexDirection: 'row', alignItems: 'center',
  },
  personAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center', marginRight: 14, overflow: 'hidden',
  },
  personAvatarImage: { width: 48, height: 48, borderRadius: 24 },
  personInitial: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  personInfo: { flex: 1 },
  personName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  personMeta: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  personChevron: { paddingLeft: 8 },
  chevronText: { fontSize: 24, color: COLORS.gray400 },
  editButton: {
    borderTopWidth: 1, borderTopColor: COLORS.gray100,
    paddingVertical: 10, paddingHorizontal: 16, alignItems: 'flex-end',
  },
  editButtonText: { fontSize: 13, color: COLORS.gray500, fontWeight: '600' },

  // Estado vacío
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, color: COLORS.gray500, marginBottom: 16 },
  addButton: {
    backgroundColor: COLORS.primary, paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 10,
  },
  addButtonText: { color: COLORS.white, fontWeight: '600' },

  // Agregar persona
  addPersonButton: {
    marginTop: 8, padding: 16, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.primary,
    borderStyle: 'dashed', alignItems: 'center',
  },
  addPersonText: { color: COLORS.primary, fontWeight: '600', fontSize: 15 },

  errorText: { color: COLORS.danger, marginBottom: 8 },
  retryText: { color: COLORS.primary, fontWeight: '600' },
})
