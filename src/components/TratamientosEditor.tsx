import { useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { GLOSARIO_TRATAMIENTOS } from '../lib/glosarioDietasTratamientos'
import type { FormaAdministracion, TratamientoRegistro } from '../types'
import {
  FORMAS_ADMINISTRACION,
  MAX_TRATAMIENTO_HORAS,
  syncTratamientos,
} from '../lib/tratamientos'
import { GlosarioSelector } from './GlosarioSelector'
import { OtrosField } from './OtrosField'
import { Button, inputClass, selectClass } from './ui'

interface TratamientosEditorProps {
  value: TratamientoRegistro[]
  onChange: (
    value:
      | TratamientoRegistro[]
      | ((prev: TratamientoRegistro[]) => TratamientoRegistro[]),
  ) => void
  otro: string
  onOtroChange: (value: string) => void
  otroHoras: string[]
  onOtroHorasChange: (value: string[]) => void
  otroForma: FormaAdministracion
  onOtroFormaChange: (value: FormaAdministracion) => void
  otroFormaOtros: string
  onOtroFormaOtrosChange: (value: string) => void
}

function HorasInputs({
  horas,
  onChange,
}: {
  horas: string[]
  onChange: (horas: string[]) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: MAX_TRATAMIENTO_HORAS }, (_, index) => (
        <input
          key={index}
          type="time"
          className={inputClass}
          value={horas[index] ?? ''}
          aria-label={`Hora ${index + 1}`}
          onChange={(e) => {
            const next = [...horas]
            next[index] = e.target.value
            onChange(next)
          }}
        />
      ))}
    </div>
  )
}

function RegistroFila({
  titulo,
  farmaco,
  horas,
  forma,
  formaOtros,
  onPatch,
}: {
  titulo: string
  farmaco: string
  horas: string[]
  forma: FormaAdministracion
  formaOtros: string
  onPatch: (patch: Partial<Pick<TratamientoRegistro, 'farmaco' | 'horas' | 'forma' | 'formaOtros'>>) => void
}) {
  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-3 py-2.5">
        <p className="text-sm font-medium text-slate-800">{titulo}</p>
      </td>
      <td className="px-3 py-2.5">
        <input
          className={inputClass}
          value={farmaco}
          placeholder="Tipo de fármaco…"
          onChange={(e) => onPatch({ farmaco: e.target.value })}
        />
      </td>
      <td className="px-3 py-2.5">
        <HorasInputs horas={horas} onChange={(next) => onPatch({ horas: next })} />
      </td>
      <td className="px-3 py-2.5">
        <select
          className={selectClass}
          value={forma}
          onChange={(e) => {
            const next = e.target.value as FormaAdministracion
            onPatch({
              forma: next,
              formaOtros: next === 'otra' ? formaOtros : '',
            })
          }}
        >
          <option value="">— Forma —</option>
          {FORMAS_ADMINISTRACION.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        {forma === 'otra' && (
          <input
            className={`${inputClass} mt-2`}
            placeholder="Especificar forma…"
            value={formaOtros}
            onChange={(e) => onPatch({ formaOtros: e.target.value })}
          />
        )}
      </td>
    </tr>
  )
}

function TablaAdministracion({
  titulo,
  onListo,
  children,
}: {
  titulo: string
  onListo: () => void
  children: ReactNode
}) {
  const [guardado, setGuardado] = useState(false)

  function listo() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    onListo()
    setGuardado(true)
    window.setTimeout(() => setGuardado(false), 2500)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[var(--shadow-card)]">
      <p className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-brand-50/30 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-500">
        {titulo}
        {guardado && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 normal-case font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <Check size={12} />
            Guardado
          </span>
        )}
      </p>
      {children}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={listo}
        >
          Listo — guardar
        </Button>
      </div>
    </div>
  )
}

function sameSelection(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const setB = new Set(b)
  return a.every((n) => setB.has(n))
}

export function TratamientosEditor({
  value,
  onChange,
  otro,
  onOtroChange,
  otroHoras,
  onOtroHorasChange,
  otroForma,
  onOtroFormaChange,
  otroFormaOtros,
  onOtroFormaOtrosChange,
}: TratamientosEditorProps) {
  const nombres = value.map((r) => r.nombre)

  function applyChange(
    next:
      | TratamientoRegistro[]
      | ((prev: TratamientoRegistro[]) => TratamientoRegistro[]),
  ) {
    onChange(next)
  }

  function patchRegistro(index: number, patch: Partial<TratamientoRegistro>) {
    applyChange((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  return (
    <div className="space-y-4">
      <GlosarioSelector
        grupos={GLOSARIO_TRATAMIENTOS}
        value={nombres}
        onChange={(selected) =>
          applyChange((prev) => {
            const actuales = prev.map((r) => r.nombre)
            if (sameSelection(selected, actuales)) return prev
            return syncTratamientos(selected, prev)
          })
        }
        searchId="tratamiento-search"
        emptyLabel="Ningún tratamiento seleccionado."
        selectedLabel="Tratamientos"
      />

      {value.length > 0 && (
        <TablaAdministracion titulo="Hora y forma de administración" onListo={() => {}}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Tratamiento</th>
                  <th className="px-3 py-2 font-medium min-w-[160px]">Fármaco</th>
                  <th className="px-3 py-2 font-medium min-w-[220px]">Horas (hasta 4)</th>
                  <th className="px-3 py-2 font-medium">Forma</th>
                </tr>
              </thead>
              <tbody>
                {value.map((registro, index) => (
                  <RegistroFila
                    key={registro.nombre}
                    titulo={registro.nombre}
                    farmaco={registro.farmaco}
                    horas={registro.horas}
                    forma={registro.forma}
                    formaOtros={registro.formaOtros}
                    onPatch={(patch) => patchRegistro(index, patch)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </TablaAdministracion>
      )}

      <OtrosField value={otro} onChange={onOtroChange} />

      {otro.trim() && (
        <TablaAdministracion titulo="Hora y forma — Otros" onListo={() => {}}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Tratamiento</th>
                  <th className="px-3 py-2 font-medium min-w-[220px]">Horas (hasta 4)</th>
                  <th className="px-3 py-2 font-medium">Forma</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2.5 text-sm font-medium text-slate-800">{otro.trim()}</td>
                  <td className="px-3 py-2.5">
                    <HorasInputs horas={otroHoras} onChange={onOtroHorasChange} />
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      className={selectClass}
                      value={otroForma}
                      onChange={(e) => {
                        const next = e.target.value as FormaAdministracion
                        onOtroFormaChange(next)
                        if (next !== 'otra') onOtroFormaOtrosChange('')
                      }}
                    >
                      <option value="">— Forma —</option>
                      {FORMAS_ADMINISTRACION.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                    {otroForma === 'otra' && (
                      <input
                        className={`${inputClass} mt-2`}
                        placeholder="Especificar forma…"
                        value={otroFormaOtros}
                        onChange={(e) => onOtroFormaOtrosChange(e.target.value)}
                      />
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </TablaAdministracion>
      )}
    </div>
  )
}
