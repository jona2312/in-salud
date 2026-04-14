# ARCHITECTURE.md — Arquitectura técnica in-salud

## Vision del producto

Plataforma móvil privada y familiar para centralizar datos de salud de todos los miembros del hogar. Sin integraciones hospitalarias, sin flujos clínicos complejos, sin IA médica. Solo información útil, accesible en segundos, especialmente en emergencias.

---

## Stack tecnológico

### Frontend
- **React Native** + **Expo SDK 52** (managed workflow)
- - **Expo Router** v3 — navegación basada en archivos
  - - **TypeScript** estricto
    - - **Zustand** — estado global ligero
      - - **React Query (TanStack)** — cache y sincronización de datos
        - - **NativeWind** — Tailwind CSS para React Native
         
          - ### Backend
          - - **Supabase** — PostgreSQL + Auth + Storage + Realtime + Edge Functions
            - - Schema dedicado `salud` en proyecto `in-mejora` (temporal, ver DATABASE.md)
              - - **Row Level Security (RLS)** — seguridad a nivel de fila
               
                - ### Auth
                - - **Supabase Auth** — email/password + magic link
                  - - **Expo LocalAuthentication** — Face ID / Huella dactilar como 2do factor local
                    - - Re-lock automático al ir app a background
                     
                      - ### Storage
                      - - **Supabase Storage** — buckets privados
                        -   - `salud-documents` — PDFs y estudios médicos
                            -   - `salud-photos` — fotos de perfil
                             
                                - ### Notificaciones (futuro)
                                - - **Expo Push Notifications** + FCM + APNs
                                  - - Recordatorios de medicamentos
                                    - - Alertas SOS a contactos de emergencia
                                     
                                      - ### IA (futuro v1.1)
                                      - - **GPT-4o Vision** — parseo de estudios médicos en PDF/imagen
                                        - - Edge Function de Supabase como proxy seguro
                                          - - Resultados guardados en `documents.ai_summary` y `documents.ai_values` (JSONB)
                                           
                                            - ---

                                            ## Arquitectura de módulos

                                            ```
                                            in-salud/
                                            ├── app/                        # Expo Router (screens)
                                            │   ├── (auth)/
                                            │   │   ├── login.tsx
                                            │   │   └── register.tsx
                                            │   ├── (tabs)/
                                            │   │   ├── index.tsx           # Home — selector de familia
                                            │   │   ├── ficha/[id].tsx      # Ficha clínica por persona
                                            │   │   ├── medicamentos/[id].tsx
                                            │   │   ├── historial/[id].tsx
                                            │   │   └── emergencia/[id].tsx
                                            │   └── _layout.tsx
                                            ├── components/                 # UI components reutilizables
                                            │   ├── PersonCard.tsx
                                            │   ├── MedicationItem.tsx
                                            │   ├── EmergencyBanner.tsx
                                            │   └── SOSButton.tsx
                                            ├── lib/
                                            │   ├── supabase.ts             # Cliente Supabase configurado
                                            │   ├── auth.ts                 # Helpers de autenticación
                                            │   └── biometric.ts           # Expo LocalAuthentication
                                            ├── stores/
                                            │   ├── usePersonStore.ts       # Estado de personas seleccionadas
                                            │   └── useAuthStore.ts        # Estado de autenticación
                                            ├── hooks/
                                            │   ├── usePersons.ts
                                            │   ├── useMedications.ts
                                            │   └── useMedicalEvents.ts
                                            ├── types/
                                            │   └── database.ts             # Tipos TypeScript generados de Supabase
                                            └── docs/                      # Este directorio
                                            ```

                                            ---

                                            ## Decisiones arquitecturales clave

                                            ### 1. Schema `salud` en proyecto `in-mejora`
                                            **Decisión:** usar schema separado en proyecto existente en lugar de proyecto nuevo.
                                            **Motivo:** límite de 2 proyectos en plan Free de Supabase, ambos activos.
                                            **Migración:** cuando haya proyecto propio, `pg_dump --schema=salud` y restore.
                                            **Riesgo:** bajo — RLS aísla los datos completamente del schema `public`.

                                            ### 2. Expo Managed Workflow
                                            **Decisión:** Expo managed sobre bare React Native.
                                            **Motivo:** velocidad de desarrollo, OTA updates, builds sin Mac propio.
                                            **Trade-off:** menos control de native code. Aceptable para este MVP.
                                            **Eject trigger:** si necesitamos SDKs nativos que no tiene Expo (ej: HealthKit directo).

                                            ### 3. Modo Emergencia sin login
                                            **Decisión:** la pantalla de emergencia es accesible con un código PIN de 4 dígitos (no biometría completa).
                                            **Motivo:** en una emergencia real, Face ID puede fallar, el usuario puede no estar consciente.
                                            **Implementación:** PIN corto guardado con SecureStore de Expo. Datos mostrados = solo campos marcados `is_emergency_visible = true`.
                                            **Privacidad:** el modo emergencia muestra un subset de datos, no el perfil completo.

                                            ### 4. Supabase en lugar de Firebase
                                            **Decisión:** Supabase sobre Firebase.
                                            **Motivo:** SQL relacional (datos de salud son muy relacionales), RLS nativo más expresivo, open source, costo predecible, ya tenemos cuenta activa.

                                            ### 5. Sin IA en MVP
                                            **Decisión:** los campos `ai_summary` y `ai_values` existen en la DB pero no se usan en MVP.
                                            **Motivo:** el parseo IA agrega 2-3 semanas de desarrollo y complejidad. Se prioriza el core.
                                            **Activación:** una Edge Function de Supabase + llamada a OpenAI API. Sin cambios en schema.

                                            ---

                                            ## Flujo de autenticación

                                            ```
                                            App launch
                                                │
                                                ├── Sin sesión → Login screen (email + password)
                                                │                       │
                                                │               Auth exitoso → Supabase session
                                                │
                                                └── Con sesión → Biometric check (Face ID / Huella)
                                                                        │
                                                                ✅ OK → Home screen
                                                                ❌ Fail → PIN fallback → Home screen

                                            Background → App re-lock automático después de 5 min
                                            ```

                                            ---

                                            ## Flujo de datos

                                            ```
                                            Screen → Hook (React Query) → Supabase Client → RLS → PostgreSQL (schema salud)
                                                            ↕
                                                        Zustand store (estado local/cache)
                                            ```

                                            ---

                                            ## Plan de migración a proyecto Supabase propio

                                            Cuando se libere un slot (pausa de in-mejora o upgrade de plan):

                                            1. Crear nuevo proyecto `in-salud` en Supabase
                                            2. 2. `pg_dump --schema=salud -h db.dkarmazdckwlpmftcoeh.supabase.co -U postgres > salud_backup.sql`
                                               3. 3. Aplicar mismo schema SQL en nuevo proyecto
                                                  4. 4. Migrar Storage buckets
                                                     5. 5. Actualizar `SUPABASE_URL` y `SUPABASE_ANON_KEY` en variables de entorno
                                                        6. 6. Re-deploy
                                                          
                                                           7. **Tiempo estimado:** 2-3 horas. Sin cambios de código en la app.
                                                          
                                                           8. ---
                                                          
                                                           9. ## Variables de entorno requeridas
                                                          
                                                           10. ```env
                                                               EXPO_PUBLIC_SUPABASE_URL=https://dkarmazdckwlpmftcoeh.supabase.co
                                                               EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
                                                               ```

                                                               > El anon key es público por diseño. La seguridad real está en RLS.
                                                               > > Nunca commitear el service_role key.
                                                               > >
                                                               > > ---
                                                               > >
                                                               > > ## Próximos hitos técnicos
                                                               > >
                                                               > > | Semana | Objetivo |
                                                               > > |--------|----------|
                                                               > > | 1 | Scaffold + Auth + navegación base + Home |
                                                               > > | 2 | Ficha clínica completa (CRUD personas) |
                                                               > > | 3 | Medicamentos + logs diarios |
                                                               > > | 4 | Historial médico + upload de documentos |
                                                               > > | 5 | Modo emergencia + contactos + pulido UX |
                                                               > > | 6 | TestFlight + APK beta + bugfixes |
