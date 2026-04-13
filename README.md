# in-salud

> App de salud familiar — ficha clinica, medicamentos, historial medico, modo emergencia y agente IA para analisis de estudios.

[![Status](https://img.shields.io/badge/status-MVP%20en%20construccion-orange)]()
[![Stack](https://img.shields.io/badge/stack-React%20Native%20%2B%20Expo%20%2B%20Supabase-blue)]()
[![Version](https://img.shields.io/badge/version-0.1.0-green)]()

---

## Vision

Plataforma movil privada y familiar para centralizar datos de salud de todos los miembros del hogar (adultos y menores). Sin integraciones hospitalarias. Sin flujos clinicos. Solo informacion util, accesible en segundos, especialmente en emergencias.

---

## Funcionalidades MVP

| Modulo | Descripcion | Estado |
|--------|-------------|--------|
| Ficha rapida | Datos basicos por persona: nombre, foto, edad, sangre | Pendiente |
| Modo emergencia | Pantalla critica visible sin login, boton SOS push | Pendiente |
| Medicamentos | Diarios, suplementos, rescate y prohibidos | Pendiente |
| Alergias | Con alertas visuales en emergencia | Pendiente |
| Antecedentes | Diagnosticos con año de inicio | Pendiente |
| Vacunas | Con estado (aplicada / pendiente refuerzo) | Pendiente |
| Historial medico | Timeline de eventos, consultas, estudios | Pendiente |
| Subir estudios | Foto o PDF con extraccion IA de valores | Pendiente |
| Asistente de voz | Dictado para completar campos por pantalla | Pendiente |
| Perfiles menores | Gestionados por adulto, sin acceso propio | Pendiente |
| SOS push | Notificacion a todos los contactos familiares | Pendiente |
| Contactos | Emergencia + medico de cabecera con llamada directa | Pendiente |

---

## Stack tecnico

```
Frontend:    React Native + Expo SDK
Auth:        Supabase Auth + Expo LocalAuthentication (biometrico)
Base datos:  Supabase PostgreSQL + RLS (aislamiento por familia)
Storage:     Supabase Storage (fotos, PDFs)
Push:        Expo Push Notifications + FCM + APNs
IA:          GPT-4o Vision (analisis estudios) + GPT-4o mini (voz)
STT:         Native device SpeechRecognizer (gratis)
Agente:      n8n self-hosted (Railway/Render)
Admin:       Retool (dashboard interno)
Pagos:       MercadoPago / Stripe (web, sin fee de tienda)
Distribucion: TestFlight (iOS) + APK directo (Android)
```

---

## Arquitectura

```
[App Movil] <---> [Supabase BaaS]
                       |
                  +----+----+
                  |         |
               [Auth]   [PostgreSQL]
                             |
                         [RLS Rules]
                             |
                    +--------+--------+
                    |                 |
              [families]          [storage]
              [profiles]          [estudios]
              [medications]       [fotos]
              [events]

[IA Pipeline] <---> [n8n] <---> [GPT-4o Vision]
                                [GPT-4o mini]
```

---

## Modelo de datos (simplificado)

### Tablas principales

```sql
families        -- grupo familiar
profiles        -- adulto o menor (sin login propio)
medications     -- medicamentos activos, suplementos, rescate, prohibidos
allergies       -- alergias con severidad
conditions      -- antecedentes / diagnosticos
vaccines        -- vacunas con estado
events          -- historial medico (consultas, estudios, cirugias)
documents       -- archivos adjuntos a eventos
contacts        -- emergencia + medico por perfil
sos_alerts      -- log de alertas enviadas
invite_codes    -- codigos de acceso para distribucion controlada
ai_credits      -- pool de creditos IA por familia
```

---

## Mapa de pantallas

```
Home
├── Lista de perfiles familiares
├── Acceso rapido (Emergencia, Medicamentos, Historial, Subir estudio)
└── Ultimo evento registrado

Ficha del paciente
├── Datos personales (DNI oculto, sangre, peso, talla, presion)
├── Cobertura medica (obra social, N° afiliado oculto)
├── Alergias + Prohibidos
├── Antecedentes
├── Vacunas
└── Contactos con llamada directa

Modo Emergencia (sin login)
├── Selector de perfil
├── Datos criticos (sangre, presion, alergias, prohibidos)
├── Contactos con llamada
└── Boton SOS (push a todos los contactos)

Medicamentos
├── Filtro: Todos / Manana / Tarde / Noche / Rescate
├── Cards con dosis, instruccion y check "tomado hoy"
├── Seccion Prohibidos
└── Agregar medicamento

Historial medico
├── Filtro por tipo (analisis, consultas, imagenes, vacunas)
├── Barra de busqueda
├── CTA subir estudio con IA
├── Timeline agrupado por año
└── Registrar evento
```

---

## Plan de construccion (6 semanas)

| Semana | Foco | Entregables |
|--------|------|-------------|
| 1 | Setup + Auth | Expo app, Supabase schema, login biometrico, navegacion base |
| 2 | Perfiles | Ficha completa, CRUD medicamentos, alergias, contactos |
| 3 | Modo emergencia | Pantalla SOS, push notifications, WhatsApp fallback |
| 4 | Historial | Timeline eventos, subida de fotos/PDFs, storage |
| 5 | IA | n8n pipeline, GPT-4o Vision para estudios, asistente de voz |
| 6 | Polish | Admin dashboard Retool, invite codes, TestFlight, APK |

---

## Modelo de costos (referencia)

| Item | Costo estimado |
|------|---------------|
| Supabase Free | $0/mes |
| Expo EAS Build | $0/mes (free tier) |
| n8n (Railway) | ~$5/mes |
| GPT-4o Vision (50 analisis/familia) | ~$0.30/mes |
| GPT-4o mini (100 voz/familia) | ~$0.02/mes |
| **Total por familia** | **~$0.32/mes** |

Modelo de negocio: pago anual unico (~$25 USD/familia). Pool de creditos IA compartido por familia, no por persona.

---

## Distribucion privada

- iOS: TestFlight (hasta 10.000 testers)
- Android: APK firmado + distribucion directa
- Acceso por **invite codes** (sin tienda, sin fee 15-30%)
- Pagos via web (MercadoPago / Stripe) antes de la descarga

---

## Estructura del repo

```
in-salud/
├── README.md              <- Este archivo
├── docs/
│   ├── PRD.md             <- Product Requirements Document
│   ├── ARCHITECTURE.md    <- Arquitectura tecnica detallada
│   ├── DATA_MODEL.md      <- Schema de base de datos
│   ├── BACKLOG.md         <- Backlog priorizado
│   ├── ROADMAP.md         <- Plan de 6 semanas
│   └── PRICING.md         <- Modelo de costos y precios
├── mockups/
│   ├── mockup_app_salud.jsx
│   ├── mockup_pantallas_detalle.jsx
│   └── mockup_salud_compartir.html
└── app/                   <- Codigo fuente (React Native / Expo)
```

---

## Proximos pasos

- [ ] Setup repositorio y estructura de carpetas
- [ ] Crear proyecto Supabase y schema inicial
- [ ] `npx create-expo-app in-salud --template blank-typescript`
- [ ] Configurar Expo Router + Zustand
- [ ] Implementar auth biometrico
- [ ] Construir pantalla Home + Ficha

---

## Equipo

| Rol | Responsable |
|-----|-------------|
| Product / CTO | Jonatan |
| Desarrollo mobile | TBD |
| Diseño UI/UX | Mockups aprobados |

---

*Ultimo update: Abril 2026 — MVP en evaluacion tecnica*
