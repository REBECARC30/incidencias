import type { AreaCode, Incidencia } from '../types'
import { normalizeEstados } from './estados'
import { normalizeAreas } from './areas'
import { normalizeLista, normalizeProcesoLista } from './listas'
import { normalizeHoras, normalizeTratamientos } from './tratamientos'

export type LegacyIncidenciaFields = {
  dietaFecha?: string
  tratamientoFecha?: string
  procesoFecha?: string
  desde?: string
  hasta?: string
  tratamientoOtrosHora?: string
}

function normalizeApartadoPeriodo(
  desde: string | undefined,
  hasta: string | undefined,
  legacyFecha?: string,
  legacyDesde?: string,
  legacyHasta?: string,
): { desde: string; hasta: string } {
  return {
    desde: (desde ?? legacyFecha ?? legacyDesde ?? '').trim(),
    hasta: (hasta ?? legacyHasta ?? '').trim(),
  }
}

export function normalizeIncidencia(item: Incidencia & LegacyIncidenciaFields): Incidencia {
  const legacy = item as LegacyIncidenciaFields
  const dieta = normalizeApartadoPeriodo(item.dietaDesde, item.dietaHasta, legacy.dietaFecha)
  const tratamiento = normalizeApartadoPeriodo(
    item.tratamientoDesde,
    item.tratamientoHasta,
    legacy.tratamientoFecha,
    legacy.desde,
    legacy.hasta,
  )
  const proceso = normalizeApartadoPeriodo(item.procesoDesde, item.procesoHasta, legacy.procesoFecha)

  return {
    ...item,
    estado: normalizeEstados(item.estado as string | string[]),
    estadoOtros: item.estadoOtros ?? '',
    ctesGlucemia: item.ctesGlucemia ?? '',
    ctesPeso: item.ctesPeso ?? '',
    prioridad: item.prioridad ?? '',
    de: normalizeAreas(item.de as AreaCode | AreaCode[]),
    a: normalizeAreas(item.a as AreaCode | AreaCode[]),
    dieta: normalizeLista(item.dieta as string | string[]),
    dietaOtros: item.dietaOtros ?? '',
    dietaDesde: dieta.desde,
    dietaHasta: dieta.hasta,
    tratamiento: normalizeTratamientos(item.tratamiento),
    tratamientoOtros: item.tratamientoOtros ?? '',
    tratamientoDesde: tratamiento.desde,
    tratamientoHasta: tratamiento.hasta,
    tratamientoOtrosHoras: normalizeHoras(item.tratamientoOtrosHoras, legacy.tratamientoOtrosHora),
    tratamientoOtrosForma: item.tratamientoOtrosForma ?? '',
    tratamientoOtrosFormaOtros: item.tratamientoOtrosFormaOtros ?? '',
    proceso: normalizeProcesoLista(item.proceso as string | string[]),
    procesoOtros: item.procesoOtros ?? '',
    procesoDesde: proceso.desde,
    procesoHasta: proceso.hasta,
    firmaDibujo: item.firmaDibujo ?? '',
  }
}
