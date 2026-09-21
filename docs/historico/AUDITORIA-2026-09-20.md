# INsalud — Informe de preparación para Android

Fecha: 20 de septiembre de 2026. Auditoría de código y configuración remota, sin cambios en producción ni acceso al contenido clínico de usuarios.

## Dictamen

INsalud tiene una aplicación móvil desarrollada y backend propio activo. Es candidata a una primera beta privada Android, después de corregir los bloqueos indicados. El estado revisado no permite afirmar que está lista para Google Play ni generar un APK válido sin reparaciones. No se generó, firmó ni desplegó un APK durante esta revisión.

No corresponde asignarle un porcentaje de avance: la presencia de pantallas no demuestra que los recorridos completos funcionen.

## Repositorio y versión revisada

- Repositorio: https://github.com/jona2312/in-salud
- Código de la aplicación: https://github.com/jona2312/in-salud/tree/master
- Commit: `a6685c29c25fad2b41c510841135993f9cb0720c`, del 14/05/2026.
- `main`, rama predeterminada, contiene tres archivos de documentación; `master` contiene la aplicación. Configurar cualquier compilación contra la rama correcta.
- Visibilidad actual: pública. Esto hace público el código, no demuestra por sí mismo que los datos clínicos sean públicos.
- No se encontraron PRs, releases ni ejecuciones de GitHub Actions en las consultas realizadas. Esto no prueba ausencia de builds en Expo.
- No hay AGENTS.md en el árbol revisado. CLAUDE.md aporta contexto, pero tiene afirmaciones que no coinciden con el código.

## Qué existe

React Native 0.76.9, Expo SDK 52, Expo Router 4, TypeScript, TanStack Query, Zustand y Supabase. Hay código para inicio de sesión, personas del grupo familiar, ficha clínica, alergias, medicamentos y registro de tomas, antecedentes, vacunas, historial, documentos, signos vitales, turnos, recordatorios locales, PDF, emergencia con QR y asistente IA.

Son funcionalidades presentes en código; no fueron certificadas de punta a punta en un teléfono.

Backend verificado: proyecto dedicado `in-salud`, referencia `asstrcylidzzihotmsjo`, estado ACTIVE_HEALTHY. El esquema `salud` tiene 13 tablas, todas con RLS habilitado. La función `ai-assistant` está ACTIVE, versión 2, con `verify_jwt=true`. No se ejecutaron consultas de IA ni se verificó el secreto del proveedor.

Storage: `documents` es privado; `avatars` es público. Se revisaron políticas y metadatos, no los archivos de usuarios. El asesor automático de seguridad devolvió cero avisos; esto no elimina los defectos de aplicación detallados abajo.

## Bloqueos y correcciones

