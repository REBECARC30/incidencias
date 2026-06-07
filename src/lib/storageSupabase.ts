import type { Incidencia, Persona, TratamientoRegistro } from '../types'
import { normalizeEstados } from './estados'
import { normalizePersona } from './habitaciones'
import { normalizeLista } from './listas'
import { supabase } from './supabase'
import { normalizeTratamientos } from './tratamientos'

type PersonaRow = {
  id: string
  codigo: string
  nombre: string
  ala: Persona['ala']
  habitacion: string
  created_at: string
}

type IncidenciaRow = {
  id: string
  persona_id: string
  fecha: string
  turno: Incidencia['turno']
  de: Incidencia['de']
  a: Incidencia['a']
  estado: string[]
  estado_otros: string
  incidencia: string
  prioridad: Incidencia['prioridad']
  lesiones: string
  caida_naf: boolean
  caida_af: boolean
  hospital_tras: boolean
  hospital_regr: boolean
  dieta: string[]
  dieta_otros: string
  tratamiento: TratamientoRegistro[]
  tratamiento_otros: string
  tratamiento_otros_hora: string
  tratamiento_otros_forma: Incidencia['tratamientoOtrosForma']
  tratamiento_otros_forma_otros: string
  proceso: string[]
  proceso_otros: string
  desde: string
  hasta: string
  ctes_p: string
  ctes_t: string
  ctes_s: string
  ctes_ta: string
  ctes_glucemia: string
  ctes_peso: string
  observaciones: string
  firma: string
  firma_dibujo: string
  created_by: string | null
  created_at: string
}

function rowToPersona(row: PersonaRow): Persona {
  return normalizePersona({
    id: row.id,
    codigo: row.codigo,
    ala: row.ala,
    habitacion: row.habitacion,
    createdAt: row.created_at,
  })
}

function personaToRow(input: Omit<Persona, 'id' | 'createdAt'> & { id?: string }): Partial<PersonaRow> {
  const codigo = input.codigo.trim().toUpperCase()
  return {
    ...(input.id ? { id: input.id } : {}),
    codigo,
    nombre: codigo,
    ala: input.ala,
    habitacion: input.habitacion.trim(),
  }
}

function rowToIncidencia(row: IncidenciaRow): Incidencia {
  return {
    id: row.id,
    personaId: row.persona_id,
    fecha: row.fecha,
    turno: row.turno,
    de: row.de,
    a: row.a,
    estado: normalizeEstados(row.estado),
    estadoOtros: row.estado_otros ?? '',
    incidencia: row.incidencia ?? '',
    prioridad: row.prioridad ?? '',
    lesiones: row.lesiones ?? '',
    caidaNaf: row.caida_naf ?? false,
    caidaAf: row.caida_af ?? false,
    hospitalTras: row.hospital_tras ?? false,
    hospitalRegr: row.hospital_regr ?? false,
    dieta: normalizeLista(row.dieta),
    dietaOtros: row.dieta_otros ?? '',
    tratamiento: normalizeTratamientos(row.tratamiento),
    tratamientoOtros: row.tratamiento_otros ?? '',
    tratamientoOtrosHora: row.tratamiento_otros_hora ?? '',
    tratamientoOtrosForma: row.tratamiento_otros_forma ?? '',
    tratamientoOtrosFormaOtros: row.tratamiento_otros_forma_otros ?? '',
    proceso: normalizeLista(row.proceso),
    procesoOtros: row.proceso_otros ?? '',
    desde: row.desde ?? '',
    hasta: row.hasta ?? '',
    ctesP: row.ctes_p ?? '',
    ctesT: row.ctes_t ?? '',
    ctesS: row.ctes_s ?? '',
    ctesTa: row.ctes_ta ?? '',
    ctesGlucemia: row.ctes_glucemia ?? '',
    ctesPeso: row.ctes_peso ?? '',
    observaciones: row.observaciones ?? '',
    firma: row.firma ?? '',
    firmaDibujo: row.firma_dibujo ?? '',
    createdAt: row.created_at,
    createdBy: row.created_by ?? '',
  }
}

