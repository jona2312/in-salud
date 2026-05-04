# CLAUDE.md — Contexto del proyecto in-salud

## Qué es esto
App móvil de historial clínico familiar, **privada y offline-first** (sin integraciones hospitalarias).
Stack: React Native + Expo SDK 52 · Supabase (schema `salud`) · TypeScript strict.
Plataforma objetivo: Android (distribución interna vía EAS), luego iOS.

## Stack técnico
| Capa | Tecnología |
|---|---|
| Framework | React Native 0.76 + Expo SDK 52 (managed workflow) |
| Routing | expo-router v4 (file-based) |
| Estado server | @tanstack/react-query v5 |
| Estado cliente | zustand v5 |
| Backend | Supabase (PostgreSQL schema `salud`, RLS, Storage) |
| Auth | Supabase Auth + expo-secure-store (NO AsyncStorage) |
| Biometría | expo-local-authentication |
| Cámara/galería | expo-image-picker |
| QR | react-native-qrcode-svg + react-native-svg |
| Tipos | types/database.ts — actualizar al cambiar schema |

## Estructura de archivos clave
```
app/
  (auth)/login.tsx          — autenticación con email/password
  (tabs)/_layout.tsx        — 5 tabs visibles + pantallas ocultas
  (tabs)/index.tsx          — Home: lista familiar con fotos y acceso rápido
  (tabs)/vitales.tsx        — signos vitales por persona (v2)
  (tabs)/emergencia.tsx     — SOS: info crítica + QR offline
  (tabs)/turnos.tsx         — agenda de citas médicas (v2)
  (tabs)/asistente.tsx      — chat IA con visión (v2, requiere Edge Function)
  (tabs)/ficha.tsx          — ficha completa de persona + accesos a sub-pantallas
  (tabs)/agregar-persona.tsx — formulario de alta
  (tabs)/editar-persona.tsx  — formulario de edición + foto de perfil (v2)
  (tabs)/medicamentos.tsx   — gestión de medicamentos
  (tabs)/historial.tsx      — eventos, antecedentes, vacunas

lib/supabase.ts             — cliente Supabase (SecureStore, schema salud)
stores/useAuthStore.ts      — sesión de usuario
types/database.ts           — tipos TypeScript del schema
constants/theme.ts          — colores y tema
components/modals/          — modales reutilizables (AddAllergyModal, etc.)
```

## Esquema de base de datos (schema: salud)

### Tablas principales
| Tabla | Descripción |
|---|---|
| `persons` | Persona del grupo familiar |
| `allergies` | Alergias con severidad |
| `medications` | Medicamentos (diario, rescate, prohibido, suplemento) |
| `emergency_contacts` | Contactos de emergencia y médicos |
| `medical_events` | Eventos médicos (consultas, cirugías, etc.) |
| `antecedents` | Antecedentes médicos (enfermedades crónicas, etc.) |
| `vaccines` | Vacunas |
| `vitals` | Signos vitales con timestamp (v2) |
| `appointments` | Turnos médicos con estado (v2) |
| `medication_logs` | Registro de toma de medicamentos (v2, no implementado en UI) |
| `documents` | Documentos adjuntos (v2, no implementado en UI) |

### Campos clave de `persons`
- `owner_id` UUID — siempre tomado de la sesión, nunca del cliente
- `blood_type`, `gender`, `birth_date`
- `bp_systolic`, `bp_diastolic` — presión habitual en mmHg
- `obra_social`, `obra_social_number`, `obra_social_plan`, `obra_social_expiry`
- `avatar_url` — URL pública en Storage bucket `avatars`
- `notes` — notas urgentes visibles en SOS
- `is_emergency_visible` bool

### RLS — TODAS las tablas tienen políticas:
```sql
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid())
```

## Supabase Storage
Bucket `avatars` — debe crearse manualmente en el dashboard:
- Path: `{user_id}/{person_id}.jpg`
- Política: solo usuarios autenticados cuyo uid == carpeta del path

## Asistente IA (Edge Function)
La pantalla `asistente.tsx` llama a:
```ts
supabase.functions.invoke('ai-assistant', {
  body: { message: string, imageUri?: string, history: Message[] }
})
```
La Edge Function **`ai-assistant` aún no está desplegada**. Necesita:
1. Crear en `supabase/functions/ai-assistant/index.ts`
2. Llamar a la API de Anthropic con la API key como secreto de Supabase
3. Desplegar con `supabase functions deploy ai-assistant`

## Variables de entorno requeridas
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```
Copiar de `.env.example` → `.env` (nunca commitear `.env`).

## Comandos útiles
```bash
npx expo start              # dev local (escanear QR con Expo Go)
npx expo start --android    # Android directo
npx expo start --web        # Web (requiere react-dom + react-native-web)
eas build --profile preview --platform android  # Build EAS

# Si EAS falla por EPERM en Windows (rmdir hooks):
git config --local core.hooksPath /dev/null
eas build --profile preview --platform android
git config --local --unset core.hooksPath
```

## Decisiones de diseño importantes
1. **5 tabs en la navegación** — límite estándar mobile. Ficha, Historial y Medicamentos son accesibles desde la Ficha de cada persona.
2. **QR offline** — el QR en emergencia.tsx embebe los datos directamente como texto plano, funciona sin conexión ni app instalada.
3. **SecureStore sobre AsyncStorage** — las sesiones se guardan encriptadas en el keychain del OS.
4. **owner_id siempre del server** — nunca se acepta del cliente. Garantizado también por RLS.
5. **Schema `salud` dedicado** — aislado del schema `public`. Evita colisiones con otros proyectos en el mismo Supabase.

## Convenciones de código
- TypeScript strict: `noImplicitAny: true`, `strictNullChecks: true`
- Queries: `useQuery` con queryKey descriptivo (`['persons']`, `['vitals', personId]`)
- Invalidación: siempre `queryClient.invalidateQueries` después de mutaciones
- Estilos: `StyleSheet.create` inline en cada archivo (no CSS-in-JS externo)
- Seguridad: comentarios `SEGURIDAD:` en cada archivo que maneja datos sensibles

## Lo que falta (v3 backlog)
- [ ] Edge Function `ai-assistant` (Anthropic API)
- [ ] Pantalla de documentos (bucket `documents` ya existe en DB)
- [ ] Registro de toma de medicamentos (tabla `medication_logs` lista)
- [ ] Notificaciones de turnos (expo-notifications)
- [ ] Exportar ficha como PDF
- [ ] Modo offline con sincronización
- [ ] Tests (jest + testing-library/react-native)
