/**
 * lib/notifications.ts — Notificaciones locales para turnos médicos
 *
 * SEGURIDAD:
 * - Solo notificaciones locales, sin servidor externo
 * - No se transmite información médica fuera del dispositivo
 */
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

// Configurar cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

/** Solicitar permisos de notificación al usuario */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false

  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

/** Programar recordatorio para un turno médico */
export async function scheduleAppointmentReminder(params: {
  appointmentId: string
  title: string
  doctor: string | null
  date: string   // YYYY-MM-DD
  time: string | null  // HH:MM
}): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions()
  if (!hasPermission) return null

  // Calcular fecha/hora del recordatorio (1 día antes a las 9:00, o 1 hora antes si es hoy)
  const appointmentDate = new Date(`${params.date}T${params.time ?? '09:00'}:00`)
  const now = new Date()
  const oneDayBefore = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000)
  const oneHourBefore = new Date(appointmentDate.getTime() - 60 * 60 * 1000)

  let trigger: Date
  if (oneDayBefore > now) {
    trigger = oneDayBefore
    trigger.setHours(9, 0, 0, 0) // 9 AM del día anterior
  } else if (oneHourBefore > now) {
    trigger = oneHourBefore
  } else {
    return null // El turno ya pasó o es demasiado próximo
  }

  const body = params.doctor
    ? `Turno con ${params.doctor}`
    : 'Recordatorio de turno médico'

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body,
      data: { appointmentId: params.appointmentId },
      sound: true,
    },
    trigger: { date: trigger },
  })

  return id
}

/** Cancelar recordatorio de un turno */
export async function cancelAppointmentReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId)
}

/** Cancelar todos los recordatorios de turnos */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
}
