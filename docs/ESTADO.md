# Estado de entrega — 21/09/2026

## Referencia
Base revalidada: `master` en `a6685c29c25fad2b41c510841135993f9cb0720c`. Rama: `codex/insalud-safe-foundation`. Primer incremento de reparación + alcance de producto + demo. No merge, APK ni cambios de producción.

## Cambios efectivos en código
- Corregidos fragmentos duplicados en navegación y turnos.
- TypeScript de app separado de Deno; ESLint 9 configurado y suite Node ejecutable.
- Dependencia directa fijada `@react-native/js-polyfills@0.76.9` para que Expo resuelva el empaquetado web. Sin parches a node_modules.
- Compuerta en layout privado: no monta tabs sin inicializar, sin sesión o estando bloqueado. Restauración bloqueada; contraseña verificada como fallback; biometría del sistema conservada, PIN local retirado.
- Bloqueo inmediato al salir de foreground; refresco de token no cambia desbloqueo; respuestas de login tardías no abren la app después de iniciar cierre.
- Caché cancelada/limpiada al cambiar identidad y al salir. Cierre fallido mantiene acceso bloqueado y muestra error. Cancelación de recordatorios al cerrar sesión.
- Altas hijas envían owner_id obtenido de identidad verificada y verifican acceso a la persona. Es una defensa de cliente, NO reemplaza la corrección de RLS relacional pendiente.
- Avisos de turnos no muestran título ni profesional en pantalla bloqueada.
- SOS filtra visibilidad, falla explícitamente ante lecturas incompletas y exige confirmación antes de mostrar QR con datos copiables. La ficha normal/PDF no presentan errores críticos como ausencia de registros.
- Fotos legacy públicas pausadas en cliente. No se borraron archivos ni se hizo privado el bucket remoto.
- Chat general retirado de la UI. Código del endpoint preparado como 503 sin llamadas al proveedor; NO desplegado, el servicio LIVE anterior no cambia por este PR.
- Reglas de confirmación/procedencia y demo de documento → confirmación → agenda → estado → resumen. Solo estado local ficticio; no tabla ni persistencia nueva.

## Evidencia
| Comprobación | Resultado |
|---|---|
| `npm run type-check` | PASS |
| `npm run lint` | PASS, sin warnings en la ejecución final |
| `npm test` | 14/14 PASS |
| `npm run preview:export` | PASS, export estático de Expo |
| Revisión React | Hooks incondicionales; estados derivados simples; controles de demo con rol/estado; carga protegida en layout |
| Browser QA | NO EJECUTADO: el servidor supervisado inició, pero la política de URL del navegador bloqueó el acceso; no se intentó eludirla |
| WebMCP opcional de demo | Registro read-only con feature detection; validación en contexto compatible NO disponible por el mismo bloqueo |
| APK/biometría/dispositivo Android | NO EJECUTADO |
| RLS y Storage con cuentas A/B en backend de ensayo | NO EJECUTADO; bloqueante antes de beta con datos reales |
| Función Deno | Fuente de contención, sin despliegue ni validación Deno |

Pruebas: borrador no agenda, fuente/actor obligatorios, conservación del original, sustitución/fecha inválida, restauración bloqueada, refresco de token, cambio de cuenta, salida offline, salida correcta, contraseña, cancelación de caché tardía, propiedad de persona, privacidad de avisos, compuerta de rutas y carrera login/logout. Los 14 tests contienen varios escenarios; no son cobertura completa ni prueba clínica.

## Dependencias
`npm audit --omit=dev` reportó **42 alertas de paquetes: 2 críticas, 20 altas, 19 moderadas y 1 baja**. No equivale a 42 vías explotables del producto: falta evaluar alcanzabilidad.

Las críticas corresponden a `shell-quote` y `tar`, transitivas del tooling. La auditoría propone, entre otros cambios, saltos mayores de Expo/React Native; no se ejecutó `npm audit fix --force` ni una actualización masiva sin prueba Android. Esto queda como bloqueo de revisión de dependencias en 0B, no como seguridad resuelta.

La demo desplegable es solo archivos estáticos y datos ficticios, sin servidor Node, credenciales, carga de archivos o IA. La exportación desactiva carga de .env, bloquea fetch del cliente Supabase y agrega CSP contra conexiones externas. Esto no certifica el comportamiento de la app conectada.

## Límites y siguiente paso
No usar esta rama con historias reales antes de cerrar `docs/ROADMAP.md` fase 0B: políticas relacionales, bucket legacy, endpoint LIVE, dependencias, esquema/tipos y Android. No prometer offline ni colaboración profesional. EAS/firma/acceso Expo siguen pendientes de verificación; un export web no es APK.

El historial del informe anterior está en `docs/historico`; PRODUCTO y ROADMAP actuales prevalecen sobre las prioridades anteriores. Engram, GGA y Context7 no se instalaron ni se simularon en este incremento.

## Demo privada publicada
[INsalud · Bitácora de salud](https://insalud-bitacora-demo-jona.jonaromero.chatgpt.site)

Publicación confirmada por el servicio de hosting. Acceso privado del propietario. Es una exportación de `components/DemoPreview.tsx` mediante `scripts/export-preview.cjs`, no la app conectada ni un APK. La comprobación visual por navegador permanece bloqueada; publicación exitosa no equivale a QA de interacción completada.
