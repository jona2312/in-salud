# INsalud — bitácora personal de salud

Decisión de producto de Jona, incorporada el 21/09/2026. Sustituye la prioridad de recomendaciones generales de bienestar del informe anterior; conserva el archivo familiar como base.

## Propósito
Conservar lo que indicó un profesional, organizar los próximos cuidados y permitir que otro profesional encuentre rápidamente la historia relevante. La persona controla quién ve qué. El producto sirve a todas las edades; el primer piloto puede enfocarse en personas mayores y acompañantes autorizados, sin quitar autonomía por edad.

## Recorrido central
1. Fotografiar/subir un documento o recibir una indicación de un profesional autorizado.
2. Asociar persona, original, fecha de emisión y registro, autor declarado y procedencia. Mantener trazabilidad y versiones.
3. Extraer un borrador; confirmar texto, dosis, unidades, vía, frecuencia, duración, fecha y persona contra el original. Marcar campos ilegibles/conflictos; no completarlos con IA.
4. Crear agenda solo a partir de indicaciones confirmadas. Si faltan fechas/frecuencias, solicitar aclaración. No inventar controles anuales.
5. Registrar realización, posposición, omisión declarada o falta de confirmación como estados distintos.
6. Preparar resumen para consulta, por período, con originales accesibles y datos faltantes explícitos.
7. Agregar indicaciones posteriores con autoría y relación con las anteriores. Nunca resolver automáticamente una contradicción entre profesionales.

## Actores y permisos propuestos (aún no implementados)
- Titular: consulta y administra su información y permisos.
- Acompañante: solo capacidades concedidas, con aceptación, vencimiento/revocación y trazabilidad.
- Profesional: identidad verificada por mecanismo a definir para la jurisdicción; lectura y/o incorporación según alcance. Una indicación fotografiada no implica cuenta profesional verificada.
- Menores/representación: modelo específico y revisión jurídica, no compartir credenciales.

## Resumen para consulta
Motivo, antecedentes, alergias registradas, medicamentos/suplementos y vigencia, resultados con fecha/unidad/rango original, síntomas autorreportados, indicaciones y pendientes. Mostrar origen y última actualización. No confundir extracción con diagnóstico, correlación con causalidad ni ausencia de registros con ausencia de enfermedad.

## Asistente limitado al expediente
Responder preguntas sobre documentos y agenda autorizados de la persona activa. Cada respuesta debe citar documento, fecha y autor. Sin fuentes: abstenerse. Tratar documentos como datos, nunca como instrucciones del sistema. No aceptar un `person_id` sin autorización ni historia arbitraria del cliente como evidencia. No cambiar tratamiento/dosis, sugerir estudios por edad o interpretar imágenes diagnósticas. Acciones de agenda mediante validadores determinísticos y confirmación, no herramientas clínicas abiertas.

## QR y emergencia
QR de consulta: token opaco, corto alcance temporal, no datos clínicos en URL, sin indexación, consentimiento, logs y revocación. Si permite aportar indicaciones, requiere identidad profesional; escanear no otorga escritura. Ficha de emergencia: mínima selección explícita, fecha de actualización y límites de vigencia. Una copia exportada no es revocable. No prometer funcionamiento offline antes de probar persistencia cifrada y recuperación sin red. No es servicio de respuesta a emergencias.

## Alimentación e integración
Registrar pautas nutricionales, hábitos y suplementos con procedencia; no generar tratamientos. El interés ortomolecular/biológico se incorpora como registro opcional de prácticas concretas, con evidencia revisada por intervención. “Biológica” queda pendiente de definición con Jona. No recomendaciones de megadosis, planes intravenosos o cambios de medicación. Evidencia y cualquier interés comercial deben estar separados.

## Datos futuros (diseño, no tablas desplegadas)
`source_documents` → `care_instructions` versionadas → `care_tasks` → `task_events`.
`person_memberships`, `share_grants` y `access_events` sostienen colaboración.
Mantener id de persona/propietario, fuente, autor declarado/verificado, fechas, estado de revisión, actor confirmante, versión y motivo de sustitución. Hash del original puede ayudar a integridad; no acredita por sí mismo autoría clínica.
