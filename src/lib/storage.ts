import type { Incidencia, IncidenciaFilters, Persona } from '../types'
import { normalizePersona } from './habitaciones'
import { formatListaConOtros } from './listas'
import { normalizeAreas } from './areas'
import { matchesIncidenciaFechaFilter } from './dates'
import { normalizeIncidencia } from './normalizeIncidencia'
import { formatTratamientos } from './tratamientos'
import { isSupabaseConfigured } from './supabase'
import {
  createIncidenciaInSupabase,
  deleteIncidenciaFromSupabase,
  deletePersonaFromSupabase,
  getIncidenciasFromSupabase,
  getPersonasFromSupabase,
  savePersonaToSupabase,
} from './storageSupabase'

let preferLocalStorage = false

function shouldUseSupabase(): boolean {
  return isSupabaseConfigured() && !preferLocalStorage
}

function disableSupabaseFallback(): void {
  preferLocalStorage = true
}

function isSupabaseFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  return (
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('could not find the') ||
    msg.includes('supabase no configurado')
  )
}

async function withStorageFallback<T>(
  supabaseFn: () => Promise<T>,
  localFn: () => T | Promise<T>,
): Promise<T> {
  if (!shouldUseSupabase()) return localFn()
  try {
    return await supabaseFn()
  } catch (err) {
    if (isSupabaseFailure(err)) {
      disableSupabaseFallback()
      return localFn()
    }
    throw err
  }
}

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

function deleteIncidenciaLocal(id: string): void {
  seedIfNeededLocal()
  const list = read<Incidencia[]>(KEYS.incidencias, []).filter((item) => item.id !== id)
  write(KEYS.incidencias, list)
}

export async function getPersonas(): Promise<Persona[]> {
  return withStorageFallback(getPersonasFromSupabase, getPersonasLocal)
}

export async function savePersona(
  input: Omit<Persona, 'id' | 'createdAt'> & { id?: string },
): Promise<Persona> {
  return withStorageFallback(() => savePersonaToSupabase(input), () => savePersonaLocal(input))
}

export async function deletePersona(id: string): Promise<void> {
  if (shouldUseSupabase()) {
    return withStorageFallback(
      () => deletePersonaFromSupabase(id),
      () => {
        deletePersonaLocal(id)
      },
    )
  }
  deletePersonaLocal(id)
}

export async function getIncidencias(): Promise<Incidencia[]> {
  if (shouldUseSupabase()) {
    return withStorageFallback(
      async () => (await getIncidenciasFromSupabase()).map((item) => normalizeIncidencia(item)),
      getIncidenciasLocal,
    )
  }
  return getIncidenciasLocal()
}

export async function createIncidencia(
  data: Omit<Incidencia, 'id' | 'createdAt'>,
): Promise<Incidencia> {
  return withStorageFallback(() => createIncidenciaInSupabase(data), () => createIncidenciaLocal(data))
}

export async function deleteIncidencia(id: string): Promise<void> {
  if (shouldUseSupabase()) {
    return withStorageFallback(
      () => deleteIncidenciaFromSupabase(id),
      () => {
        deleteIncidenciaLocal(id)
      },
    )
  }
  deleteIncidenciaLocal(id)
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
    if (personaIdsAla && item.personaId && !personaIdsAla.has(item.personaId)) return false
    if (filters.turno && item.turno !== filters.turno) return false
    if (filters.de && !normalizeAreas(item.de).includes(filters.de)) return false
    if (filters.a && !normalizeAreas(item.a).includes(filters.a)) return false
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
