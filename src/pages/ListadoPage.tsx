import { useEffect, useMemo, useState } from 'react'
import { Download, FileSpreadsheet, Search, X } from 'lucide-react'
import { useLocation, useSearchParams } from 'react-router-dom'
import type { Incidencia, IncidenciaFilters, Persona, Ala } from '../types'
import { AREAS, TURNOS, areaLabel, formatDate, formatDateTime, turnoLabel } from '../lib/constants'
import { ALAS } from '../lib/habitaciones'
import {
  filterIncidenciasPorConcepto,
  filterIncidenciasPorTratamiento,
  isEventoCritico,
  sortIncidenciasRecientes,
} from '../lib/incidencias'
import { formatListaConOtros } from '../lib/listas'
import {
  formatTratamientos,
} from '../lib/tratamientos'
import {
  LISTADO_TIPOS,
  conceptosParaTipo,
  listadoTipoMeta,
  parseListadoTipo,
  type ListadoConceptoCampo,
  type ListadoTipo,
} from '../lib/listadoTipos'
import { IncidenciaDetalle } from '../components/IncidenciaDetalle'
import { PersonaSelect } from '../components/PersonaSelect'
import { TratamientoFilter } from '../components/TratamientoFilter'
import { PrioridadBadge } from '../components/PrioridadTags'
import { exportIncidenciasExcel, exportIncidenciasPdf } from '../lib/export'
import { filterIncidencias } from '../lib/storage'
import { useIncidencias, usePersonas } from '../hooks/useStorageData'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  PageHeader,
  SectionTitle,
  TabGroup,
  inputClass,
  selectClass,
} from '../components/ui'

const emptyFilters = (): IncidenciaFilters => ({
  q: '',
  fechaDesde: '',
  fechaHasta: '',
  turno: '',
  ala: '',
  tratamiento: '',
  de: '',
  a: '',
  personaId: '',
})

const CAMPO_LABEL: Record<ListadoConceptoCampo, string> = {
  dieta: 'Dieta',
  tratamiento: 'Tratamiento',
  proceso: 'Proceso',
}

function IncidenciaCard({
  item,
  persona,
  open,
  onToggle,
  highlight,
}: {
  item: Incidencia
  persona?: Persona
  open: boolean
  onToggle: () => void
  highlight?: ListadoConceptoCampo
}) {
  const destacado = highlight
    ? highlight === 'tratamiento'
      ? formatTratamientos(
          item.tratamiento,
          item.tratamientoOtros,
          item.tratamientoOtrosHoras,
          item.tratamientoOtrosForma,
          item.tratamientoOtrosFormaOtros,
          (item as { tratamientoOtrosHora?: string }).tratamientoOtrosHora,
        )
      : formatListaConOtros(item[highlight], item[`${highlight}Otros`])
    : null

  return (
    <Card
      className={`!p-0 overflow-hidden transition-all duration-200 ${
        open ? 'shadow-[var(--shadow-float)] ring-1 ring-brand-200/50' : 'hover:shadow-md'
      }`}
    >
      <button
        type="button"
        className="flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-brand-50/20 sm:flex-row sm:items-center"
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">
              {persona ? persona.codigo : 'Persona desconocida'}
            </span>
            <Badge tone="brand">
              {formatDate(item.fecha)} · {turnoLabel(item.turno)}
            </Badge>
            <PrioridadBadge value={item.prioridad} />
            {isEventoCritico(item) && <Badge tone="warn">Evento crítico</Badge>}
          </div>
          {destacado ? (
            <>
              <p className="mt-1.5 text-sm font-semibold text-brand-800">{destacado}</p>
              <p className="mt-0.5 truncate text-sm text-slate-600">
                {item.incidencia} · {formatListaConOtros(item.estado, item.estadoOtros)}
              </p>
            </>
          ) : (
            <p className="mt-1.5 truncate text-sm text-slate-600">
              {item.incidencia} · {formatListaConOtros(item.estado, item.estadoOtros)}
            </p>
          )}
          <p className="mt-1 text-xs font-medium text-slate-400">
            {areaLabel(item.de)} → {areaLabel(item.a)} · Firma: {item.firma}
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
          {formatDateTime(item.createdAt)}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/80 to-white px-5 py-4 text-sm animate-fade-up">
          <IncidenciaDetalle item={item} persona={persona} />
        </div>
      )}
    </Card>
  )
}

