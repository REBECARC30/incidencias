import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { Incidencia, Turno } from '../types'
import {
  TURNOS,
  todayISO,
} from '../lib/constants'
import { formatUbicacion } from '../lib/habitaciones'
import { formatTratamientos, emptyHoras } from '../lib/tratamientos'
import { GLOSARIO_DIETAS, GLOSARIO_PROCESOS } from '../lib/glosarioDietasTratamientos'
import { createIncidencia } from '../lib/storage'
import { usePersonas } from '../hooks/useStorageData'
import { EstadosSelector } from '../components/EstadosSelector'
import { GlosarioSelector } from '../components/GlosarioSelector'
import { PersonaSelect } from '../components/PersonaSelect'
import { TratamientosEditor } from '../components/TratamientosEditor'
import { PrioridadTags } from '../components/PrioridadTags'
import { FirmaDibujoPad } from '../components/FirmaDibujoPad'
import { ApartadoPeriodo } from '../components/ApartadoPeriodo'
import { AreasSelector } from '../components/AreasSelector'
import { Button, Callout, Card, Field, PageHeader, WizardSteps, inputClass, selectClass } from '../components/ui'

const STEPS = [
  'Persona y turno',
  'Estado e incidencia',
  'Caídas y hospital',
  'Tratamiento',
  'Constantes y cierre',
] as const

type FormState = Omit<Incidencia, 'id' | 'createdAt' | 'createdBy'>

const initialForm = (): FormState => ({
  personaId: '',
  fecha: todayISO(),
  turno: 'M',
  de: ['A.D'],
  a: ['A.S'],
  estado: [],
  estadoOtros: '',
  incidencia: '',
  prioridad: '',
  lesiones: '',
  caidaNaf: false,
  caidaAf: false,
  hospitalTras: false,
  hospitalRegr: false,
  dieta: [],
  dietaOtros: '',
  dietaDesde: '',
  dietaHasta: '',
  tratamiento: [],
  tratamientoOtros: '',
  tratamientoDesde: '',
  tratamientoHasta: '',
  tratamientoOtrosHoras: emptyHoras(),
  tratamientoOtrosForma: '',
  tratamientoOtrosFormaOtros: '',
  proceso: [],
  procesoOtros: '',
  procesoDesde: '',
  procesoHasta: '',
  ctesP: '',
  ctesT: '',
  ctesS: '',
  ctesTa: '',
  ctesGlucemia: '',
  ctesPeso: '',
  observaciones: '',
  firma: '',
  firmaDibujo: '',
})

function getCamposVacios(form: FormState): string[] {
  const vacios: string[] = []
  if (!form.personaId) vacios.push('Persona')
  if (!form.fecha) vacios.push('Fecha')
  if (!form.estado.length && !form.estadoOtros.trim()) vacios.push('Estado')
  if (!form.incidencia.trim()) vacios.push('Incidencia')
  if (!form.lesiones.trim()) vacios.push('Lesiones')
  if (!form.dieta.length && !form.dietaOtros.trim()) vacios.push('Dieta')
  if (!form.tratamiento.length && !form.tratamientoOtros.trim()) vacios.push('Tratamiento')
  if (!form.proceso.length && !form.procesoOtros.trim()) vacios.push('Proceso')
  if (!form.ctesP.trim()) vacios.push('Pulso')
  if (!form.ctesT.trim()) vacios.push('Temperatura')
  if (!form.ctesS.trim()) vacios.push('Saturación')
  if (!form.ctesTa.trim()) vacios.push('Tensión')
  if (!form.ctesGlucemia.trim()) vacios.push('Glucemia')
  if (!form.ctesPeso.trim()) vacios.push('Peso')
  if (!form.observaciones.trim()) vacios.push('Observaciones')
  if (!form.firma.trim()) vacios.push('Firma')
  return vacios
}

function confirmarSiHayVacios(form: FormState): boolean {
  const vacios = getCamposVacios(form)
  if (!vacios.length) return true
  return window.confirm(
    `No has indicado: ${vacios.join(', ')}.\n\n¿Estás seguro de registrar la incidencia igualmente?`,
  )
}

