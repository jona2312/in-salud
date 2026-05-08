/**
 * lib/exportFicha.ts — Exportar ficha clínica completa como PDF
 *
 * SEGURIDAD:
 * - Solo datos del usuario autenticado (RLS garantizado en Supabase)
 * - El PDF se genera localmente, no se transmite a ningún servidor externo
 * - Se comparte vía sistema operativo (ShareSheet nativo)
 */
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { supabase } from '@/lib/supabase'
import { Person, Allergy, Medication, EmergencyContact, Antecedent, Vaccine, MedicalEvent } from '@/types/database'

type FichaData = {
  person: Person
  allergies: Allergy[]
  meds: Medication[]
  contacts: EmergencyContact[]
  antecedents: Antecedent[]
  vaccines: Vaccine[]
  events: MedicalEvent[]
}

async function fetchAll(personId: string): Promise<FichaData> {
  const [pR, aR, mR, cR, antR, vR, eR] = await Promise.all([
    supabase.from('persons').select('*').eq('id', personId).single(),
    supabase.from('allergies').select('*').eq('person_id', personId).order('severity'),
    supabase.from('medications').select('*').eq('person_id', personId).eq('is_active', true).order('type'),
    supabase.from('emergency_contacts').select('*').eq('person_id', personId).order('is_primary', { ascending: false }),
    supabase.from('antecedents').select('*').eq('person_id', personId).order('date', { ascending: false }),
    supabase.from('vaccines').select('*').eq('person_id', personId).order('date', { ascending: false }),
    supabase.from('medical_events').select('*').eq('person_id', personId).order('date', { ascending: false }),
  ])
  if (pR.error) throw new Error(pR.error.message)
  return {
    person:      pR.data as Person,
    allergies:   (aR.data ?? []) as Allergy[],
    meds:        (mR.data ?? []) as Medication[],
    contacts:    (cR.data ?? []) as EmergencyContact[],
    antecedents: (antR.data ?? []) as Antecedent[],
    vaccines:    (vR.data ?? []) as Vaccine[],
    events:      (eR.data ?? []) as MedicalEvent[],
  }
}

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function calcAge(birth: string | null | undefined): string {
  if (!birth) return ''
  const diff = Date.now() - new Date(birth).getTime()
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  return `${age} anos`
}

function rows(items: string[][]): string {
  return items.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')
}

function section(title: string, content: string): string {
  return `
    <div class="section">
      <h2>${title}</h2>
      ${content}
    </div>`
}

