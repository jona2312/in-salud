/**
 * app/(tabs)/_layout.tsx — Navegación principal con tabs
 * Basado en el mockup: Home, Ficha, Emergencia, Medicamentos, Historial
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Familia',
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ficha"
        options={{
          title: 'Ficha',
          tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} />,
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
        name="medicamentos"
        options={{
          title: 'Medicación',
          tabBarIcon: ({ color }) => <TabIcon emoji="💊" color={color} />,
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} />,
        }}
      />
      {/* Pantalla oculta del tab bar — solo accesible por router.push */}
      <Tabs.Screen
        name="agregar-persona"
        options={{
          title: 'Agregar persona',
          href: null,  // No aparece en el tab bar
        }}
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
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
})
