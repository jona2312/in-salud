# SETUP — Cómo correr in-salud localmente

## Prerequisitos
- Node.js 18+
- npm o yarn
- Expo Go en tu celular (iOS o Android)

## Pasos

### 1. Instalar dependencias
```bash
cd in-salud-app
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```

Abrir `.env` y completar:
- `EXPO_PUBLIC_SUPABASE_URL` → `https://dkarmazdckwlpmftcoeh.supabase.co`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` → Obtener en Supabase Dashboard → Settings → API → anon key

⚠️ NUNCA commitear el archivo `.env` con valores reales.

### 3. Correr la app
```bash
npm start
```

Escanear el QR con Expo Go en el celular.

### 4. Para iOS Simulator
```bash
npm run ios
```

### 5. Para Android Emulator
```bash
npm run android
```

## Estructura de archivos clave

```
in-salud-app/
├── .env.example        ← Copiar a .env y completar
├── .gitignore          ← .env ya está ignorado
├── app/
│   ├── _layout.tsx     ← Auth guard + re-lock biométrico
│   ├── (auth)/login.tsx
│   └── (tabs)/index.tsx ← Home
├── lib/
│   ├── supabase.ts     ← Cliente con SecureStore
│   └── biometric.ts    ← Face ID / Huella + PIN
├── types/database.ts   ← Tipos del schema salud
└── stores/
    └── useAuthStore.ts ← Estado global de auth
```

## Seguridad — checklist antes de cada build

- [ ] `.env` no está commiteado (`git status`)
- [ ] Variables de entorno correctas para el entorno (dev/prod)
- [ ] RLS activo en Supabase (verificar en Dashboard)
- [ ] Ninguna key hardcodeada en el código
