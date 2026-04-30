/**
 * types/database.ts — Tipos TypeScript del schema salud
 * Generados manualmente basados en las migraciones de Supabase
 * Para regenerar automáticamente: npx supabase gen types typescript --project-id dkarmazdckwlpmftcoeh
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

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Person {
  id: string
  owner_id: string
  full_name: string
  birth_date: string | null
  blood_type: BloodType | null
  gender: Gender | null
  photo_url: string | null
  dni: string | null
  obra_social: string | null
  obra_social_num: string | null
  bp_systolic: number | null
  bp_diastolic: number | null
  notes: string | null
  is_emergency_visible: boolean
  created_at: string
  updated_at: string
}

export interface Allergy {
  id: string
  person_id: string
  name: string
  severity: AllergySeverity
  notes: string | null
  created_at: string
}

export interface Antecedent {
  id: string
  person_id: string
  type: AntecedentType
  description: string
  year: number | null
  notes: string | null
  created_at: string
}

export interface Vaccine {
  id: string
  person_id: string
  name: string
  date_applied: string | null
  next_dose: string | null
  status: VaccineStatus
  notes: string | null
  created_at: string
}

export interface Medication {
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

export interface MedicalEvent {
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

export interface Document {
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

export interface EmergencyContact {
  id: string
  person_id: string
  type: ContactType
  name: string
  phone: string | null
  specialty: string | null
  is_primary: boolean
  created_at: string
}

export interface MedicationLog {
  id: string
  medication_id: string
  person_id: string
  taken_at: string
  date: string
  notes: string | null
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  table_name: string | null
  record_id: string | null
  ip_address: string | null
  created_at: string
}

// Tipo helper para el cliente Supabase tipado
export interface Database {
  salud: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at' | 'updated_at'>; Update: Partial<Profile> }
      persons: { Row: Person; Insert: Omit<Person, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Person> }
      allergies: { Row: Allergy; Insert: Omit<Allergy, 'id' | 'created_at'>; Update: Partial<Allergy> }
      antecedents: { Row: Antecedent; Insert: Omit<Antecedent, 'id' | 'created_at'>; Update: Partial<Antecedent> }
      vaccines: { Row: Vaccine; Insert: Omit<Vaccine, 'id' | 'created_at'>; Update: Partial<Vaccine> }
      medications: { Row: Medication; Insert: Omit<Medication, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Medication> }
      medical_events: { Row: MedicalEvent; Insert: Omit<MedicalEvent, 'id' | 'created_at' | 'updated_at'>; Update: Partial<MedicalEvent> }
      documents: { Row: Document; Insert: Omit<Document, 'id' | 'uploaded_at'>; Update: Partial<Document> }
      emergency_contacts: { Row: EmergencyContact; Insert: Omit<EmergencyContact, 'id' | 'created_at'>; Update: Partial<EmergencyContact> }
      medication_logs: { Row: MedicationLog; Insert: Omit<MedicationLog, 'id'>; Update: Partial<MedicationLog> }
      audit_log: { Row: AuditLog; Insert: Omit<AuditLog, 'id' | 'created_at'>; Update: never }
    }
  }
}
