# INsalud

Bitácora personal de salud: conservar documentos e indicaciones, organizar próximos cuidados y preparar consultas profesionales.

**Estado: desarrollo. No aprobado para datos clínicos reales ni para tienda.** Esta rama contiene un primer incremento de reparación y una demo aislada. La aplicación original está en `master`; `main` contiene documentación histórica.

## Documentación vigente
- [Producto y límites](docs/PRODUCTO.md)
- [Diferencial original / nueva bitácora](docs/DIFERENCIAL.md)
- [Roadmap y bloqueos](docs/ROADMAP.md)
- [Estado y evidencia de esta entrega](docs/ESTADO.md)
- [Mercado y fuentes](docs/MERCADO.md)
- [Reglas para agentes](AGENTS.md)

## Desarrollo
React Native / Expo SDK 52, Expo Router, Supabase, TypeScript, TanStack Query y Zustand. No se actualizó el SDK en este incremento.

```sh
npm ci
npm run type-check
npm run lint
npm test
npm run preview:export
```

`preview:export` produce `preview-dist/` con datos ficticios, sin cargar archivos .env ni usar credenciales reales. Servir con un servidor estático para ver la demo. No inicia sesión, no sube archivos, no llama IA ni programa notificaciones reales. Los cambios de demo se pierden al recargar.

Para la app conectada: configurar localmente las variables documentadas en `.env.example`, usando un proyecto de pruebas. Nunca usar service_role en cliente. `npm run web` sirve el login; `npm run android` inicia desarrollo Android. La versión web mantiene sesión en memoria; no usa almacenamiento persistente del navegador.

EAS `preview` está configurado para APK interno, pero el build/instalación Android siguen pendientes de credenciales, firma y validación de entorno. No confundir export web con APK.

## Seguridad
Las pantallas privadas quedan bloqueadas antes de inicializar sesión o cuando está bloqueada. Un login por contraseña verificado abre acceso; una sesión restaurada requiere desbloqueo. Cache se cancela y limpia al cambiar identidad. App se bloquea al pasar a segundo plano. Esto no certifica captura de pantalla ni seguridad del servidor.

Se pausaron fotos legacy públicas y el chat general. El código del endpoint IA ahora es de contención; **no se desplegó**. El bucket remoto legacy y las políticas de relaciones siguen pendientes; la validación en cliente es solo una capa adicional.

CI verifica app/tests/export, no RLS, biometría real ni Deno. Antes de desplegar la función, ejecutar su verificación Deno y revisar el entorno exacto.