export function ListadoPage() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tipo = parseListadoTipo(searchParams.get('tipo'))
  const meta = listadoTipoMeta(tipo)
  const campo = meta.campo

  const [refreshKey, setRefreshKey] = useState(0)
  const { personas, loading: loadingPersonas, error: personasError } = usePersonas(refreshKey)
  const { incidencias: allIncidencias, loading: loadingIncidencias, error: incidenciasError } =
    useIncidencias(refreshKey)
  const [filters, setFilters] = useState<IncidenciaFilters>(emptyFilters)
  const [concepto, setConcepto] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setRefreshKey((k) => k + 1)
  }, [location.key])

  useEffect(() => {
    function onFocus() {
      setRefreshKey((k) => k + 1)
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const conceptos = useMemo(() => conceptosParaTipo(tipo), [tipo])

  const filtered = useMemo(() => {
    let base = filterIncidencias(allIncidencias, filters, personas, {
      periodoTratamiento: tipo === 'tratamientos',
    })

    if (tipo === 'tratamientos') {
      base = filterIncidenciasPorTratamiento(base, filters.tratamiento, true)
    } else if (filters.tratamiento) {
      base = filterIncidenciasPorTratamiento(base, filters.tratamiento)
    } else if (campo) {
      base = filterIncidenciasPorConcepto(base, campo, concepto)
    }

    return sortIncidenciasRecientes(base)
  }, [allIncidencias, filters, personas, tipo, campo, concepto])

  const personaMap = useMemo(() => new Map(personas.map((p) => [p.id, p])), [personas])

  function patchFilter<K extends keyof IncidenciaFilters>(key: K, value: IncidenciaFilters[K]) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'ala' && value && prev.personaId) {
        const persona = personaMap.get(prev.personaId)
        if (persona && persona.ala !== value) {
          next.personaId = ''
        }
      }
      return next
    })
  }

  function clearFilters() {
    setFilters(emptyFilters())
    setConcepto('')
  }

  function setTipo(next: ListadoTipo) {
    setExpandedId(null)
    setConcepto('')
    setRefreshKey((k) => k + 1)
    setSearchParams(next === 'general' ? {} : { tipo: next })
  }

  const hasFilters = Object.values(filters).some(Boolean) || !!concepto

  const showTratamientoFilter = tipo === 'general' || tipo === 'tratamientos'

  if (loadingPersonas || loadingIncidencias) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-slate-500">
        Cargando registros…
      </div>
    )
  }

  const loadError = personasError || incidenciasError

  return (
    <div>
      {loadError && (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
      )}
      <PageHeader
        title={meta.title}
        subtitle={`${filtered.length} registro${filtered.length === 1 ? '' : 's'} · solo lectura`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!filtered.length}
              onClick={() => exportIncidenciasExcel(filtered, personas)}
            >
              <FileSpreadsheet size={16} />
              Excel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!filtered.length}
              onClick={() => exportIncidenciasPdf(filtered, personas)}
            >
              <Download size={16} />
              PDF
            </Button>
          </div>
        }
      />

      <TabGroup
        className="mb-6"
        options={LISTADO_TIPOS.map((t) => ({ id: t.id, label: t.label }))}
        value={tipo}
        onChange={setTipo}
      />

      <p className="mb-6 text-sm leading-relaxed text-slate-500">{meta.hint}</p>

      <Card className="mb-6 animate-fade-up">
        <SectionTitle>Filtros</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campo && campo !== 'tratamiento' && (
            <Field label={CAMPO_LABEL[campo]}>
              <select
                className={selectClass}
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
              >
                <option value="">Todas las que tengan {CAMPO_LABEL[campo].toLowerCase()}</option>
                {conceptos.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
                <option value="__otros__">Solo «Otros» (texto libre)</option>
              </select>
            </Field>
          )}

          {showTratamientoFilter && (
            <TratamientoFilter
              value={filters.tratamiento}
              onChange={(v) => patchFilter('tratamiento', v)}
              listadoTratamientos={tipo === 'tratamientos'}
            />
          )}

          <Field label="Buscar texto">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className={`${inputClass} pl-9`}
                placeholder="Estado, incidencia, observaciones…"
                value={filters.q}
                onChange={(e) => patchFilter('q', e.target.value)}
              />
            </div>
          </Field>

          <Field label="Ala">
            <select
              className={selectClass}
              value={filters.ala}
              onChange={(e) => patchFilter('ala', e.target.value as Ala | '')}
            >
              <option value="">Todas</option>
              {ALAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Persona">
            <PersonaSelect
              value={filters.personaId}
              onChange={(v) => patchFilter('personaId', v)}
              alaFilter={filters.ala}
            />
          </Field>

          <Field label="Turno">
            <select
              className={selectClass}
              value={filters.turno}
              onChange={(e) => patchFilter('turno', e.target.value as IncidenciaFilters['turno'])}
            >
              <option value="">Todos</option>
              {TURNOS.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Desde (fecha)">
            <input
              type="date"
              className={inputClass}
              value={filters.fechaDesde}
              onChange={(e) => patchFilter('fechaDesde', e.target.value)}
            />
          </Field>

          <Field label="Hasta (fecha)">
            <input
              type="date"
              className={inputClass}
              value={filters.fechaHasta}
              onChange={(e) => patchFilter('fechaHasta', e.target.value)}
            />
          </Field>

          <Field label="Área DE">
            <select
              className={selectClass}
              value={filters.de}
              onChange={(e) => patchFilter('de', e.target.value as IncidenciaFilters['de'])}
            >
              <option value="">Todas</option>
              {AREAS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Área A">
            <select
              className={selectClass}
              value={filters.a}
              onChange={(e) => patchFilter('a', e.target.value as IncidenciaFilters['a'])}
            >
              <option value="">Todas</option>
              {AREAS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {hasFilters && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X size={14} />
              Limpiar filtros
            </Button>
          </div>
        )}
      </Card>

      {!filtered.length ? (
        <EmptyState
          title="No hay incidencias"
          description={
            hasFilters || tipo !== 'general'
              ? 'Prueba con otros filtros o registra una nueva incidencia.'
              : 'Aún no hay registros. Crea la primera desde Nueva incidencia.'
          }
        />
      ) : (
        <div className="space-y-3 animate-fade-up">
          {filtered.map((item) => {
            const persona = personaMap.get(item.personaId)
            const open = expandedId === item.id

            return (
              <IncidenciaCard
                key={item.id}
                item={item}
                persona={persona}
                open={open}
                highlight={campo}
                onToggle={() => setExpandedId(open ? null : item.id)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
