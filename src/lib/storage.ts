import type { Incidencia, IncidenciaFilters, Persona } from '../types'
import { normalizeEstados } from './estados'
import { normalizePersona } from './habitaciones'
import { formatListaConOtros, normalizeLista } from './listas'
import { matchesIncidenciaFechaFilter } from './dates'
import { formatTratamientos, normalizeHoras, normalizeTratamientos } from './tratamientos'
import { isSupabaseConfigured } from './supabase'
import {
  createIncidenciaInSupabase,
  deletePersonaFromSupabase,
  getIncidenciasFromSupabase,
  getPersonasFromSupabase,
  savePersonaToSupabase,
} from './storageSupabase'

const KEYS = {
  personas: 'appincidencias_personas',
  incidencias: 'appincidencias_incidencias',
  seeded: 'appincidencias_seeded',
} as const

const CLEAN_VERSION_KEY = 'appincidencias_clean_v4'

function migrateFromDemoIfNeeded(): void {
  if (read(CLEAN_VERSION_KEY, false)) return

  localStorage.removeItem('appincidencias_demo_incidencias_v3')
  localStorage.removeItem('appincidencias_tratamiento_prueba_mes')
  localStorage.removeItem('appincidencias_workers')
  write(KEYS.personas, [])
  write(KEYS.incidencias, [])
  write(CLEAN_VERSION_KEY, true)
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function uid(): string {
  return crypto.randomUUID()
}

function seedIfNeededLocal(): void {
  migrateFromDemoIfNeeded()
  if (read(KEYS.seeded, false)) return

  write(KEYS.personas, [])
  write(KEYS.incidencias, [])
  write(KEYS.seeded, true)
}

function normalizeIncidencia(item: Incidencia): Incidencia {
  return {
    ...item,
    estado: normalizeEstados(item.estado as string | string[]),
    estadoOtros: item.estadoOtros ?? '',
    ctesGlucemia: item.ctesGlucemia ?? '',
    ctesPeso: item.ctesPeso ?? '',
    prioridad: item.prioridad ?? '',
    dieta: normalizeLista(item.dieta as string | string[]),
    dietaOtros: item.dietaOtros ?? '',
    dietaFecha: item.dietaFecha ?? '',
    tratamiento: normalizeTratamientos(item.tratamiento),
    tratamientoOtros: item.tratamientoOtros ?? '',
    tratamientoFecha: item.tratamientoFecha ?? '',
    tratamientoOtrosHoras: normalizeHoras(
      item.tratamientoOtrosHoras,
      (item as { tratamientoOtrosHora?: string }).tratamientoOtrosHora,
    ),
    tratamientoOtrosForma: item.tratamientoOtrosForma ?? '',
    tratamientoOtrosFormaOtros: item.tratamientoOtrosFormaOtros ?? '',
    proceso: normalizeLista(item.proceso as string | string[]),
    procesoOtros: item.procesoOtros ?? '',
    procesoFecha: item.procesoFecha ?? '',
    firmaDibujo: item.firmaDibujo ?? '',
  }
}

function getPersonasLocal(): Persona[] {
  seedIfNeededLocal()
  type LegacyPersona = Persona & { nombre?: string }
  return read<LegacyPersona[]>(KEYS.personas, [])
    .map(({ nombre: _nombre, ...persona }) => normalizePersona(persona))
    .sort((a, b) => a.ala.localeCompare(b.ala) || a.codigo.localeCompare(b.codigo))
}

function savePersonaLocal(input: Omit<Persona, 'id' | 'createdAt'> & { id?: string }): Persona {
  const list = getPersonasLocal()
  const now = new Date().toISOString()

  if (input.id) {
    const idx = list.findIndex((p) => p.id === input.id)
    if (idx === -1) throw new Error('Persona no encontrada')
    const updated: Persona = { ...list[idx], ...input, id: input.id, createdAt: list[idx].createdAt }
    list[idx] = updated
    write(KEYS.personas, list)
    return updated
  }

  const codigoExists = list.some(
    (p) => p.codigo.toLowerCase() === input.codigo.trim().toLowerCase(),
  )
  if (codigoExists) throw new Error('Ya existe una persona con ese código')

  const created: Persona = {
    id: uid(),
    codigo: input.codigo.trim().toUpperCase(),
    ala: input.ala,
    habitacion: input.habitacion.trim(),
    createdAt: now,
  }
  write(KEYS.personas, [...list, created])
  return created
}

function deletePersonaLocal(id: string): void {
  const list = getPersonasLocal().filter((p) => p.id !== id)
  write(KEYS.personas, list)
}

function getIncidenciasLocal(): Incidencia[] {
  seedIfNeededLocal()
  return read<Incidencia[]>(KEYS.incidencias, [])
    .map(normalizeIncidencia)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function createIncidenciaLocal(data: Omit<Incidencia, 'id' | 'createdAt'>): Incidencia {
  seedIfNeededLocal()
  const item: Incidencia = normalizeIncidencia({
    ...data,
    id: uid(),
    createdAt: new Date().toISOString(),
  })
  const existing = read<Incidencia[]>(KEYS.incidencias, [])
  write(KEYS.incidencias, [...existing, item])
  return item
}

export async function getPersonas(): Promise<Persona[]> {
  if (isSupabaseConfigured) return getPersonasFromSupabase()
  return getPersonasLocal()
}

export async function savePersona(
  input: Omit<Persona, 'id' | 'createdAt'> & { id?: string },
): Promise<Persona> {
  if (isSupabaseConfigured) return savePersonaToSupabase(input)
  return savePersonaLocal(input)
}

export async function deletePersona(id: string): Promise<void> {
  if (isSupabaseConfigured) return deletePersonaFromSupabase(id)
  deletePersonaLocal(id)
}

export async function getIncidencias(): Promise<Incidencia[]> {
  if (isSupabaseConfigured) return getIncidenciasFromSupabase()
  return getIncidenciasLocal()
}

export async function createIncidencia(
  data: Omit<Incidencia, 'id' | 'createdAt'>,
): Promise<Incidencia> {
  if (isSupabaseConfigured) return createIncidenciaInSupabase(data)
  return createIncidenciaLocal(data)
}

export function filterIncidencias(
  items: Incidencia[],
  filters: IncidenciaFilters,
  personas: Persona[] = [],
  options?: { periodoTratamiento?: boolean },
): Incidencia[] {
  const q = filters.q.trim().toLowerCase()
  const personaIdsAla = filters.ala
    ? new Set(personas.filter((p) => p.ala === filters.ala).map((p) => p.id))
    : null

  return items.filter((item) => {
    if (filters.personaId && item.personaId !== filters.personaId) return false
    if (personaIdsAla && !personaIdsAla.has(item.personaId)) return false
    if (filters.turno && item.turno !== filters.turno) return false
    if (filters.de && item.de !== filters.de) return false
    if (filters.a && item.a !== filters.a) return false
    if (
      !matchesIncidenciaFechaFilter(item, filters.fechaDesde, filters.fechaHasta, {
        periodoTratamiento: options?.periodoTratamiento,
      })
    ) {
      return false
    }
    if (!q) return true

    const blob = [
      formatListaConOtros(item.estado, item.estadoOtros),
      item.incidencia,
      item.lesiones,
      formatListaConOtros(item.dieta, item.dietaOtros),
      formatTratamientos(
        item.tratamiento,
        item.tratamientoOtros,
        item.tratamientoOtrosHoras,
        item.tratamientoOtrosForma,
        item.tratamientoOtrosFormaOtros,
        (item as { tratamientoOtrosHora?: string }).tratamientoOtrosHora,
      ),
      formatListaConOtros(item.proceso, item.procesoOtros),
      item.observaciones,
      item.firma,
    ]
      .join(' ')
      .toLowerCase()

    return blob.includes(q)
  })
}
