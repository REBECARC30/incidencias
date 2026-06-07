import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { calcularEstadisticas, filtrarIncidenciasPorFecha } from '../lib/estadisticas'
import { useIncidencias, usePersonas } from '../hooks/useStorageData'
import { StatBarList, StatGrid, StatKpi } from '../components/StatBarList'
import { Card, EmptyState, Field, PageHeader, SectionTitle, inputClass } from '../components/ui'

function StatSection({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`animate-fade-up ${className}`}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </Card>
  )
}

export function EstadisticasPage() {
  const location = useLocation()
  const [refreshKey, setRefreshKey] = useState(0)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

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

  const { personas, loading: loadingPersonas } = usePersonas(refreshKey)
  const { incidencias: allIncidencias, loading: loadingIncidencias } = useIncidencias(refreshKey)
  const incidencias = useMemo(
    () => filtrarIncidenciasPorFecha(allIncidencias, fechaDesde, fechaHasta),
    [allIncidencias, fechaDesde, fechaHasta],
  )

  const stats = useMemo(
    () => calcularEstadisticas(incidencias, personas),
    [incidencias, personas],
  )

  const hasFiltro = !!(fechaDesde || fechaHasta)

  if (loadingPersonas || loadingIncidencias) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-slate-500">
        Cargando estadísticas…
      </div>
    )
  }

  if (!stats.totalIncidencias) {
    return (
      <div>
        <PageHeader
          title="Estadísticas"
          subtitle="Resumen agregado de todos los registros"
        />
        <Card className="mb-6">
          <SectionTitle>Periodo</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Desde">
              <input
                type="date"
                className={inputClass}
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </Field>
            <Field label="Hasta">
              <input
                type="date"
                className={inputClass}
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </Field>
          </div>
        </Card>
        <EmptyState
          title="Sin datos para mostrar"
          description={
            hasFiltro
              ? 'No hay incidencias en el periodo seleccionado. Prueba otro rango de fechas.'
              : 'Registra incidencias para ver estadísticas aquí.'
          }
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Estadísticas"
        subtitle={`${stats.totalIncidencias} incidencia${stats.totalIncidencias === 1 ? '' : 's'}${hasFiltro ? ' en el periodo filtrado' : ' en total'}`}
      />

      <Card className="mb-6">
        <SectionTitle>Periodo</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Desde">
            <input
              type="date"
              className={inputClass}
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </Field>
          <Field label="Hasta">
            <input
              type="date"
              className={inputClass}
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatKpi label="Incidencias" value={stats.totalIncidencias} tone="brand" />
        <StatKpi
          label="Personas atendidas"
          value={stats.totalPersonas}
          hint={`Media ${stats.mediaPorPersona} / persona con registro`}
        />
        <StatKpi
          label="Eventos críticos"
          value={stats.eventosCriticos}
          hint="Caídas o traslado hospital"
          tone="warn"
        />
        <StatKpi
          label="Con prioridad"
          value={stats.conPrioridad}
          hint={`${stats.totalIncidencias - stats.conPrioridad} sin indicar`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StatSection title="Por turno">
          <StatBarList items={stats.porTurno.filter((i) => i.count > 0)} />
        </StatSection>

        <StatSection title="Por ala">
          <StatBarList items={stats.porAla.filter((i) => i.count > 0)} />
        </StatSection>

        <StatSection title="Prioridad">
          <StatBarList items={stats.porPrioridad} />
        </StatSection>

        <StatSection title="Eventos de riesgo">
          <StatBarList
            items={[
              { label: 'Caída N.A.F.', count: stats.caidasNaf, pct: stats.caidasNaf / stats.totalIncidencias * 100 },
              { label: 'Caída A.F.', count: stats.caidasAf, pct: stats.caidasAf / stats.totalIncidencias * 100 },
              { label: 'Hospital (traslado)', count: stats.hospitalTras, pct: stats.hospitalTras / stats.totalIncidencias * 100 },
              { label: 'Hospital (reingreso)', count: stats.hospitalRegr, pct: stats.hospitalRegr / stats.totalIncidencias * 100 },
              { label: 'Con lesiones', count: stats.conLesiones, pct: stats.conLesiones / stats.totalIncidencias * 100 },
            ].map((i) => ({ ...i, pct: Math.round(i.pct * 10) / 10 }))}
          />
        </StatSection>

        <StatSection title="Área DE (origen)">
          <StatBarList items={stats.porAreaDe} />
        </StatSection>

        <StatSection title="Área A (destino)">
          <StatBarList items={stats.porAreaA} />
        </StatSection>

        <StatSection title="Flujos DE → A (top 10)" className="lg:col-span-2">
          <StatBarList items={stats.flujosArea} />
        </StatSection>

        <StatSection title="Estados (top 12)">
          <StatBarList items={stats.topEstados} />
        </StatSection>

        <StatSection title="Dietas (top 12)">
          <StatBarList items={stats.topDietas} />
        </StatSection>

        <StatSection title="Tratamientos (top 12)">
          <StatBarList items={stats.topTratamientos} />
        </StatSection>

        <StatSection title="Procesos (top 12)">
          <StatBarList items={stats.topProcesos} />
        </StatSection>

        <StatSection title="Tratamientos por tipo">
          <StatBarList
            items={[
              {
                label: 'Farmacológicos (aplicaciones)',
                count: stats.tratamientosFarmacologicos,
                pct: stats.tratamientosFarmacologicos / Math.max(stats.conTratamiento, 1) * 100,
              },
              {
                label: 'No farmacológicos (aplicaciones)',
                count: stats.tratamientosNoFarmacologicos,
                pct: stats.tratamientosNoFarmacologicos / Math.max(stats.conTratamiento, 1) * 100,
              },
              {
                label: 'Incidencias con tratamiento',
                count: stats.conTratamiento,
                pct: stats.conTratamiento / stats.totalIncidencias * 100,
              },
            ].map((i) => ({ ...i, pct: Math.round(i.pct * 10) / 10 }))}
          />
        </StatSection>

        <StatSection title="Códigos con más registros">
          <StatBarList items={stats.topPersonas} />
        </StatSection>

        <StatSection title="Por quien firma / registra">
          <StatBarList items={stats.porRegistrador} />
        </StatSection>

        <StatSection title="Por mes" className="lg:col-span-2">
          {stats.porMes.length ? (
            <StatBarList items={stats.porMes} />
          ) : (
            <p className="text-sm text-slate-500">Sin fechas válidas para agrupar.</p>
          )}
        </StatSection>

        <StatSection title="Por día de la semana" className="lg:col-span-2">
          <StatGrid items={stats.porDiaSemana} />
        </StatSection>
      </div>
    </div>
  )
}
