# Original vs nueva bitácora — seguridad y confianza comunes

No son dos productos independientes ni dos niveles de seguridad. Es una evolución del mismo núcleo. “Original” describe código auditado, no funcionamiento certificado.

| Aspecto | Original en master | Evolución acordada | Entrega de esta rama |
|---|---|---|---|
| Valor principal | Archivo familiar | Continuidad de indicaciones y preparación de consultas | Definición y roadmap versionados |
| Personas | Propietario con perfiles | Titular, acompañantes y profesionales con permisos | Modelo futuro especificado; no colaboración desplegada |
| Documentos | Adjuntos por persona | Original + fuente + autoría + fecha + versiones | Corrección de identidad en alta; OCR/persistencia nuevos pendientes |
| Indicaciones | Campos de medicamentos/notas | Documento vinculado y revisión de extracción | Reglas de dominio y demo; sin tabla nueva |
| Agenda | Turnos y recordatorios locales | Tareas derivadas de indicaciones confirmadas | Notificaciones genéricas; agenda nueva solo simulada |
| Registro diario | Vitales/tomas | Eventos con origen y estados explícitos | Se conserva núcleo; no diagnóstico automático |
| Consulta | Ficha/PDF | Resumen por período y fuentes | PDF falla si faltan consultas; vista propuesta en demo |
| Asistente | Chat médico general con imagen | Solo expediente autorizado, con citas | Chat retirado de UI; fuente de endpoint en 503, sin despliegue |
| QR | Texto con datos copiables | Acceso temporal autorizado y revocable | Confirmación antes de QR original; nuevo QR pendiente |
| Emergencia | Lecturas remotas, sin offline real | Ficha mínima elegida, actualizada y offline verificada | Respeta visibilidad y muestra errores; offline pendiente |
| Fotos | URLs públicas | Archivos privados con permisos | Carga/visualización pausadas; bucket remoto no modificado |
| Salud integrativa | Medicamentos incluyen suplemento | Hábitos/prácticas con evidencia y procedencia | Alcance documentado, sin recomendaciones automáticas |

## Base obligatoria para ambos

| Seguridad — quién puede acceder/actuar | Confianza — qué puede creer el usuario |
|---|---|
| Sesión y desbloqueo efectivos | Fuente y fecha para cada indicación |
| Aislamiento entre identidades y personas | Diferenciar registro, extracción y validación profesional |
| Archivos privados y permisos mínimos | Error de carga no equivale a “no tiene alergias” |
| Consentimiento y revocación | No confirmar lectura/toma por enviar una notificación |
| Pruebas de denegación y recuperación | Mostrar pendientes y límites sin prometer funciones inexistentes |

## Prueba de producto
Con datos ficticios: documento → revisión → confirmación → tarea → registro → resumen. Luego pruebas controladas con usuarios y profesionales. La demo entregada prueba interacción y reglas locales; no demuestra seguridad clínica ni funcionamiento de servidor.
