# INsalud — reglas de trabajo

## Leer primero
- `docs/PRODUCTO.md`, `docs/DIFERENCIAL.md`, `docs/ROADMAP.md` y `docs/ESTADO.md`.
- La aplicación original está en `master`; `main` contiene documentación histórica. No cambiar ramas predeterminadas ni mezclar sus árboles sin revisión.
- Trabajar en rama; entregar PR a `master`. No push directo a `main`/`master`, no merge ni cambios de producción como parte de un cambio de código.

## Seguridad y confianza en TODAS las etapas
- Solo datos sintéticos para tests, demos, capturas y fixtures. Nunca secretos, historias reales ni memoria personal del usuario en Git, logs o memoria de agentes.
- La UI no es una frontera de autorización. Verificar identidad, propiedad de persona, relaciones y permisos en el servidor.
- No afirmar seguridad, disponibilidad offline o cumplimiento normativo por tener una pantalla o por pasar pruebas unitarias.
- La IA no diagnostica, prescribe ni modifica tratamientos. Datos extraídos son borradores hasta confirmación; respuestas deben citar fuentes autorizadas.
- Lo registrado por una persona no equivale a firma/validación de un profesional. No confirmar autoría a partir del texto de una foto.
- No compartir contraseñas para colaboración. QR de texto, enlace temporal y ficha de emergencia son mecanismos distintos.
- No pedir ni volcar claves. Un nuevo despliegue necesita revisión del artefacto exacto y del entorno de destino.

## Verificación y continuidad
- `npm ci`, `npm run type-check`, `npm run lint`, `npm test`, `npm run preview:export`.
- El chequeo TypeScript de Expo excluye Deno; validar la función por separado antes de cualquier despliegue.
- Actualizar ESTADO con evidencia, límites y siguiente paso al cerrar cada incremento. No marcar implementado lo que solo existe en la demo o documentación.
- Si Engram/Context7/GGA no están disponibles, declarar esa limitación y continuar con los archivos versionados; no simular consultas ni instalación.
- Mantener lockfile. No ejecutar `scripts/patch-metro.js` para ocultar una incompatibilidad; corregir dependencias de forma reproducible.
