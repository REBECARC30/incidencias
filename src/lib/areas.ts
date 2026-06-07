import type { AreaCode } from '../types'
import { AREAS, areaLabel } from './constants'

const VALID_AREA_CODES = new Set(AREAS.map((a) => a.code))

export function normalizeAreas(
  valor: AreaCode | AreaCode[] | string | string[] | undefined,
): AreaCode[] {
  if (!valor) return []
  const list = Array.isArray(valor) ? valor : [valor]
  return list
    .map((v) => String(v).trim())
    .filter((v): v is AreaCode => VALID_AREA_CODES.has(v as AreaCode))
}

export function formatAreas(valor: AreaCode | AreaCode[]): string {
  return normalizeAreas(valor).map(areaLabel).join(' · ')
}

export function formatAreasCodes(valor: AreaCode | AreaCode[]): string {
  return normalizeAreas(valor).join(' · ')
}
