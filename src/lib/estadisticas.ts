import type { Incidencia, Persona } from '../types'
import { normalizeAreas, formatAreas } from './areas'
import { AREAS, TURNOS, areaLabel, turnoLabel } from './constants'
import { alaLabel } from './habitaciones'
import { isEventoCritico } from './incidencias'
import { prioridadLabel } from './prioridades'
import { esTratamientoFarmacologico, esTratamientoNoFarmacologico } from './tratamientos'

export interface ConteoItem {
  label: string
  count: number
  pct: number
}

export interface EstadisticasResumen {
  totalIncidencias: number
  totalPersonas: number
  mediaPorPersona: number
  eventosCriticos: number
  caidasNaf: number
  caidasAf: number
  hospitalTras: number
  hospitalRegr: number
  conLesiones: number
  conTratamiento: number
  conPrioridad: number
  tratamientosFarmacologicos: number
  tratamientosNoFarmacologicos: number
  porTurno: ConteoItem[]
  porAla: ConteoItem[]
  porPrioridad: ConteoItem[]
  porAreaDe: ConteoItem[]
  porAreaA: ConteoItem[]
  flujosArea: ConteoItem[]
  porMes: ConteoItem[]
  porDiaSemana: ConteoItem[]
  topEstados: ConteoItem[]
  topDietas: ConteoItem[]
  topTratamientos: ConteoItem[]
  topProcesos: ConteoItem[]
  topPersonas: ConteoItem[]
  porRegistrador: ConteoItem[]
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function increment(map: Map<string, number>, key: string, delta = 1) {
  if (!key) return
  map.set(key, (map.get(key) ?? 0) + delta)
}

function pct(count: number, total: number): number {
  if (!total) return 0
  return Math.round((count / total) * 1000) / 10
}

function toItems(map: Map<string, number>, total: number, limit?: number): ConteoItem[] {
  const items = [...map.entries()]
    .map(([label, count]) => ({ label, count, pct: pct(count, total) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'))
  return limit ? items.slice(0, limit) : items
}

function mesLabel(ym: string): string {
  const [y, m] = ym.split('-')
  const meses = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ]
  const idx = Number(m) - 1
  return idx >= 0 && idx < 12 ? `${meses[idx]} ${y}` : ym
}

function fechaReferencia(item: Incidencia): string {
  return item.fecha || item.createdAt.slice(0, 10)
}

export function calcularEstadisticas(
  incidencias: Incidencia[],
  personas: Persona[],
): EstadisticasResumen {
  const total = incidencias.length
  const personaMap = new Map(personas.map((p) => [p.id, p]))

  const turnoMap = new Map<string, number>()
  const alaMap = new Map<string, number>()
  const prioridadMap = new Map<string, number>()
  const areaDeMap = new Map<string, number>()
  const areaAMap = new Map<string, number>()
  const flujoMap = new Map<string, number>()
  const mesMap = new Map<string, number>()
  const diaMap = new Map<string, number>()
  const estadoMap = new Map<string, number>()
  const dietaMap = new Map<string, number>()
  const tratamientoMap = new Map<string, number>()
  const procesoMap = new Map<string, number>()
  const personaCountMap = new Map<string, number>()
  const registradorMap = new Map<string, number>()

  let eventosCriticos = 0
  let caidasNaf = 0
  let caidasAf = 0
  let hospitalTras = 0
  let hospitalRegr = 0
  let conLesiones = 0
  let conTratamiento = 0
  let conPrioridad = 0
  let tratamientosFarmacologicos = 0
  let tratamientosNoFarmacologicos = 0

  for (const item of incidencias) {
    increment(turnoMap, turnoLabel(item.turno))
    for (const code of normalizeAreas(item.de)) increment(areaDeMap, areaLabel(code))
    for (const code of normalizeAreas(item.a)) increment(areaAMap, areaLabel(code))
    increment(flujoMap, `${formatAreas(item.de)} → ${formatAreas(item.a)}`)

    const persona = personaMap.get(item.personaId)
    if (persona) increment(alaMap, alaLabel(persona.ala))
    increment(personaCountMap, item.personaId)

    const prioLabel = item.prioridad ? prioridadLabel(item.prioridad) : 'Sin indicar'
    increment(prioridadMap, prioLabel)
    if (item.prioridad) conPrioridad++

    if (isEventoCritico(item)) eventosCriticos++
    if (item.caidaNaf) caidasNaf++
    if (item.caidaAf) caidasAf++
    if (item.hospitalTras) hospitalTras++
    if (item.hospitalRegr) hospitalRegr++
    if (item.lesiones.trim()) conLesiones++

    if (item.estado.length || item.estadoOtros.trim()) {
      for (const e of item.estado) increment(estadoMap, e)
      if (item.estadoOtros.trim()) increment(estadoMap, 'Otros (texto libre)')
    }

    if (item.dieta.length || item.dietaOtros.trim()) {
      for (const d of item.dieta) increment(dietaMap, d)
      if (item.dietaOtros.trim()) increment(dietaMap, 'Otros (texto libre)')
    }

    if (item.tratamiento.length || item.tratamientoOtros.trim()) {
      conTratamiento++
      for (const t of item.tratamiento) {
        increment(tratamientoMap, t.nombre)
        if (esTratamientoFarmacologico(t.nombre)) tratamientosFarmacologicos++
        if (esTratamientoNoFarmacologico(t.nombre)) tratamientosNoFarmacologicos++
      }
      if (item.tratamientoOtros.trim()) {
        increment(tratamientoMap, `Otros: ${item.tratamientoOtros.trim()}`)
      }
    }

    if (item.proceso.length || item.procesoOtros.trim()) {
      for (const p of item.proceso) increment(procesoMap, p)
      if (item.procesoOtros.trim()) increment(procesoMap, 'Otros (texto libre)')
    }

    const registrador = item.firma.trim() || item.createdBy || 'Desconocido'
    increment(registradorMap, registrador)

    const ref = fechaReferencia(item)
    if (/^\d{4}-\d{2}-\d{2}$/.test(ref)) {
      increment(mesMap, ref.slice(0, 7))
      const day = new Date(`${ref}T12:00:00`).getDay()
      increment(diaMap, DIAS_SEMANA[day] ?? '—')
    }
  }

  const personasConIncidencias = personaCountMap.size
  const topPersonas = [...personaCountMap.entries()]
    .map(([id, count]) => {
      const p = personaMap.get(id)
      return {
        label: p ? p.codigo : 'Persona desconocida',
        count,
        pct: pct(count, total),
      }
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'))
    .slice(0, 12)

  const porMes = [...mesMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, count]) => ({ label: mesLabel(ym), count, pct: pct(count, total) }))

  const porDiaSemana = DIAS_SEMANA.map((label) => ({
    label,
    count: diaMap.get(label) ?? 0,
    pct: pct(diaMap.get(label) ?? 0, total),
  })).filter((d) => d.count > 0)

  return {
    totalIncidencias: total,
    totalPersonas: personas.length,
    mediaPorPersona: personasConIncidencias ? Math.round((total / personasConIncidencias) * 10) / 10 : 0,
    eventosCriticos,
    caidasNaf,
    caidasAf,
    hospitalTras,
    hospitalRegr,
    conLesiones,
    conTratamiento,
    conPrioridad,
    tratamientosFarmacologicos,
    tratamientosNoFarmacologicos,
    porTurno: TURNOS.map((t) => ({
      label: t.label,
      count: turnoMap.get(t.label) ?? 0,
      pct: pct(turnoMap.get(t.label) ?? 0, total),
    })),
    porAla: (['1', '2'] as const).map((id) => ({
      label: alaLabel(id),
      count: alaMap.get(alaLabel(id)) ?? 0,
      pct: pct(alaMap.get(alaLabel(id)) ?? 0, total),
    })),
    porPrioridad: toItems(prioridadMap, total),
    porAreaDe: AREAS.map((a) => ({
      label: a.label,
      count: areaDeMap.get(a.label) ?? 0,
      pct: pct(areaDeMap.get(a.label) ?? 0, total),
    })).filter((i) => i.count > 0),
    porAreaA: AREAS.map((a) => ({
      label: a.label,
      count: areaAMap.get(a.label) ?? 0,
      pct: pct(areaAMap.get(a.label) ?? 0, total),
    })).filter((i) => i.count > 0),
    flujosArea: toItems(flujoMap, total, 10),
    porMes,
    porDiaSemana,
    topEstados: toItems(estadoMap, total, 12),
    topDietas: toItems(dietaMap, total, 12),
    topTratamientos: toItems(tratamientoMap, total, 12),
    topProcesos: toItems(procesoMap, total, 12),
    topPersonas,
    porRegistrador: toItems(registradorMap, total, 10),
  }
}

export function filtrarIncidenciasPorFecha(
  items: Incidencia[],
  fechaDesde: string,
  fechaHasta: string,
): Incidencia[] {
  if (!fechaDesde && !fechaHasta) return items
  const desde = fechaDesde || '0000-01-01'
  const hasta = fechaHasta || '9999-12-31'
  return items.filter((item) => {
    const ref = fechaReferencia(item)
    return ref >= desde && ref <= hasta
  })
}
