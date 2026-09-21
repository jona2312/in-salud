# Roadmap actualizado

Fechas orientativas del informe anterior (12–18 semanas con dos desarrolladores y apoyo parcial) quedan sujetas a reestimación después de cerrar fase 0. No son promesa de fecha de tienda. No sumar acceso profesional como si ya estuviera construido.

| Fase | Entregable | Condición de cierre |
|---|---|---|
| 0A — esta rama | Compilación, compuertas locales, escrituras identificadas, contención de funciones no confiables y demo | Tipos/lint/tests/export + PR; NO equivalente a beta con datos reales |
| 0B — servidor y Android | RLS de relaciones, Storage privado, esquema/tipos fieles, sesión y CRUD | Dos identidades sintéticas, denegaciones cruzadas, dispositivo físico y recuperación |
| 1 — archivo confiable | Documento original, carga fiable, búsqueda, exportación, restauración | Circuito probado en Android con registros ficticios, sin pérdidas ni filtraciones |
| 2 — bitácora | Indicaciones versionadas, confirmación, agenda y eventos | Nunca programar borrador o instrucción sustituida; zonas horarias, edición/cancelación, sin duplicados |
| 3 — consulta profesional | Resumen con fuentes, acceso temporal, aportes con autoría | Invitación, verificación, alcance, vencimiento, revocación y auditoría probados |
| 4 — asistencia documental | OCR revisable y respuestas limitadas al expediente | Casos ilegibles/conflictivos/inyección, citas y abstención, permisos por fuente, consentimiento IA |
| 5 — piloto | 15–25 personas/familias durante tres semanas; incluir profesionales | Entender pendientes, encontrar originales, preparar consulta; medir errores e incidentes |
| 6 — distribución/store | APK interno controlado y después AAB | Firma, API Android efectiva, revisión de datos/privacidad y requisitos vigentes de la cuenta |

## Próximo incremento concreto (0B)
1. Resolver/triagear auditoría de dependencias (42 alertas: 2 críticas) y planificar actualización compatible de Expo/React Native. Releer reglas del repo y estado remoto; inventariar consumidores de la función antes de contención en producción.
2. Preparar entorno aislado y comparar esquema real con migraciones. No ejecutar el SQL inicial contra producción para “sincronizar”.
3. Probar ownership de hijo/persona y medication_logs/medication con cuentas A/B, anónimo, sesión vencida y acceso revocado. La validación de cliente NO basta.
4. Migrar avatars de forma coordinada: acceso privado, eliminación de política pública, sustitución por rutas, URLs temporales y política de reemplazo. Revisar links existentes/copias.
5. Generar tipos fieles y contratos de inserción. Hoy `Database = any` sigue siendo deuda explícita.
6. Probar cargas reales de archivos en Android: ArrayBuffer/base64, fallos parciales y limpieza de huérfanos. La exportación web no valida ese camino.
7. Recuperar acceso Expo por mecanismo oficial; revisar firma/env beta, generar APK e instalar. No enviar claves por chat.

## Riesgos pendientes antes de datos reales
RLS relacional y bucket legacy remoto; endpoint IA LIVE anterior; compatibilidad SDK 52/Android; persistencia offline; permisos de acompañantes; onboarding/recuperación/borrado; retención y transferencias; protección de capturas/miniaturas del sistema; recordatorios al bloquear/reiniciar/cambiar usuario; fechas locales y tareas recurrentes. Revisión jurídica y clínica independiente cuando corresponda.