function Checkbox({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3.5 transition-all duration-200 hover:border-brand-300 hover:bg-brand-50/50 hover:shadow-sm">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  )
}

export function NuevaIncidenciaPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { personas } = usePersonas()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialForm)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const selectedPersona = personas.find((p) => p.id === form.personaId)

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function patchTratamiento(
    value:
      | FormState['tratamiento']
      | ((prev: FormState['tratamiento']) => FormState['tratamiento']),
  ) {
    setForm((prev) => ({
      ...prev,
      tratamiento: typeof value === 'function' ? value(prev.tratamiento) : value,
    }))
  }

  function blurActiveField() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  function next() {
    blurActiveField()
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function prev() {
    blurActiveField()
    setStep((s) => Math.max(s - 1, 0))
  }

  function submit() {
    if (!session || saving) return
    blurActiveField()
    if (!confirmarSiHayVacios(form)) return

    setSaving(true)
    setSaveError('')
    void createIncidencia({
      ...form,
      incidencia: form.incidencia.trim(),
      lesiones: form.lesiones.trim(),
      estadoOtros: form.estadoOtros.trim(),
      dieta: form.dieta,
      dietaOtros: form.dietaOtros.trim(),
      tratamiento: form.tratamiento,
      tratamientoOtros: form.tratamientoOtros.trim(),
      tratamientoOtrosHoras: form.tratamientoOtrosHoras,
      tratamientoOtrosForma: form.tratamientoOtrosForma,
      tratamientoOtrosFormaOtros: form.tratamientoOtrosFormaOtros.trim(),
      proceso: form.proceso,
      procesoOtros: form.procesoOtros.trim(),
      firma: form.firma.trim(),
      firmaDibujo: form.firmaDibujo,
      createdBy: session.workerId,
    })
      .then(() => setSuccess(true))
      .catch((err) => {
        setSaveError(err instanceof Error ? err.message : 'Error al guardar la incidencia')
      })
      .finally(() => setSaving(false))
  }

  function irAListadoTratamientos() {
    const conTratamiento =
      form.tratamiento.length > 0 || form.tratamientoOtros.trim().length > 0
    navigate(conTratamiento ? '/listado?tipo=tratamientos' : '/listado')
  }

  function reset() {
    setForm(initialForm())
    setStep(0)
    setSuccess(false)
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg animate-scale-in">
        <Card className="text-center shadow-[var(--shadow-float)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-700/30">
            <Check size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Incidencia registrada</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            El registro es permanente y no se puede modificar.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={reset}>Registrar otra</Button>
            <Button variant="secondary" onClick={irAListadoTratamientos}>
              Ver listado
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Nueva incidencia"
        subtitle="Formulario por pasos según el protocolo del centro"
      />

      <WizardSteps steps={STEPS} current={step} />

      <Card className="max-w-2xl animate-fade-up">
        <div className={step === 0 ? 'space-y-4' : 'hidden'}>
            <Field label="Persona atendida (código)">
              <PersonaSelect
                value={form.personaId}
                onChange={(v) => patch('personaId', v)}
                emptyLabel="— Seleccionar —"
              />
            </Field>

            {selectedPersona && (
              <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-50 to-brand-100/50 px-4 py-3.5 text-sm shadow-sm">
                <span className="font-bold text-brand-900">{selectedPersona.codigo}</span>
                <span className="font-medium text-brand-700/80">
                  {' '}
                  · {formatUbicacion(selectedPersona.ala, selectedPersona.habitacion)}
                </span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fecha">
                <input
                  type="date"
                  className={inputClass}
                  value={form.fecha}
                  onChange={(e) => patch('fecha', e.target.value)}
                />
              </Field>
              <Field label="Turno">
                <select
                  className={selectClass}
                  value={form.turno}
                  onChange={(e) => patch('turno', e.target.value as Turno)}
                >
                  {TURNOS.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.code} — {t.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="DE (origen)" hint="Puedes marcar varias áreas">
                <AreasSelector value={form.de} onChange={(de) => patch('de', de)} />
              </Field>
              <Field label="A (destino)" hint="Puedes marcar varias áreas">
                <AreasSelector value={form.a} onChange={(a) => patch('a', a)} />
              </Field>
            </div>
        </div>

        <div className={step === 1 ? 'space-y-4' : 'hidden'}>
            <Field
              label="Estado"
              hint="Puedes marcar varios, incluso de la misma categoría"
            >
              <EstadosSelector
                value={form.estado}
                onChange={(estado) => patch('estado', estado)}
                otro={form.estadoOtros}
                onOtroChange={(v) => patch('estadoOtros', v)}
              />
            </Field>
            <Field
              label="Incidencia"
              hint="Describe la acción, situación o evento anormal"
            >
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                value={form.incidencia}
                onChange={(e) => patch('incidencia', e.target.value)}
                placeholder="Escribe aquí la incidencia…"
              />
            </Field>
            <PrioridadTags
              value={form.prioridad}
              onChange={(prioridad) => patch('prioridad', prioridad)}
            />
            <Field label="Lesiones" hint="Cambio anormal en morfología, estructura o función">
              <textarea
                className={`${inputClass} min-h-20 resize-y`}
                value={form.lesiones}
                onChange={(e) => patch('lesiones', e.target.value)}
                placeholder="Describe las lesiones si las hay…"
              />
            </Field>
        </div>

        <div className={step === 2 ? 'space-y-4' : 'hidden'}>
            <p className="text-sm text-slate-600">Caídas — marcar con X según protocolo</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Checkbox
                label="N.A.F — Familia no avisada"
                checked={form.caidaNaf}
                onChange={(v) => {
                  patch('caidaNaf', v)
                  if (v) patch('caidaAf', false)
                }}
              />
              <Checkbox
                label="A.F — Familia avisada"
                checked={form.caidaAf}
                onChange={(v) => {
                  patch('caidaAf', v)
                  if (v) patch('caidaNaf', false)
                }}
                hint="Asegurar que la familia queda informada"
              />
            </div>

            <p className="pt-2 text-sm text-slate-600">Hospital</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Checkbox
                label="TRAS — Traslado a hospital"
                checked={form.hospitalTras}
                onChange={(v) => patch('hospitalTras', v)}
              />
              <Checkbox
                label="REGR — Regreso de hospital"
                checked={form.hospitalRegr}
                onChange={(v) => patch('hospitalRegr', v)}
              />
            </div>
        </div>

        <div className={step === 3 ? 'space-y-4' : 'hidden'}>
            <Field label="Dieta" hint="Selecciona del listado. Puedes marcar varias.">
              <div className="space-y-3">
                <ApartadoPeriodo
                  desde={form.dietaDesde}
                  hasta={form.dietaHasta}
                  onDesdeChange={(v) => patch('dietaDesde', v)}
                  onHastaChange={(v) => patch('dietaHasta', v)}
                />
                <GlosarioSelector
                  grupos={GLOSARIO_DIETAS}
                  value={form.dieta}
                  onChange={(dieta) => patch('dieta', dieta)}
                  searchId="dieta-search"
                  emptyLabel="Ninguna dieta seleccionada."
                  selectedLabel="Dietas"
                  otro={form.dietaOtros}
                  onOtroChange={(v) => patch('dietaOtros', v)}
                />
              </div>
            </Field>

            <Field
              label="Tratamiento"
              hint="Indica hora y forma de administración de cada uno."
            >
              <div className="space-y-3">
                <ApartadoPeriodo
                  desde={form.tratamientoDesde}
                  hasta={form.tratamientoHasta}
                  onDesdeChange={(v) => patch('tratamientoDesde', v)}
                  onHastaChange={(v) => patch('tratamientoHasta', v)}
                />
                <TratamientosEditor
                  value={form.tratamiento}
                  onChange={patchTratamiento}
                  otro={form.tratamientoOtros}
                  onOtroChange={(v) => patch('tratamientoOtros', v)}
                  otroHoras={form.tratamientoOtrosHoras}
                  onOtroHorasChange={(v) => patch('tratamientoOtrosHoras', v)}
                  otroForma={form.tratamientoOtrosForma}
                  onOtroFormaChange={(v) => patch('tratamientoOtrosForma', v)}
                  otroFormaOtros={form.tratamientoOtrosFormaOtros}
                  onOtroFormaOtrosChange={(v) => patch('tratamientoOtrosFormaOtros', v)}
                />
              </div>
            </Field>

            <Field label="Proceso" hint="Controles, muestras y actuaciones del plan de cuidados.">
              <div className="space-y-3">
                <ApartadoPeriodo
                  desde={form.procesoDesde}
                  hasta={form.procesoHasta}
                  onDesdeChange={(v) => patch('procesoDesde', v)}
                  onHastaChange={(v) => patch('procesoHasta', v)}
                />
                <GlosarioSelector
                  grupos={GLOSARIO_PROCESOS}
                  value={form.proceso}
                  onChange={(proceso) => patch('proceso', proceso)}
                  searchId="proceso-search"
                  emptyLabel="Ningún proceso seleccionado."
                  selectedLabel="Procesos"
                  otro={form.procesoOtros}
                  onOtroChange={(v) => patch('procesoOtros', v)}
                />
              </div>
            </Field>
        </div>

        <div className={step === 4 ? 'space-y-4' : 'hidden'}>
          {(form.tratamiento.length > 0 || form.tratamientoOtros.trim()) && (
            <div className="rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-3 text-sm text-brand-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">
                Tratamientos registrados en este paso
              </p>
              <p className="mt-1">
                {formatTratamientos(
                  form.tratamiento,
                  form.tratamientoOtros,
                  form.tratamientoOtrosHoras,
                  form.tratamientoOtrosForma,
                  form.tratamientoOtrosFormaOtros,
                ) || '—'}
              </p>
            </div>
          )}
            <p className="text-sm font-medium text-slate-700">Constantes (CTES.)</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(
                [
                  ['ctesP', 'P — Pulso'],
                  ['ctesT', 'T — Temperatura'],
                  ['ctesS', 'S — Saturación'],
                  ['ctesTa', 'TA — Tensión'],
                  ['ctesGlucemia', 'Glucemia'],
                  ['ctesPeso', 'Peso'],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    className={inputClass}
                    value={form[key]}
                    onChange={(e) => patch(key, e.target.value)}
                  />
                </Field>
              ))}
            </div>

            <Field
              label="Observaciones (*)"
              hint="Detalle que no cabe en otros campos. Se exportará con prefijo (*) fecha/turno."
            >
              <textarea
                className={`${inputClass} min-h-28 resize-y`}
                value={form.observaciones}
                onChange={(e) => patch('observaciones', e.target.value)}
                placeholder="Lenguaje claro, preciso y respetuoso…"
              />
            </Field>

            <Field label="Firma" hint="Nombre de quien registra">
              <input
                className={inputClass}
                value={form.firma}
                onChange={(e) => patch('firma', e.target.value)}
                placeholder="Nombre"
              />
            </Field>

            <Field label="Firma manuscrita" hint="Opcional · dibuja debajo del nombre">
              <FirmaDibujoPad
                value={form.firmaDibujo}
                onChange={(dataUrl) => patch('firmaDibujo', dataUrl)}
              />
            </Field>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
          {saveError && (
            <p className="mb-2 w-full rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </p>
          )}
          {step > 0 && (
            <Button variant="secondary" onClick={prev}>
              <ChevronLeft size={16} />
              Anterior
            </Button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>
              Siguiente
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button onClick={submit} disabled={saving}>
              {saving ? 'Guardando…' : 'Registrar incidencia'}
            </Button>
          )}
        </div>
      </Card>

      <Callout title="Recordatorio" tone="warn" className="mt-5 max-w-2xl">
        Ningún campo es obligatorio. Al registrar, la app te avisará si falta algo. Escribe con
        claridad y sin juicios de valor. No incluyas el nombre del paciente en ningún campo de
        texto (incidencia, observaciones, lesiones, etc.): identifica solo con el código.
      </Callout>
    </div>
  )
}
