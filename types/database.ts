/**
 * types/database.ts — Tipos TypeScript del schema salud
 * Compatible con @supabase/postgrest-js v2+ (GenericSchema requiere Tables + Views + Functions)
 *
 * Para regenerar: npx supabase gen types typescript --project-id dkarmazdckwlpmftcoeh --schema salud
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

export type Document = {
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

export type AuditLog = {
  id: string
  user_id: string
  action: string
  table_name: string | null
  record_id: string | null
  ip_address: string | null
  created_at: string
}

// Database type compatible con GenericSchema de @supabase/postgrest-js v2+
// Requiere: Tables + Views + Functions por schema
// Cada tabla requiere: Row + Insert + Update + Relationships
export type Database = {
  salud: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: {
        id: string
        full_name?: string | null
        email?: string | null
        avatar_url?: string | null
      }
        Update: Partial<Omit<Profile, 'id'>>
        Relationships: never[]
      }
      persons: {
        Row: Person
        Insert: {
        owner_id: string
        full_name: string
        birth_date?: string | null
        blood_type?: BloodType | null
        gender?: Gender | null
        photo_url?: string | null
        dni?: string | null
        obra_social?: string | null
        obra_social_num?: string | null
        bp_systolic?: number | null
        bp_diastolic?: number | null
        notes?: string | null
        is_emergency_visible?: boolean
      }
        Update: Partial<Omit<Person, 'id' | 'created_at' | 'updated_at'>>
        Relationships: never[]
      }
      allergies: {
        Row: Allergy
        Insert: {
        person_id: string
        name: string
        severity: AllergySeverity
        notes?: string | null
      }
        Update: Partial<Omit<Allergy, 'id' | 'created_at'>>
        Relationships: never[]
      }
      antecedents: {
        Row: Antecedent
        Insert: {
        person_id: string
        type: AntecedentType
        description: string
        year?: number | null
        notes?: string | null
      }
        Update: Partial<Omit<Antecedent, 'id' | 'created_at'>>
        Relationships: never[]
      }
      vaccines: {
        Row: Vaccine
        Insert: {
        person_id: string
        name: string
        status: VaccineStatus
        date_applied?: string | null
        next_dose?: string | null
        notes?: string | null
      }
        Update: Partial<Omit<Vaccine, 'id' | 'created_at'>>
        Relationships: never[]
      }
      medications: {
        Row: Medication
        Insert: {
        person_id: string
        name: string
        type: MedicationType
        dose?: string | null
        frequency?: string | null
        time_morning?: boolean
        time_afternoon?: boolean
        time_evening?: boolean
        time_night?: boolean
        start_date?: string | null
        end_date?: string | null
        is_active?: boolean
        notes?: string | null
      }
        Update: Partial<Omit<Medication, 'id' | 'created_at' | 'updated_at'>>
        Relationships: never[]
      }
      medical_events: {
        Row: MedicalEvent
        Insert: {
        person_id: string
        date: string
        type: MedicalEventType
        title: string
        description?: string | null
        doctor?: string | null
        institution?: string | null
        notes?: string | null
      }
        Update: Partial<Omit<MedicalEvent, 'id' | 'created_at' | 'updated_at'>>
        Relationships: never[]
      }
      documents: {
        Row: Document
        Insert: {
        person_id: string
        name: string
        file_url: string
        file_type: DocumentFileType
        medical_event_id?: string | null
        ai_summary?: string | null
        ai_values?: Record<string, unknown> | null
      }
        Update: Partial<Omit<Document, 'id' | 'uploaded_at'>>
        Relationships: never[]
      }
      emergency_contacts: {
        Row: EmergencyContact
        Insert: {
        person_id: string
        type: ContactType
        name: string
        is_primary?: boolean
        phone?: string | null
        specialty?: string | null
      }
        Update: Partial<Omit<EmergencyContact, 'id' | 'created_at'>>
        Relationships: never[]
      }
      medication_logs: {
        Row: MedicationLog
        Insert: {
        medication_id: string
        person_id: string
        taken_at: string
        date: string
        notes?: string | null
      }
        Update: Partial<Omit<MedicationLog, 'id'>>
        Relationships: never[]
      }
      audit_log: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: never
        Relationships: never[]
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      blood_type: BloodType
      gender: Gender
      allergy_severity: AllergySeverity
      antecedent_type: AntecedentType
      vaccine_status: VaccineStatus
      medication_type: MedicationType
      medical_event_type: MedicalEventType
      document_file_type: DocumentFileType
      contact_type: ContactType
    }
    CompositeTypes: {}
  }
}
