/**
 * constants/theme.ts — Colores y tema de in-salud
 */

export const COLORS = {
  primary: '#0EA5E9',      // Sky blue
  primaryDark: '#0284C7',
  danger: '#EF4444',       // Rojo emergencia
  dangerDark: '#DC2626',
  success: '#22C55E',
  warning: '#F59E0B',

  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',

  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray400: '#94A3B8',
  gray500: '#64748B',

  // Colores por tipo de medicamento
  medDaily: '#0EA5E9',
  medSupplement: '#22C55E',
  medRescue: '#F59E0B',
  medForbidden: '#EF4444',

  // Severidad de alergias
  severityLeve: '#22C55E',
  severityModerada: '#F59E0B',
  severityGrave: '#EF4444',
} as const