function buildHtml(d: FichaData): string {
  const p = d.person
  const generatedAt = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // --- Datos personales ---
  const personalRows: string[][] = [
    ['Nombre completo', esc(p.full_name)],
    ['Fecha de nacimiento', esc(p.birth_date ?? '')],
    ['Edad', calcAge(p.birth_date)],
    ['Sexo', esc(p.gender ?? '')],
    ['Grupo sanguineo', `<strong style="color:#c0392b">${esc(p.blood_type ?? 'No registrado')}</strong>`],
    ['Presion habitual', p.bp_systolic && p.bp_diastolic ? `${p.bp_systolic}/${p.bp_diastolic} mmHg` : ''],
    ['Obra social', esc(p.obra_social ?? '')],
    ['N&deg; afiliado', esc(p.obra_social_num ?? '')],
    ['Plan', esc(p.obra_social_plan ?? '')],
  ].filter(r => r[1])

  const personalSection = section('Datos personales', `
    <table>${rows(personalRows)}</table>
    ${p.notes ? `<div class="notes"><strong>Notas urgentes:</strong> ${esc(p.notes)}</div>` : ''}
  `)

  // --- Alergias ---
  const sevColor: Record<string, string> = { grave: '#e74c3c', moderada: '#f39c12', leve: '#27ae60' }
  const allergySection = d.allergies.length === 0 ? '' : section('Alergias', `
    <table>
      <thead><tr><th>Alergia</th><th>Severidad</th><th>Notas</th></tr></thead>
      <tbody>${d.allergies.map(a => `
        <tr>
          <td>${esc(a.name)}</td>
          <td><span class="badge" style="background:${sevColor[a.severity] ?? '#888'}">${esc(a.severity).toUpperCase()}</span></td>
          <td>${esc(a.notes)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`)

  // --- Medicacion activa ---
  const medTypeLabel: Record<string, string> = {
    prohibido: 'PROHIBIDO', rescate: 'Rescate', diario: 'Diario', suplemento: 'Suplemento',
  }
  const medTypeColor: Record<string, string> = {
    prohibido: '#e74c3c', rescate: '#e67e22', diario: '#2980b9', suplemento: '#27ae60',
  }
  const medsSection = d.meds.length === 0 ? '' : section('Medicacion activa', `
    <table>
      <thead><tr><th>Medicamento</th><th>Tipo</th><th>Dosis</th><th>Frecuencia</th></tr></thead>
      <tbody>${d.meds.map(m => `
        <tr>
          <td>${esc(m.name)}</td>
          <td><span class="badge" style="background:${medTypeColor[m.type] ?? '#888'}">${medTypeLabel[m.type] ?? esc(m.type)}</span></td>
          <td>${esc(m.dose)}</td>
          <td>${esc(m.frequency)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`)

  // --- Contactos de emergencia ---
  const contactsSection = d.contacts.length === 0 ? '' : section('Contactos de emergencia', `
    <table>
      <thead><tr><th>Nombre</th><th>Relacion</th><th>Telefono</th><th>Especialidad</th></tr></thead>
      <tbody>${d.contacts.map(c => `
        <tr>
          <td>${esc(c.name)}${c.is_primary ? ' <span class="badge" style="background:#2980b9">PRINCIPAL</span>' : ''}</td>
          <td>${esc(c.type)}</td>
          <td>${esc(c.phone)}</td>
          <td>${esc(c.specialty)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`)

  // --- Antecedentes ---
  const antSection = d.antecedents.length === 0 ? '' : section('Antecedentes medicos', `
    <table>
      <thead><tr><th>Tipo</th><th>Descripcion</th><th>Fecha</th></tr></thead>
      <tbody>${d.antecedents.map(a => `
        <tr>
          <td>${esc(a.type)}</td>
          <td>${esc(a.description)}</td>
          <td>${a.year ? String(a.year) : ''}</td>
        </tr>`).join('')}
      </tbody>
    </table>`)

  // --- Vacunas ---
  const vacSection = d.vaccines.length === 0 ? '' : section('Vacunas', `
    <table>
      <thead><tr><th>Vacuna</th><th>Fecha</th><th>Estado</th><th>Proxima</th></tr></thead>
      <tbody>${d.vaccines.map(v => `
        <tr>
          <td>${esc(v.name)}</td>
          <td>${esc(v.date_applied ?? '')}</td>
          <td>${esc(v.status ?? '')}</td>
          <td>${esc(v.next_dose ?? '')}</td>
        </tr>`).join('')}
      </tbody>
    </table>`)

  // --- Eventos medicos recientes (max 10) ---
  const recent = d.events.slice(0, 10)
  const eventsSection = recent.length === 0 ? '' : section('Eventos medicos recientes', `
    <table>
      <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripcion</th><th>Profesional</th></tr></thead>
      <tbody>${recent.map(e => `
        <tr>
          <td>${esc(e.date ?? '')}</td>
          <td>${esc(e.type)}</td>
          <td>${esc(e.title)}</td>
          <td>${esc(e.doctor ?? '')}</td>
        </tr>`).join('')}
      </tbody>
    </table>`)

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ficha Clinica - ${esc(p.full_name)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 24px; }
  .header { border-bottom: 3px solid #2980b9; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header h1 { font-size: 22px; color: #2980b9; font-weight: 800; }
  .header p { font-size: 10px; color: #666; }
  .section { margin-bottom: 20px; page-break-inside: avoid; }
  .section h2 { font-size: 13px; font-weight: 700; color: #2980b9; text-transform: uppercase; letter-spacing: 0.5px; border-left: 4px solid #2980b9; padding-left: 8px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f0f4f8; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #555; text-align: left; padding: 6px 8px; border-bottom: 1px solid #ddd; }
  td { padding: 5px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; color: white; font-size: 9px; font-weight: 700; }
  .notes { background: #fff3cd; border-left: 4px solid #f39c12; padding: 8px 12px; margin-top: 8px; border-radius: 4px; font-size: 11px; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 9px; color: #999; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Ficha Clinica</h1>
      <p style="font-size:14px; font-weight:600; color:#333; margin-top:4px">${esc(p.full_name)}</p>
    </div>
    <p>Generado el ${generatedAt}</p>
  </div>

  ${personalSection}
  ${allergySection}
  ${medsSection}
  ${contactsSection}
  ${antSection}
  ${vacSection}
  ${eventsSection}

  <div class="footer">
    Este documento es solo para uso personal y de referencia medica. No reemplaza el criterio profesional.
  </div>
</body>
</html>`
}

/** Genera y comparte el PDF de la ficha clinica de una persona */
export async function exportFichaAsPdf(personId: string, personName: string): Promise<void> {
  const data = await fetchAll(personId)
  const html = buildHtml(data)

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  })

  const canShare = await Sharing.isAvailableAsync()
  if (!canShare) throw new Error('Compartir no disponible en este dispositivo')

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Ficha clinica de ${personName}`,
    UTI: 'com.adobe.pdf',
  })
}
