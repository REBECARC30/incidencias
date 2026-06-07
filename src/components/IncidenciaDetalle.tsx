import type { Incidencia, Persona } from '../types'
import { formatDate } from '../lib/constants'
import { formatUbicacion } from '../lib/habitaciones'
import { formatListaConOtros } from '../lib/listas'
import { prioridadLabel } from '../lib/prioridades'
import { formaAdministracionLabel, horasActivas, normalizeHoras } from '../lib/tratamientos'

interface IncidenciaDetalleProps {
  item: Incidencia
  persona?: Persona
}

export function IncidenciaDetalle({ item, persona }: IncidenciaDetalleProps) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      <div>
        <dt className="text-xs text-slate-500">Habitación</dt>
        <dd>{persona ? formatUbicacion(persona.ala, persona.habitacion) : '—'}</dd>
      </div>
      <div>
        <dt className="text-xs text-slate-500">Prioridad</dt>
        <dd>{item.prioridad ? prioridadLabel(item.prioridad) : '—'}</dd>
      </div>
      <div>
        <dt className="text-xs text-slate-500">Lesiones</dt>
        <dd>{item.lesiones || '—'}</dd>
      </div>
      <div>
        <dt className="text-xs text-slate-500">Caídas</dt>
        <dd>
          {item.caidaNaf && 'N.A.F '}
          {item.caidaAf && 'A.F '}
          {!item.caidaNaf && !item.caidaAf && '—'}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-slate-500">Hospital</dt>
        <dd>
          {item.hospitalTras && 'TRAS '}
          {item.hospitalRegr && 'REGR '}
          {!item.hospitalTras && !item.hospitalRegr && '—'}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-slate-500">Dieta</dt>
        <dd>
          {item.dietaFecha && (
            <span className="mr-2 text-xs font-medium text-slate-500">
              {formatDate(item.dietaFecha)} ·
            </span>
          )}
          {formatListaConOtros(item.dieta, item.dietaOtros) || '—'}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs text-slate-500">Tratamiento</dt>
        <dd className="mt-1">
          {item.tratamientoFecha && (
            <p className="mb-1 text-xs font-medium text-slate-500">
              Fecha: {formatDate(item.tratamientoFecha)}
            </p>
          )}
          {item.tratamiento.length || item.tratamientoOtros.trim() ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Tratamiento</th>
                    <th className="px-3 py-2 text-left font-medium">Fármaco</th>
                    <th className="px-3 py-2 text-left font-medium">Horas</th>
                    <th className="px-3 py-2 text-left font-medium">Forma</th>
                  </tr>
                </thead>
                <tbody>
                  {item.tratamiento.map((t) => (
                    <tr key={t.nombre} className="border-t border-slate-100">
                      <td className="px-3 py-2">{t.nombre}</td>
                      <td className="px-3 py-2">{t.farmaco.trim() || '—'}</td>
                      <td className="px-3 py-2">
                        {horasActivas(t.horas).join(', ') || '—'}
                      </td>
                      <td className="px-3 py-2">
                        {formaAdministracionLabel(t.forma, t.formaOtros) || '—'}
                      </td>
                    </tr>
                  ))}
                  {item.tratamientoOtros.trim() && (
                    <tr className="border-t border-slate-100">
                      <td className="px-3 py-2">Otros: {item.tratamientoOtros.trim()}</td>
                      <td className="px-3 py-2">—</td>
                      <td className="px-3 py-2">
                        {horasActivas(
                          normalizeHoras(
                            item.tratamientoOtrosHoras,
                            (item as { tratamientoOtrosHora?: string }).tratamientoOtrosHora,
                          ),
                        ).join(', ') || '—'}
                      </td>
                      <td className="px-3 py-2">
                        {formaAdministracionLabel(
                          item.tratamientoOtrosForma,
                          item.tratamientoOtrosFormaOtros,
                        ) || '—'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            '—'
          )}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs text-slate-500">Proceso</dt>
        <dd>
          {item.procesoFecha && (
            <span className="mr-2 text-xs font-medium text-slate-500">
              {formatDate(item.procesoFecha)} ·
            </span>
          )}
          {formatListaConOtros(item.proceso, item.procesoOtros) || '—'}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-slate-500">Constantes</dt>
        <dd>
          P {item.ctesP || '—'} · T {item.ctesT || '—'} · S {item.ctesS || '—'} · TA {item.ctesTa || '—'} ·
          Gluc. {item.ctesGlucemia || '—'} · Peso {item.ctesPeso || '—'}
        </dd>
      </div>
      {item.observaciones && (
        <div className="sm:col-span-2">
          <dt className="text-xs text-slate-500">Observaciones</dt>
          <dd className="mt-1 rounded-lg bg-white px-3 py-2 text-slate-700">
            (*) {formatDate(item.fecha)}/{item.turno}: {item.observaciones}
          </dd>
        </div>
      )}
      {(item.firma || item.firmaDibujo) && (
        <div className="sm:col-span-2">
          <dt className="text-xs text-slate-500">Firma</dt>
          <dd className="mt-1 space-y-2">
            {item.firma && <p className="font-medium text-slate-800">{item.firma}</p>}
            {item.firmaDibujo && (
              <div className="inline-block overflow-hidden rounded-xl border border-brand-100 bg-white p-2 shadow-sm">
                <img
                  src={item.firmaDibujo}
                  alt={`Firma de ${item.firma || 'registro'}`}
                  className="max-h-24 max-w-full object-contain"
                />
              </div>
            )}
          </dd>
        </div>
      )}
    </dl>
  )
}
