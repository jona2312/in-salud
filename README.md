# in-salud — Ficha clínica familiar

App móvil privada para centralizar el historial clínico de todo el grupo familiar. Sin integraciones hospitalarias, sin datos en la nube de terceros (solo tu propio Supabase), sin IA médica — solo un repositorio seguro y rápido de información vital.

---

## Funcionalidades actuales (v1 + v2)

### MVP (v1)
- **Familia**: lista de personas con foto de perfil y datos rápidos
- **Ficha clínica**: alergias, medicación activa, contactos de emergencia
- **Modo SOS**: información crítica en rojo, un toque, sin requerir reautenticación
- **QR de emergencia**: código QR offline con todos los datos críticos, scaneable sin la app
- **Medicamentos**: gestión completa (diario, rescate, prohibido, suplemento)
- **Historial**: eventos médicos, antecedentes, vacunas
- **Alta de persona**: formulario con grupo sanguíneo, presión habitual, obra social
- **Editar persona**: actualiza todos los datos incluyendo foto de perfil

### v2
- **Vitales**: registro de signos vitales con historial (presión, frecuencia cardíaca, peso, glucosa, SpO2, temperatura)
- **Turnos**: agenda de citas médicas con estado (pendiente / completado / cancelado)
- **Asistente IA**: chat con visión para analizar estudios y recetas (requiere Edge Function)
- **Foto de perfil**: upload a Supabase Storage por persona

---

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | React Native + Expo | SDK 52 |
| Routing | expo-router | v4 |
| Backend | Supabase | PostgreSQL + RLS |
| Estado servidor | TanStack Query | v5 |
| Estado cliente | Zustand | v5 |
| Auth | Supabase Auth | - |
| Sesión segura | expo-secure-store | ~14 |
| Imágenes | expo-image-picker | ~16 |
| QR | react-native-qrcode-svg | ^6.3 |
| Tipos | TypeScript | ^5.3 |

---

## Setup local

### 1. Clonar y dependencias
```bash
git clone https://github.com/tu-usuario/in-salud-app.git
cd in-salud-app
npm install
```

### 2. Variables de entorno
```bash
cp .env.example .env
```
Completar en `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```
Los valores están en: **Supabase Dashboard → Settings → API**.

### 3. Base de datos
Las migraciones están en `supabase/migrations/`. Aplicarlas en orden desde el dashboard SQL o con la CLI:
```bash
supabase db push
```

### 4. Storage (para fotos de perfil)
Crear el bucket `avatars` en **Supabase Dashboard → Storage → New bucket**:
- Name: `avatars`
- Public: **sí** (las URLs son públicas pero los paths son privados por usuario)
- Política de INSERT/UPDATE: `auth.uid()::text = (storage.foldername(name))[1]`

### 5. Correr en desarrollo
```bash
npx expo start
```
Escanear el QR con la app **Expo Go** en el celular (mismo WiFi).

---

## Build de producción (Android)

```bash
eas build --profile preview --platform android
```

> **Problema conocido en Windows**: EAS falla con EPERM al intentar remover el directorio `.git/hooks`.
> Solución:
> ```bash
> git config --local core.hooksPath /dev/null
> eas build --profile preview --platform android
> git config --local --unset core.hooksPath
> ```

