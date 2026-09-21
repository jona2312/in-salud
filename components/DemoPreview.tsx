import { useState, useEffect, useRef } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { Instruction, confirmInstruction, canSchedule, answerFromInstruction } from '@/lib/carePlan'

const draft: Instruction = {
  id: 'demo-indication', personId: 'demo-person', sourceId: 'Consulta de ejemplo · DOC-001',
  sourceDate: '2026-09-15', professional: 'Profesional de ejemplo',
  text: 'Llevar los estudios previos a la próxima consulta.',
  status: 'draft', confirmedAt: null, confirmedBy: null, dueAt: '2026-10-15T10:00:00-03:00',
}
const tabs = ['Hoy', 'Bitácora', 'Consulta', 'Diferencial'] as const
type Tab = typeof tabs[number]
function Button({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[s.button, disabled && s.disabled]}><Text style={s.buttonText}>{label}</Text></TouchableOpacity>
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={s.card}><Text style={s.cardTitle}>{title}</Text>{children}</View>
}
export default function DemoPreview() {
  const [tab, setTab] = useState<Tab>('Hoy')
  const [instruction, setInstruction] = useState(draft)
  const [scheduled, setScheduled] = useState(false)
  const [done, setDone] = useState(false)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [reply, setReply] = useState('')
  const snapshot = useRef({ tab, instructionStatus: instruction.status, scheduled, done })
  snapshot.current = { tab, instructionStatus: instruction.status, scheduled, done }
  useEffect(() => {
    type Context = { registerTool: (tool: object, options: { signal: AbortSignal }) => unknown }
    const context = typeof document === 'undefined' ? undefined : (document as Document & { modelContext?: Context }).modelContext
    if (!context?.registerTool) return
    const lifecycle = new AbortController()
    try {
      void Promise.resolve(context.registerTool({
        name: 'read_insalud_demo_state', title: 'Leer estado de la demo',
        description: 'Lee únicamente el estado ficticio visible. No accede a pacientes ni modifica datos.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute(input: unknown) {
          if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Se requiere un objeto vacío.')
          return { demo: true, persisted: false, ...snapshot.current }
        },
      }, { signal: lifecycle.signal })).catch(() => {})
    } catch { /* Unsupported tool registry must not break the demo. */ }
    return () => lifecycle.abort()
  }, [])
  const wide = useWindowDimensions().width >= 850
  function reset() { setInstruction(draft); setScheduled(false); setDone(false); setReply(''); setSourceOpen(false); setTab('Hoy') }
  return <ScrollView style={s.page} contentContainerStyle={s.outer}>
    <View style={s.header}><Text style={s.brand}>INsalud<Text style={s.brandDot}> ●</Text></Text><Text style={s.tag}>BITÁCORA PERSONAL</Text></View>
    <View style={s.banner}><Text style={s.bannerText}>DEMO · Datos ficticios · Sin conexión a historias reales</Text><Text style={s.small}>Los cambios se pierden al recargar. No envía avisos ni habilita accesos profesionales.</Text></View>
    <View style={s.hero}><Text style={s.eyebrow}>TU HISTORIA, CON CONTINUIDAD</Text><Text style={s.heading}>Lo que te indicaron.{'\n'}Lo que sigue.</Text><Text style={s.subtitle}>Un lugar para encontrar tus documentos, recordar lo acordado y preparar tu próxima consulta.</Text></View>
    <View style={s.profile}><View style={s.avatar}><Text style={s.avatarText}>PE</Text></View><View style={{ flex: 1 }}><Text style={s.profileName}>Persona de ejemplo</Text><Text style={s.small}>Perfil ficticio · Agenda de septiembre de 2026</Text></View><Text style={s.pill}>Solo demostración</Text></View>
    <View style={s.nav}>{tabs.map(t => <TouchableOpacity key={t} accessibilityRole="button" accessibilityState={{ selected: tab === t }} onPress={() => setTab(t)} style={[s.tab, tab === t && s.activeTab]}><Text style={[s.tabText, tab === t && s.activeTabText]}>{t}</Text></TouchableOpacity>)}</View>
    {tab === 'Hoy' && <View style={[s.columns, wide && s.wide]}>
      <View style={s.main}>
        <Card title="Una indicación para revisar"><Text style={s.status}>{instruction.status === 'confirmed' ? 'CONFIRMADA EN ESTA DEMO' : 'PENDIENTE DE CONFIRMACIÓN'}</Text><Text style={s.instruction}>{instruction.text}</Text><Text style={s.small}>{instruction.professional} · {instruction.sourceDate}</Text><Button label={sourceOpen ? 'Cerrar documento de ejemplo' : 'Ver documento de ejemplo'} onPress={() => setSourceOpen(!sourceOpen)} />{sourceOpen && <View style={s.document}><Text style={s.cardTitle}>DOC-001 · Ejemplo ficticio</Text><Text style={s.body}>Fecha: 15/09/2026{ '\n' }Autor: Profesional de ejemplo{ '\n\n' }Llevar los estudios previos a la próxima consulta.{ '\n\n' }Este texto simula un documento. No es una receta ni una indicación médica real.</Text></View>}<Button label={instruction.status === 'confirmed' ? 'Contenido confirmado' : 'Confirmar que coincide con el documento'} disabled={!sourceOpen || instruction.status === 'confirmed'} onPress={() => setInstruction(confirmInstruction(instruction, 'demo-user', new Date().toISOString()))} /><Text style={s.small}>En el producto, confirmar una transcripción no equivale a una firma profesional.</Text></Card>
        <Card title="Próximo paso"><Text style={s.instruction}>Preparar los estudios para la consulta</Text><Text style={s.body}>15 de octubre · 10:00 · Fecha ficticia</Text><Button label={scheduled ? 'Agregado a la agenda de ejemplo' : 'Agregar a la agenda de ejemplo'} disabled={!canSchedule(instruction) || scheduled} onPress={() => setScheduled(true)} />{scheduled && <Button label={done ? 'Preparación realizada' : 'Marcar preparación realizada'} disabled={done} onPress={() => setDone(true)} />}<Text style={s.small}>No se programa ninguna notificación real.</Text></Card>
      </View><View style={s.side}><Card title="Preguntale a tu bitácora"><Text style={s.body}>Respuestas de ejemplo basadas únicamente en la indicación mostrada.</Text><Button label="¿Qué me indicó el profesional?" onPress={() => setReply(answerFromInstruction(instruction))} /><Button label="¿Qué tengo pendiente?" onPress={() => setReply(!scheduled ? 'Todavía no agregaste tareas a la agenda de ejemplo.' : done ? 'Marcaste la preparación como realizada. La consulta sigue pendiente.' : 'Preparar los estudios para la consulta del 15 de octubre. Fuente: DOC-001.')} />{reply ? <View style={s.reply}><Text style={s.body}>{reply}</Text></View> : null}<Text style={s.small}>Demostración determinística, sin IA ni recomendaciones clínicas.</Text></Card><View style={s.trust}><Text style={s.cardTitle}>Una fuente para cada dato</Text><Text style={s.body}>El original, la fecha y quién lo registró acompañan la información. Los datos pendientes no se presentan como confirmados.</Text></View></View>
    </View>}
    {tab === 'Bitácora' && <Card title="La historia, en orden"><Text style={s.small}>Ejemplos ficticios · El orden temporal no indica causalidad clínica.</Text>{[
      ['15 SEP 2026', 'Consulta registrada', 'Documento DOC-001 · Profesional de ejemplo'],
      ['18 SEP 2026', 'Estudio archivado', 'Documento DOC-002 · Resultado sin interpretación en esta demo'],
      ['15 OCT 2026', 'Próxima consulta', scheduled ? (done ? 'Estudios preparados · Consulta pendiente' : 'Preparar estudios · Pendiente') : 'Indicación pendiente de agregar a agenda'],
    ].map(([date,title,detail]) => <View key={date} style={s.event}><Text style={s.eyebrow}>{date}</Text><Text style={s.cardTitle}>{title}</Text><Text style={s.body}>{detail}</Text></View>)}</Card>}
    {tab === 'Consulta' && <Card title="Resumen para el profesional"><Text style={s.status}>VISTA PROPUESTA · SIN COMPARTIR</Text><Text style={s.instruction}>Persona de ejemplo</Text><Text style={s.body}>Motivo: revisar estudios previos en la próxima consulta.</Text>{[['Indicaciones', instruction.status === 'confirmed' ? instruction.text : 'Una indicación pendiente de confirmar'],['Medicaciones', 'Sin información en esta demo; no significa que no tome medicación.'],['Alergias', 'Sin información en esta demo; no equivale a ausencia de alergias.'],['Fuentes', 'DOC-001 · 15/09/2026 · Profesional de ejemplo'],['Acceso profesional', 'Pendiente de implementar: identidad, permisos, vencimiento y revocación.']].map(([label,value])=><View style={s.event} key={label}><Text style={s.cardTitle}>{label}</Text><Text style={s.body}>{value}</Text></View>)}<Text style={s.small}>No se genera QR ni enlace de acceso real en esta demostración.</Text></Card>}
    {tab === 'Diferencial' && <Card title="Qué conservamos y qué sumamos"><Text style={s.body}>Evolucionamos una sola aplicación. Las dos etapas requieren la misma base de seguridad.</Text>{[
      ['Archivo familiar original', 'Personas, medicamentos, estudios, antecedentes, turnos y ficha SOS. Existen en el código; su operación completa aún requiere validación.'],
      ['Nueva bitácora', 'Conectar documento → indicación confirmada → agenda → registro → resumen de consulta. El recorrido de esta demo usa datos ficticios.'],
      ['Seguridad compartida', 'Bloqueo de acceso, aislamiento entre cuentas y permisos sobre cada persona. La revisión del servidor y Android sigue pendiente.'],
      ['Confianza compartida', 'Fuente y fecha, errores visibles, información faltante explícita y ninguna decisión automática de tratamiento.'],
      ['Después de esta entrega', 'Persistencia de indicaciones, OCR con revisión, acceso profesional temporal, trazabilidad y recordatorios verificados en Android.'],
    ].map(([title,body])=><View style={s.event} key={title}><Text style={s.cardTitle}>{title}</Text><Text style={s.body}>{body}</Text></View>)}</Card>}
    <View style={s.footer}><Text style={s.small}>INsalud · Vista de producto en desarrollo · 21/09/2026</Text><TouchableOpacity accessibilityRole="button" onPress={reset}><Text style={s.reset}>Reiniciar demostración</Text></TouchableOpacity></View>
  </ScrollView>
}
const s = StyleSheet.create({
  page:{ flex:1,backgroundColor:'#F4F7F8' },outer:{ width:'100%',maxWidth:1160,alignSelf:'center',padding:20,paddingBottom:48 },header:{ flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:18 },brand:{ fontSize:30,fontWeight:'800',color:'#173A43' },brandDot:{ color:'#16866F' },tag:{ fontSize:10,letterSpacing:1.7,color:'#4A626A',fontWeight:'700' },banner:{ backgroundColor:'#E6F2EE',padding:14,borderRadius:12,gap:4 },bannerText:{ color:'#185B4E',fontSize:13,fontWeight:'700' },small:{ fontSize:13,lineHeight:20,color:'#52636B' },hero:{ paddingVertical:30,gap:12 },eyebrow:{ fontSize:11,fontWeight:'700',letterSpacing:1.5,color:'#25705F' },heading:{ fontSize:38,lineHeight:44,fontWeight:'800',color:'#173A43' },subtitle:{ fontSize:17,lineHeight:26,color:'#52636B',maxWidth:640 },profile:{ flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:12,padding:18,backgroundColor:'#FFF',borderRadius:16 },avatar:{ width:46,height:46,borderRadius:23,backgroundColor:'#DEEBEA',alignItems:'center',justifyContent:'center' },avatarText:{ color:'#235B53',fontWeight:'700' },profileName:{ fontSize:18,fontWeight:'700',color:'#173A43' },pill:{ fontSize:11,color:'#52636B',backgroundColor:'#F0F4F5',padding:8,borderRadius:12 },nav:{ flexDirection:'row',gap:4,marginVertical:22,flexWrap:'wrap' },tab:{ paddingVertical:13,paddingHorizontal:17,borderRadius:10 },activeTab:{ backgroundColor:'#173A43' },tabText:{ color:'#52636B',fontWeight:'600',fontSize:15 },activeTabText:{ color:'#FFF' },columns:{ gap:20 },wide:{ flexDirection:'row',alignItems:'flex-start' },main:{ flex:1.65,gap:20 },side:{ flex:1,gap:20 },card:{ backgroundColor:'#FFF',borderWidth:1,borderColor:'#E1E8EB',borderRadius:18,padding:22,gap:14 },cardTitle:{ color:'#173A43',fontSize:18,fontWeight:'700' },status:{ color:'#826013',fontSize:11,letterSpacing:1,fontWeight:'700' },instruction:{ fontSize:22,lineHeight:30,fontWeight:'600',color:'#173A43' },body:{ fontSize:15,lineHeight:24,color:'#354E57' },button:{ backgroundColor:'#176F60',paddingVertical:14,paddingHorizontal:16,borderRadius:10,minHeight:48 },buttonText:{ color:'#FFF',fontWeight:'600',fontSize:14,textAlign:'center' },disabled:{ backgroundColor:'#647879' },document:{ backgroundColor:'#FAF7ED',padding:18,borderRadius:10,gap:12 },reply:{ backgroundColor:'#EAF3F0',padding:16,borderRadius:10 },trust:{ padding:22,gap:12,backgroundColor:'#EAF0F2',borderRadius:18 },event:{ paddingVertical:18,borderTopWidth:1,borderTopColor:'#E1E8EB',gap:7 },footer:{ paddingTop:28,gap:14,flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap' },reset:{ color:'#176F60',fontSize:13,fontWeight:'700',paddingVertical:6 },
})
