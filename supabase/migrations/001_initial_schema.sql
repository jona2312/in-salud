-- =========================================================
-- in-salud — Migración completa
-- Proyecto dedicado (no compartido con in-mejora)
-- Schema: salud
-- =========================================================

-- 1. Crear schema
CREATE SCHEMA IF NOT EXISTS salud;

-- 2. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salud.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  email         TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE salud.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_profiles" ON salud.profiles
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ─── PERSONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salud.persons (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name             TEXT NOT NULL,
  birth_date            DATE,
  blood_type            TEXT CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  gender                TEXT CHECK (gender IN ('M','F','otro')),
  avatar_url            TEXT,
  photo_url             TEXT,
  dni                   TEXT,
  obra_social           TEXT,
  obra_social_num       TEXT,
  obra_social_plan      TEXT,
  obra_social_expiry    DATE,
  obra_social_coverage  NUMERIC(5,2),
  bp_systolic           INTEGER,
  bp_diastolic          INTEGER,
  notes                 TEXT,
  is_emergency_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE salud.persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_persons" ON salud.persons
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE INDEX idx_persons_owner ON salud.persons(owner_id);

-- ─── ALLERGIES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salud.allergies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id   UUID NOT NULL REFERENCES salud.persons(id) ON DELETE CASCADE,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  severity    TEXT NOT NULL CHECK (severity IN ('leve','moderada','grave')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE salud.allergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_allergies" ON salud.allergies
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ─── ANTECEDENTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salud.antecedents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id   UUID NOT NULL REFERENCES salud.persons(id) ON DELETE CASCADE,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('enfermedad','cirugia','accidente','otro')),
  description TEXT NOT NULL,
  year        INTEGER,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE salud.antecedents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_antecedents" ON salud.antecedents
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ─── VACCINES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salud.vaccines (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id    UUID NOT NULL REFERENCES salud.persons(id) ON DELETE CASCADE,
  owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  date_applied DATE,
  next_dose    DATE,
  status       TEXT NOT NULL DEFAULT 'completa' CHECK (status IN ('completa','pendiente','vencida')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE salud.vaccines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_vaccines" ON salud.vaccines
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ─── MEDICATIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salud.medications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id        UUID NOT NULL REFERENCES salud.persons(id) ON DELETE CASCADE,
  owner_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('diario','suplemento','rescate','prohibido')),
  dose             TEXT,
  frequency        TEXT,
  time_morning     BOOLEAN NOT NULL DEFAULT FALSE,
  time_afternoon   BOOLEAN NOT NULL DEFAULT FALSE,
  time_evening     BOOLEAN NOT NULL DEFAULT FALSE,
  time_night       BOOLEAN NOT NULL DEFAULT FALSE,
  start_date       DATE,
  end_date         DATE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE salud.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_medications" ON salud.medications
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ─── EMERGENCY CONTACTS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS salud.emergency_contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id   UUID NOT NULL REFERENCES salud.persons(id) ON DELETE CASCADE,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('familiar','medico','otro')),
  name        TEXT NOT NULL,
  phone       TEXT,
  specialty   TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE salud.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_contacts" ON salud.emergency_contacts
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ─── MEDICAL EVENTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS salud.medical_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id    UUID NOT NULL REFERENCES salud.persons(id) ON DELETE CASCADE,
  owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('consulta','estudio','internacion','cirugia','vacuna','otro')),
  title        TEXT NOT NULL,
  description  TEXT,
  doctor       TEXT,
  institution  TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE salud.medical_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_events" ON salud.medical_events
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ─── VITALS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salud.vitals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id       UUID NOT NULL REFERENCES salud.persons(id) ON DELETE CASCADE,
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bp_systolic     INTEGER,
  bp_diastolic    INTEGER,
  heart_rate      INTEGER,
  weight_kg       NUMERIC(5,2),
  glucose_mgdl    NUMERIC(6,2),
  spo2            NUMERIC(4,1),
  temperature_c   NUMERIC(4,1),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE salud.vitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_vitals" ON salud.vitals
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE INDEX idx_vitals_person_date ON salud.vitals(person_id, date DESC);

-- ─── APPOINTMENTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salud.appointments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id    UUID NOT NULL REFERENCES salud.persons(id) ON DELETE CASCADE,
  owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  time         TIME,
  title        TEXT NOT NULL,
  doctor       TEXT,
  institution  TEXT,
  specialty    TEXT,
  type         TEXT NOT NULL DEFAULT 'consulta' CHECK (type IN ('consulta','estudio','control','cirugia','otro')),
  status       TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','completado','cancelado')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE salud.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_appointments" ON salud.appointments
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE INDEX idx_appointments_person_date ON salud.appointments(person_id, date);

-- ─── MEDICATION LOGS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS salud.medication_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id  UUID NOT NULL REFERENCES salud.medications(id) ON DELETE CASCADE,
  person_id      UUID NOT NULL REFERENCES salud.persons(id) ON DELETE CASCADE,
  owner_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  taken_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date           DATE NOT NULL,
  notes          TEXT
);
ALTER TABLE salud.medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_med_logs" ON salud.medication_logs
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ─── DOCUMENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salud.documents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id         UUID NOT NULL REFERENCES salud.persons(id) ON DELETE CASCADE,
  owner_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medical_event_id  UUID REFERENCES salud.medical_events(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  file_url          TEXT NOT NULL,
  file_type         TEXT NOT NULL CHECK (file_type IN ('pdf','imagen','otro')),
  ai_summary        TEXT,
  ai_values         JSONB,
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE salud.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_documents" ON salud.documents
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ─── AUDIT LOG ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salud.audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  table_name  TEXT,
  record_id   UUID,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE salud.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_audit" ON salud.audit_log
  USING (user_id = auth.uid());

-- ─── STORAGE BUCKET avatars ──────────────────────────────
-- Crear manualmente en Dashboard → Storage → New bucket
-- Nombre: avatars, Public: ON
-- Path: {user_id}/{person_id}.jpg

