/**
 * app/(tabs)/_layout.tsx — Navegación principal
 *
 * Estructura de 5 tabs (límite mobile recomendado):
 *   1. Inicio   — home familiar
 *   2. Vitales  — signos vitales (nuevo v2)
 *   3. SOS      — emergencia (central, prominente)
 *   4. Turnos   — agenda médica (nuevo v2)
 *   5. IA       — asistente con visión (nuevo v2)
 *
 * Pantallas ocultas del tab bar (accesibles por router.push):
 *   - ficha         → desde tarjeta de persona en Home
 *   - historial     → desde Ficha
 *   - medicamentos  → desde Ficha
 *   - agregar-persona → FAB en Home
 *   - editar-persona  → botón en tarjeta de persona
 *   - documentos      → desde Ficha
 */

import { Tabs } from 'expo-router'
import { StyleSheet, View, Text } from 'react-native'
import { COLORS } from '@/constants/theme'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.gray200,
          height: 80,
          paddingBottom: 16,
        },
        headerStyle: { backgroundColor: COLORS.white },
        headerTintColor: COLORS.text,
        headerShadowVisible: false,
      }}
    >
      {/* ── TABS VISIBLES ── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="vitales"
        options={{
          title: 'Vitales',
          tabBarIcon: ({ color }) => <TabIcon emoji="❤️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="emergencia"
        options={{
          title: 'SOS',
          tabBarIcon: () => <SOSTabIcon />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="turnos"
        options={{
          title: 'Turnos',
          tabBarIcon: ({ color }) => <TabIcon emoji="📅" color={color} />,
        }}
      />
      <Tabs.Screen
        name="asistente"
        options={{
          title: 'IA',
          tabBarIcon: ({ color }) => <TabIcon emoji="🤖" color={color} />,
        }}
      />

      {/* ── PANTALLAS OCULTAS (href: null = no aparecen en tab bar) ── */}
      <Tabs.Screen
        name="ficha"
        options={{ title: 'Ficha', href: null }}
      />
      <Tabs.Screen
        name="historial"
        options={{ title: 'Historial', href: null }}
      />
      <Tabs.Screen
        name="medicamentos"
        options={{ title: 'Medicación', href: null }}
      />
      <Tabs.Screen
        name="agregar-persona"
        options={{ title: 'Agregar persona', href: null }}
      />
      <Tabs.Screen
        name="editar-persona"
        options={{ title: 'Editar persona', href: null }}
      />
      <Tabs.Screen
        name="documentos"
        options={{ title: 'Documentos', href: null }}
      />
    </Tabs>
  )
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return (
    <Text style={{ fontSize: 22, opacity: color === COLORS.primary ? 1 : 0.55 }}>
      {emoji}
    </Text>
  )
}

function SOSTabIcon() {
  return (
    <View style={styles.sosContainer}>
      <View style={styles.sosButton}>
        <Text style={{ fontSize: 22 }}>🚨</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sosButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',