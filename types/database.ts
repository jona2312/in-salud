/**
 * types/database.ts — Tipos TypeScript del schema salud
 * v2: agrega Vital, Appointment + extiende Person con obra social completa
 */

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type Gender = 'M' | 'F' | 'otro'
export type AllergySeverity = 'leve' | 'moderada' | 'grave'
export type AntecedentType = 'enfermedad' | 'cirugia' | 'accidente' | 'otro'
export type VaccineStatus = 'completa' | 'pendiente' | 'vencida'
export type MedicationType = 'diario' | 'suplemento' | 'rescate' | 'prohibido'
export type MedicalEventType = 'consulta' | 'estudio' | 'internacion' | 'cirugia' | 'vacuna' | 'otro'
export type DocumentFileType = 'pdf' | 'imagen' | 'otro'
export type ContactType = 'familiar' | 'medico' | 'otro'
export type AppointmentType = 'consulta' | 'estudio' | 'control' | 'cirugia' | 'otro'
export type AppointmentStatus = 'pendiente' | 'completado' | 'cancelado'

export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Person = {
  id: string
  owner_id: string
  full_name: string
  birth_date: string | null
  blood_type: BloodType | null
  gender: Gender | null
  avatar_url: string | null      // URL pública en Storage bucket 'avatars'
  photo_url: string | null       // alias legacy — preferir avatar_url
  dni: string | null
  obra_social: string | null
  obra_social_num: string | null // número de afiliado
  obra_social_plan: string | null
  obra_social_expiry: string | null
  obra_social_coverage: number | null
  bp_systolic: number | null
  bp_diastolic: number | null
  notes: string | null
  is_emergency_visible: boolean
  created_at: string
  updated_at: string
}

export type Allergy = {
  id: string
  person_id: string
  name: string
  severity: AllergySeverity
  notes: string | null
  created_at: string
}

export type Antecedent = {
  id: string
  person_id: string
  type: AntecedentType
  description: string
  year: number | null
  notes: string | null
  created_at: string
}

export type Vaccine = {
  id: string
  person_id: string
  name: string
  date_applied: string | null
  next_dose: string | null
  status: VaccineStatus
  notes: string | null
  created_at: string
}

export type Medication = {
  id: string
  person_id: string
  name: string
  type: MedicationType
  dose: string | null
  frequency: string | null
  time_morning: boolean
  time_afternoon: boolean
  time_evening: boolean
  time_night: boolean
  start_date: string | null
  end_date: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type MedicalEvent = {
  id: string
  person_id: string
  date: string
  type: MedicalEventType
  title: string
  description: string | null
  doctor: string | null
  institution: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type MedicalDocument = {
  id: string
  person_id: string
  medical_event_id: string | null
  name: string
  file_url: string
  file_type: DocumentFileType
  ai_summary: string | null
  ai_values: Record<string, unknown> | null
  uploaded_at: string
}

export type EmergencyContact = {
  id: string
  person_id: string
  type: ContactType
  name: string
  phone: string | null
  specialty: string | null
  is_primary: boolean
  created_at: string
}

export type MedicationLog = {
  id: string
  medication_id: string
  person_id: string
  taken_at: string
  date: string
  notes: string | null
}

/** NUEVO v2: signo vital registrado en el tiempo */
export type Vital = {
  id: string
  person_id: string
  date: string
  recorded_at: string
  bp_systolic: number | null
  bp_diastolic: number | null
  heart_rate: number | null
  weight_kg: number | null
  glucose_mgdl: number | null
  spo2: number | null
  temperature_c: number | null
  notes: string | null
  created_at: string
}

/** NUEVO v2: turno / cita médica */
export type Appointment = {
  id: string
  person_id: string
  date: string
  time: string | null
  title: string
  doctor: string | null
  institution: string | null
  specialty: string | null
  type: AppointmentType
  status: AppointmentStatus
  notes: string | null
  created_at: string
}


export type AuditLog = {
  id: string
  user_id: string | null
  action: string
  table_name: string | null
  record_id: string | null
  ip_address: string | null
  created_at: string
}

/**
 * Placeholder — generar los tipos reales con:
 *   supabase gen types typescript --schema salud > types/supabase.generated.ts
 * Por ahora se usa 'any' para no bloquear el build.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any