function incidenciaToRow(
  data: Omit<Incidencia, 'id' | 'createdAt'>,
  id?: string,
): Omit<IncidenciaRow, 'created_at'> {
  return {
    ...(id ? { id } : { id: crypto.randomUUID() }),
    persona_id: data.personaId,
    fecha: data.fecha,
    turno: data.turno,
    de: data.de,
    a: data.a,
    estado: data.estado,
    estado_otros: data.estadoOtros ?? '',
    incidencia: data.incidencia ?? '',
    prioridad: data.prioridad ?? '',
    lesiones: data.lesiones ?? '',
    caida_naf: data.caidaNaf ?? false,
    caida_af: data.caidaAf ?? false,
    hospital_tras: data.hospitalTras ?? false,
    hospital_regr: data.hospitalRegr ?? false,
    dieta: data.dieta,
    dieta_otros: data.dietaOtros ?? '',
    tratamiento: normalizeTratamientos(data.tratamiento),
    tratamiento_otros: data.tratamientoOtros ?? '',
    tratamiento_otros_hora: data.tratamientoOtrosHora ?? '',
    tratamiento_otros_forma: data.tratamientoOtrosForma ?? '',
    tratamiento_otros_forma_otros: data.tratamientoOtrosFormaOtros ?? '',
    proceso: data.proceso,
    proceso_otros: data.procesoOtros ?? '',
    desde: data.desde ?? '',
    hasta: data.hasta ?? '',
    ctes_p: data.ctesP ?? '',
    ctes_t: data.ctesT ?? '',
    ctes_s: data.ctesS ?? '',
    ctes_ta: data.ctesTa ?? '',
    ctes_glucemia: data.ctesGlucemia ?? '',
    ctes_peso: data.ctesPeso ?? '',
    observaciones: data.observaciones ?? '',
    firma: data.firma ?? '',
    firma_dibujo: data.firmaDibujo ?? '',
    created_by: data.createdBy || null,
  }
}

function client() {
  if (!supabase) throw new Error('Supabase no configurado')
  return supabase
}

async function ensureAuthenticated(): Promise<void> {
  const { data, error } = await client().auth.getSession()
  if (error) throw new Error(error.message)
  if (!data.session) {
    throw new Error('Sesión expirada. Cierra sesión e inicia sesión de nuevo para sincronizar datos.')
  }
}

export async function getPersonasFromSupabase(): Promise<Persona[]> {
  await ensureAuthenticated()

  const { data, error } = await client()
    .from('personas')
    .select('*')
    .order('ala')
    .order('codigo')

  if (error) throw new Error(error.message)
  return (data as PersonaRow[]).map(rowToPersona)
}

export async function savePersonaToSupabase(
  input: Omit<Persona, 'id' | 'createdAt'> & { id?: string },
): Promise<Persona> {
  await ensureAuthenticated()
  const db = client()

  if (input.id) {
    const { data, error } = await db
      .from('personas')
      .update(personaToRow(input))
      .eq('id', input.id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return rowToPersona(data as PersonaRow)
  }

  const codigo = input.codigo.trim().toUpperCase()
  const { data: existing } = await db
    .from('personas')
    .select('id')
    .ilike('codigo', codigo)
    .maybeSingle()

  if (existing) throw new Error('Ya existe una persona con ese código')

  const { data, error } = await db
    .from('personas')
    .insert(personaToRow(input))
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return rowToPersona(data as PersonaRow)
}

export async function deletePersonaFromSupabase(id: string): Promise<void> {
  await ensureAuthenticated()
  const { error } = await client().from('personas').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getIncidenciasFromSupabase(): Promise<Incidencia[]> {
  await ensureAuthenticated()

  const { data, error } = await client()
    .from('incidencias')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data as IncidenciaRow[]).map(rowToIncidencia)
}

export async function createIncidenciaInSupabase(
  data: Omit<Incidencia, 'id' | 'createdAt'>,
): Promise<Incidencia> {
  await ensureAuthenticated()
  const row = incidenciaToRow(data)
  const { data: inserted, error } = await client()
    .from('incidencias')
    .insert(row)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return rowToIncidencia(inserted as IncidenciaRow)
}
