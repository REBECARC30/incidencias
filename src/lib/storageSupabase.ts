import type { Incidencia, Persona, TratamientoRegistro } from '../types'
import { normalizePersona } from './habitaciones'
import { normalizeAreas } from './areas'
import { normalizeIncidencia, type LegacyIncidenciaFields } from './normalizeIncidencia'
import { getSupabase } from './supabase'
import { normalizeHoras, normalizeTratamientos } from './tratamientos'

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
  persona_id: string | null
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
  dieta_desde: string
  dieta_hasta: string
  dieta_fecha: string
  tratamiento: TratamientoRegistro[]
  tratamiento_otros: string
  tratamiento_desde: string
  tratamiento_hasta: string
  tratamiento_fecha: string
  tratamiento_otros_horas: string[]
  tratamiento_otros_hora: string
  tratamiento_otros_forma: Incidencia['tratamientoOtrosForma']
  tratamiento_otros_forma_otros: string
  proceso: string[]
  proceso_otros: string
  proceso_desde: string
  proceso_hasta: string
  proceso_fecha: string
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

type IncidenciaInsertRow = Omit<IncidenciaRow, 'created_at'>

const INCIDENCIA_PERIOD_COLUMNS = [
  'dieta_desde',
  'dieta_hasta',
  'dieta_fecha',
  'tratamiento_desde',
  'tratamiento_hasta',
  'tratamiento_fecha',
  'proceso_desde',
  'proceso_hasta',
  'proceso_fecha',
] as const

function pickLegacyPeriod(data: Omit<Incidencia, 'id' | 'createdAt'>): { desde: string; hasta: string } {
  const desde =
    data.tratamientoDesde.trim() ||
    data.dietaDesde.trim() ||
    data.procesoDesde.trim()
  const hasta =
    data.tratamientoHasta.trim() ||
    data.dietaHasta.trim() ||
    data.procesoHasta.trim()
  return { desde, hasta }
}

function isMissingColumnError(message: string): boolean {
  return /schema cache|does not exist|could not find the/i.test(message)
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  )
}

function toUuidOrNull(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  return isUuid(value) ? value.trim() : null
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
  return normalizeIncidencia({
    id: row.id,
    personaId: row.persona_id ?? '',
    fecha: row.fecha,
    turno: row.turno,
    de: row.de,
    a: row.a,
    estado: row.estado,
    estadoOtros: row.estado_otros ?? '',
    incidencia: row.incidencia ?? '',
    prioridad: row.prioridad ?? '',
    lesiones: row.lesiones ?? '',
    caidaNaf: row.caida_naf ?? false,
    caidaAf: row.caida_af ?? false,
    hospitalTras: row.hospital_tras ?? false,
    hospitalRegr: row.hospital_regr ?? false,
    dieta: row.dieta,
    dietaOtros: row.dieta_otros ?? '',
    dietaDesde: row.dieta_desde ?? '',
    dietaHasta: row.dieta_hasta ?? '',
    dietaFecha: row.dieta_fecha,
    tratamiento: row.tratamiento,
    tratamientoOtros: row.tratamiento_otros ?? '',
    tratamientoDesde: row.tratamiento_desde ?? '',
    tratamientoHasta: row.tratamiento_hasta ?? '',
    tratamientoFecha: row.tratamiento_fecha,
    tratamientoOtrosHoras: row.tratamiento_otros_horas,
    tratamientoOtrosHora: row.tratamiento_otros_hora,
    tratamientoOtrosForma: row.tratamiento_otros_forma ?? '',
    tratamientoOtrosFormaOtros: row.tratamiento_otros_forma_otros ?? '',
    proceso: row.proceso,
    procesoOtros: row.proceso_otros ?? '',
    procesoDesde: row.proceso_desde ?? '',
    procesoHasta: row.proceso_hasta ?? '',
    procesoFecha: row.proceso_fecha,
    desde: row.desde,
    hasta: row.hasta,
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
  } as Incidencia & LegacyIncidenciaFields)
}