| Prioridad | Hallazgo y evidencia | Corrección / criterio de cierre |
|---|---|---|
| P0 | `app/(tabs)/_layout.tsx` y `turnos.tsx` tienen fragmentos de estilos repetidos fuera del objeto. TypeScript falla por sintaxis. | Retirar fragmentos sobrantes; ejecutar chequeo completo y empaquetado Android. Pueden aparecer más errores después de resolver el parser. |
| P0 | `app/_layout.tsx` lee `isLocked`, pero no lo usa para impedir renderizar las pantallas. Una sesión activa redirige fuera del login aunque siga bloqueada. | Compuerta de desbloqueo efectiva; verificar inicio en frío, retorno de segundo plano, cancelación biométrica y ausencia de biometría. |
| P0 | El fallback PIN muestra un aviso, sin formulario operativo. | Implementar recuperación/desbloqueo real y control de intentos; no dejar al usuario bloqueado ni permitir omitir autenticación. |
| P0 | Formularios como alergias, documentos y registro de tomas omiten `owner_id`. En la base consultada es NOT NULL, sin default, y no hay triggers en `salud` que lo completen. | Alinear escrituras y esquema. RLS valida filas, no rellena campos. Probar altas con usuario de ensayo. |
| P0 | Caché global de React Query con claves sin usuario; `signOut` no la limpia. | Cancelar y borrar consultas al cambiar sesión, segmentar por identidad. Probar cuenta A → salir → cuenta B sin mostrar datos de A. Riesgo identificado por código, no explotación ejecutada. |
| P0 | Fotos de perfil públicas: bucket `avatars` público, política SELECT abierta para ese bucket y uso de `getPublicUrl`. | Para la beta privada, pasar a acceso privado y URLs temporales mediante un cambio coordinado de cliente y Storage. |
| P1 | `uploadPhoto` usa `upsert:true`, pero no hay política UPDATE de avatars en las políticas consultadas. | Completar permisos por propietario y probar reemplazar una foto existente. |
| P1 | Políticas de tablas hijas validan `owner_id`, pero no verifican que `person_id` pertenezca al mismo propietario; las FK son independientes. | Restricciones/políticas que aseguren pertenencia de persona, medicación y evento. Probar intentos cruzados entre dos cuentas ficticias. |
| P1 | Asistente envía `asset.uri` del dispositivo. Aunque solicita base64 al selector, no usa ese contenido para el envío. La función del repositorio pasa esa URI al proveedor. | Enviar una imagen accesible al servidor con validación de tipo/tamaño y consentimiento; verificar también el código LIVE antes de modificarlo. |
| P1 | Función IA del repositorio sin comprobación explícita de usuario autorizado ni cuotas; JWT habilitado en LIVE no acredita por sí solo esa autorización. | Verificar implementación desplegada, identidad, acceso a beta y límites de consumo. No afirmar exposición anónima sin prueba. |
| P1 | Emergencia obtiene datos por red, no hay persistencia offline implementada. No filtra `is_emergency_visible`; errores de consultas críticas se convierten en listas vacías. | Definir datos autorizados, distinguir error de ausencia de alergias y disponer de copia local protegida si se promete offline. El QR ya generado sí puede leerse sin red. |
| P1 | No hay suite ejecutable ni configuración de lint. | Configurar herramientas y pruebas de los flujos críticos; agregar CI. |
| P1 | Documentación contradictoria: main describe backend compartido y funciones pendientes; master tiene backend dedicado y una función OpenAI, mientras README menciona Anthropic. | Unificar documentación con estado comprobado y definir rama canónica mediante revisión. |

El esquema actual organiza personas bajo un propietario. No acredita colaboración entre varios adultos con cuentas diferentes: si es parte de la promesa del producto, requiere membresías, invitaciones y roles, no compartir contraseñas.

## Verificación ejecutada

| Comando o comprobación | Resultado |
|---|---|
| `npm ci --ignore-scripts --no-audit --no-fund` | Instalación completa: 1118 paquetes. No equivale a auditoría de vulnerabilidades. |
| `npm run type-check` | Falló: 27 diagnósticos de sintaxis en dos archivos. |
| `npm run lint` | Falló: ESLint 9 no encuentra `eslint.config.*`. |
| `npm test -- --runInBand` | Falló: `jest` no está instalado. |
| Consulta de tablas, políticas, triggers, buckets y funciones | Realizada, de solo lectura. |
| Prueba de APK, dispositivo físico, firma y envío a tienda | No ejecutada. |

El checkout permanece sin cambios en archivos versionados. No se modificaron ramas remotas, políticas, bases de datos ni visibilidad del repositorio.

## Distribución interna identificada

`eas.json` ya define `preview` con `distribution: internal` y `buildType: apk`; `production` produce un `app-bundle` para tienda. `app.json` vincula el proyecto Expo `app-de-salud` de `jona2312s-organization`, con identificador Android `com.insalud.app`.

Proyecto indicado por la configuración: https://expo.dev/accounts/jona2312s-organization/projects/app-de-salud