El build genera un `.apk` descargable desde [expo.dev](https://expo.dev).

---

## Arquitectura de seguridad

### Autenticación
- Supabase Auth con email + password
- Sesión persistida en **expo-secure-store** (keychain iOS / keystore Android)
- No se usa AsyncStorage (no encriptado)
- `autoRefreshToken: true` — tokens se renuevan silenciosamente

### Row Level Security (RLS)
Todas las tablas tienen políticas RLS que garantizan:
```sql
-- Solo el dueño puede ver/modificar sus datos
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid())
```
El `owner_id` **nunca** se acepta del cliente — siempre se toma de `auth.uid()` en el servidor.

### API Keys
- Solo el **anon key** está en el cliente (variable `EXPO_PUBLIC_`)
- El **service role key** nunca se incluye en la app
- La API key de Anthropic (para el asistente IA) solo existe en la Edge Function de Supabase, nunca en el cliente

### QR de emergencia
- Los datos se **embeben directamente** en el QR como texto plano
- No requiere conexión a internet ni la app instalada para escanearlo
- No se guarda ni se sube el QR — se genera en memoria

---

## Esquema de base de datos

Schema dedicado: `salud` (aislado del schema `public`).

```sql
-- Personas
salud.persons (
  id uuid PK, owner_id uuid FK→auth.users,
  full_name text, birth_date date, blood_type text, gender text,
  obra_social text, obra_social_number text, obra_social_plan text, obra_social_expiry date,
  bp_systolic int, bp_diastolic int,
  notes text, avatar_url text, is_emergency_visible bool
)

-- Alergias
salud.allergies (id, person_id FK, owner_id, name, severity[grave|moderada|leve], notes)

-- Medicamentos
salud.medications (id, person_id, owner_id, name, dose, frequency, type[diario|rescate|prohibido|suplemento], is_active, notes)

-- Contactos de emergencia
salud.emergency_contacts (id, person_id, owner_id, name, phone, type[familiar|medico|otro], specialty, is_primary)

-- Historial
salud.medical_events (id, person_id, owner_id, date, type, description, institution, notes)
salud.antecedents (id, person_id, owner_id, type[enfermedad|cirugia|accidente|otro], name, date, notes)
salud.vaccines (id, person_id, owner_id, name, date, next_dose, notes)

-- v2: Vitales
salud.vitals (
  id, person_id, owner_id, date, recorded_at,
  bp_systolic, bp_diastolic, heart_rate, weight_kg,
  glucose_mgdl, spo2, temperature_c, notes
)

-- v2: Turnos
salud.appointments (
  id, person_id, owner_id, date, time, title,
  doctor, institution, specialty,
  type[consulta|estudio|control|cirugia|otro],
  status[pendiente|completado|cancelado], notes
)

-- v2: logs y documentos (tablas listas, UI pendiente)
salud.medication_logs (id, person_id, medication_id, taken_at, notes)
salud.documents (id, person_id, owner_id, title, file_url, file_type, date, notes)
```

---

## Pantallas y navegación

### Tab bar (5 tabs visibles)
| Tab | Archivo | Descripción |
|---|---|---|
| 🏠 Inicio | `index.tsx` | Lista familiar, acceso a ficha y edición |
| ❤️ Vitales | `vitales.tsx` | Signos vitales, selector de persona, historial |
| 🚨 SOS | `emergencia.tsx` | Info crítica + QR offline |
| 📅 Turnos | `turnos.tsx` | Agenda de citas médicas |
| 🤖 IA | `asistente.tsx` | Chat con asistente, análisis de imágenes |

### Pantallas ocultas (accesibles por navegación)
| Pantalla | Acceso desde |
|---|---|
| `ficha.tsx` | Tarjeta de persona en Home |
| `medicamentos.tsx` | Acceso rápido dentro de Ficha |
| `historial.tsx` | Acceso rápido dentro de Ficha |
| `agregar-persona.tsx` | Botón en Home |
| `editar-persona.tsx` | Botón ✏️ en tarjeta de Home y botón en Ficha |

---

## Edge Function: asistente IA (pendiente de deploy)

La pantalla `asistente.tsx` ya está implementada. Requiere desplegar la Edge Function:

```typescript
// supabase/functions/ai-assistant/index.ts
import Anthropic from 'npm:@anthropic-ai/sdk'

Deno.serve(async (req) => {
  const { message, imageUri, history } = await req.json()
  const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

  const content = []
  if (imageUri) {
    // Convertir imageUri a base64 y agregar como image block
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageUri } })
  }
  content.push({ type: 'text', text: message })

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: 'Sos un asistente de salud...',
    messages: [...history, { role: 'user', content }],
  })

  return new Response(JSON.stringify({ reply: response.content[0].text }))
})
```

Deploy:
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy ai-assistant
```

---

## Roadmap v3

- [ ] Registros de toma de medicamentos (tabla `medication_logs` lista)
- [ ] Gestión de documentos médicos (tabla `documents` lista)
- [ ] Notificaciones de turnos próximos (expo-notifications)
- [ ] Exportar ficha como PDF
- [ ] Biometría para desbloquear la app (expo-local-authentication ya instalado)
- [ ] Tests unitarios e integración (jest + testing-library)
- [ ] Build iOS (requiere cuenta Apple Developer)