function incidenciaToRow(
  data: Omit<Incidencia, 'id' | 'createdAt'>,
  id?: string,
): IncidenciaInsertRow {
  return {
    ...(id ? { id } : { id: crypto.randomUUID() }),
    persona_id: toUuidOrNull(data.personaId),
    fecha: data.fecha,
    turno: data.turno,
    de: normalizeAreas(data.de),
    a: normalizeAreas(data.a),
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
    dieta_desde: data.dietaDesde ?? '',
    dieta_hasta: data.dietaHasta ?? '',
    tratamiento: normalizeTratamientos(data.tratamiento),
    tratamiento_otros: data.tratamientoOtros ?? '',
    tratamiento_desde: data.tratamientoDesde ?? '',
    tratamiento_hasta: data.tratamientoHasta ?? '',
    tratamiento_otros_horas: normalizeHoras(data.tratamientoOtrosHoras).filter(Boolean),
    tratamiento_otros_hora: normalizeHoras(data.tratamientoOtrosHoras)[0] ?? '',
    tratamiento_otros_forma: data.tratamientoOtrosForma ?? '',
    tratamiento_otros_forma_otros: data.tratamientoOtrosFormaOtros ?? '',
    proceso: data.proceso,
    proceso_otros: data.procesoOtros ?? '',
    proceso_desde: data.procesoDesde ?? '',
    proceso_hasta: data.procesoHasta ?? '',
    ctes_p: data.ctesP ?? '',
    ctes_t: data.ctesT ?? '',
    ctes_s: data.ctesS ?? '',
    ctes_ta: data.ctesTa ?? '',
    ctes_glucemia: data.ctesGlucemia ?? '',
    ctes_peso: data.ctesPeso ?? '',
    observaciones: data.observaciones ?? '',
    firma: data.firma ?? '',
    firma_dibujo: data.firmaDibujo ?? '',
    created_by: toUuidOrNull(data.createdBy),
  } as IncidenciaInsertRow
}

function incidenciaToLegacyRow(
  data: Omit<Incidencia, 'id' | 'createdAt'>,
  id?: string,
): Record<string, unknown> {
  const row = incidenciaToRow(data, id)
  const legacy: Record<string, unknown> = { ...row }
  for (const key of INCIDENCIA_PERIOD_COLUMNS) {
    delete legacy[key]
  }
  delete legacy.tratamiento_otros_horas

  const periodo = pickLegacyPeriod(data)
  legacy.desde = periodo.desde
  legacy.hasta = periodo.hasta
  return legacy
}

function client() {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase no configurado')
  return supabase
}

function supabaseErrorMessage(message: string): string {
  if (/schema cache|dieta_desde|dieta_hasta|tratamiento_desde|proceso_desde/i.test(message)) {
    return (
      'La base de datos de Supabase no está actualizada. En el SQL Editor del proyecto ejecuta el archivo supabase/migration-fechas-apartados.sql y vuelve a intentarlo.'
    )
  }
  if (
    /area_code|malformed array|column "de"|column "a"|invalid input syntax.*de|invalid input syntax.*a/i.test(
      message,
    )
  ) {
    return (
      'Las columnas DE y A deben aceptar varias áreas. En el SQL Editor ejecuta supabase/migration-areas-multiples.sql y vuelve a intentarlo.'
    )
  }
  if (/invalid input syntax for type uuid/i.test(message)) {
    return 'Identificador no válido. Cierra sesión, vuelve a entrar e intenta de nuevo.'
  }
  return message
}

async function ensureAuthenticated(): Promise<void> {
  const { data, error } = await client().auth.getSession()
  if (error) throw new Error(supabaseErrorMessage(error.message))
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

  if (error) throw new Error(supabaseErrorMessage(error.message))
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

    if (error) throw new Error(supabaseErrorMessage(error.message))
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

  if (error) throw new Error(supabaseErrorMessage(error.message))
  return rowToPersona(data as PersonaRow)
}

export async function deletePersonaFromSupabase(id: string): Promise<void> {
  await ensureAuthenticated()
  const { error } = await client().from('personas').delete().eq('id', id)
  if (error) throw new Error(supabaseErrorMessage(error.message))
}

export async function deleteIncidenciaFromSupabase(id: string): Promise<void> {
  await ensureAuthenticated()
  const { error } = await client().from('incidencias').delete().eq('id', id)
  if (error) throw new Error(supabaseErrorMessage(error.message))
}

export async function getIncidenciasFromSupabase(): Promise<Incidencia[]> {
  await ensureAuthenticated()

  const { data, error } = await client()
    .from('incidencias')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(supabaseErrorMessage(error.message))
  return (data as IncidenciaRow[]).map(rowToIncidencia)
}

export async function createIncidenciaInSupabase(
  data: Omit<Incidencia, 'id' | 'createdAt'>,
): Promise<Incidencia> {
  await ensureAuthenticated()

  const db = client()
  const row = incidenciaToRow(data)

  const { data: inserted, error } = await db.from('incidencias').insert(row).select('*').single()

  if (!error) return rowToIncidencia(inserted as IncidenciaRow)

  if (isMissingColumnError(error.message)) {
    const legacyRow = incidenciaToLegacyRow(data)
    const retry = await db.from('incidencias').insert(legacyRow).select('*').single()
    if (!retry.error) return rowToIncidencia(retry.data as IncidenciaRow)
    throw new Error(supabaseErrorMessage(retry.error.message))
  }

  throw new Error(supabaseErrorMessage(error.message))
}