Se identificó Expo EAS como mecanismo del repositorio. No hay evidencia suficiente para identificar la herramienta mencionada verbalmente como “Plaucot” ni para equipararla a EAS.

Después de corregir y verificar el código, el comando previsto es:

```bash
eas build --profile preview --platform android
```

No se lanzó: el código falla y este entorno no tiene EAS CLI ni EXPO_TOKEN disponible; tampoco se verificó una sesión Expo por navegador. No hay SDK Android configurado en ANDROID_HOME. Falta confirmar acceso autenticado al proyecto, firma existente y variables del entorno de beta. No enviar contraseñas, tokens ni claves de firma por chat.

EAS permite instalar el APK sin un servidor de desarrollo encendido. Sus enlaces internos admiten acceso de quien tenga el enlace por defecto; para distribución privada hay que desactivar `Unauthenticated access to internal builds` y exigir cuentas autorizadas. Esto protege la descarga, pero la aplicación también necesita controles propios de acceso. Fuente: https://docs.expo.dev/build/internal-distribution/

## Google Play: trabajo separado del APK privado

1. Obtener un AAB firmado y reproducible, con versionado y compatibilidad Android comprobados. La documentación consultada exige API 36 para nuevas apps y actualizaciones desde el 31/08/2026, salvo excepciones aplicables. Revisar/actualizar el stack Expo SDK 52 y comprobar el target efectivo del artefacto: no inferir cumplimiento por tener perfil production. Fuente: https://support.google.com/googleplay/android-developer/answer/11926878
2. Completar declaración de funciones de salud. Fuente: https://support.google.com/googleplay/android-developer/answer/14738291
3. Preparar privacidad, información sobre tratamiento y envío de imágenes a IA, consentimiento, retención y borrado, ficha de tienda y acceso para revisión. No se encontraron pantallas de privacidad/consentimiento en el código revisado. Revisar permisos solicitados, en especial cámara y alarmas. Fuente: https://support.google.com/googleplay/android-developer/answer/13996367
4. Definir alta de usuarios, recuperación de contraseña, invitaciones y baja. El código actual ofrece login, sin un flujo completo de incorporación. Si se permite crear cuentas desde la app, Google requiere solicitar eliminación desde la app y mediante un recurso web. Fuente: https://support.google.com/googleplay/android-developer/answer/13327111
5. Confirmar cuenta Play Console, tipo de cuenta, verificación y pruebas exigidas en esa cuenta. No se accedió a Play Console y no se afirma que estos pasos estén pendientes allí.

Cualquier texto jurídico que se redacte será borrador para revisión profesional. La publicación debe describir la app como organizador de información familiar y delimitar el uso educativo de IA; la revisión presente no certifica seguridad clínica ni cumplimiento normativo.

## Orden operativo recomendado

1. Trabajar sobre una rama derivada de `master`; resolver sintaxis y ejecutar nuevamente tipos para descubrir los errores restantes.
2. Cerrar autenticación, caché entre cuentas, escrituras con propietario, relaciones entre registros y acceso privado a fotos.
3. Probar con datos ficticios: dos usuarios, altas y edición, documentos, reemplazo de fotos, tomas, turnos, PDF, logout y emergencia. Reparar IA o retirarla de la beta hasta validarla.
4. Preparar un entorno de beta controlado, confirmar acceso Expo y reutilizar la firma correcta. Generar APK, instalar en Android y repetir recorridos reales.
5. Habilitar descarga autenticada y acceso por usuarios autorizados. Decidir si hacer privado el repositorio para alinearlo con el objetivo de Jona.
6. Abordar Google Play después de pasar la beta, con documentación y compatibilidad actualizadas.

Recomendación: conservar lo desarrollado y priorizar una beta privada confiable. No ampliar funcionalidades ni fijar una fecha de tienda antes de que la compilación y los recorridos principales pasen. El siguiente hito demostrable es un APK instalado que guarda, recupera y protege datos correctamente.
