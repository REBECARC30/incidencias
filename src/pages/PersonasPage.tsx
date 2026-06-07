import { useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2, UserRound } from 'lucide-react'
import type { Ala, Persona } from '../types'
import { ALAS, formatUbicacion, groupPersonasPorAla } from '../lib/habitaciones'
import { deletePersona, savePersona } from '../lib/storage'
import { usePersonas } from '../hooks/useStorageData'
import { Button, Card, EmptyState, Field, PageHeader, SectionTitle, inputClass, selectClass } from '../components/ui'

type FormData = {
  id?: string
  codigo: string
  ala: Ala
  habitacion: string
}

const emptyForm = (): FormData => ({ codigo: '', ala: '1', habitacion: '' })

function PersonasAlaTable({
  personas,
  onEdit,
  onDelete,
}: {
  personas: Persona[]
  onEdit: (p: Persona) => void
  onDelete: (id: string, codigo: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-gradient-to-r from-brand-50/80 to-brand-100/30 text-xs uppercase tracking-widest text-brand-600">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Hab.</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {personas.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-brand-50/50">
                <td className="px-4 py-3 font-medium text-brand-800">
                  <span className="inline-flex items-center gap-2">
                    <UserRound size={14} className="text-slate-400" />
                    {p.codigo}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.habitacion}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(p)}>
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(p.id, p.codigo)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function PersonasPage() {
  const [refresh, setRefresh] = useState(0)
  const { personas, loading, error: loadError } = usePersonas(refresh)
  const porAla = useMemo(() => groupPersonasPorAla(personas), [personas])
  const [form, setForm] = useState<FormData>(emptyForm)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)

  function reload() {
    setRefresh((n) => n + 1)
  }

  function startEdit(p: Persona) {
    setForm({
      id: p.id,
      codigo: p.codigo,
      ala: p.ala,
      habitacion: p.habitacion,
    })
    setEditing(true)
    setError('')
  }

  function cancelEdit() {
    setForm(emptyForm())
    setEditing(false)
    setError('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    void savePersona(form)
      .then(() => {
        cancelEdit()
        reload()
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      })
  }

  function handleDelete(id: string, codigo: string) {
    if (!confirm(`¿Eliminar a ${codigo}? No se borran incidencias ya registradas.`)) return
    void deletePersona(id).then(reload)
  }

  if (loading && !personas.length) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-slate-500">
        Cargando personas…
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Personas atendidas"
        subtitle="Organizadas por Ala 1 y Ala 2 · solo código (sin nombre del paciente)"
      />

      {loadError && (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 animate-fade-up shadow-[var(--shadow-float)]">
          <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              {editing ? <Pencil size={16} /> : <Plus size={16} />}
            </span>
            {editing ? 'Editar persona' : 'Nueva persona'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Código" required hint="Identificador anónimo (ej. P006). No uses el nombre del paciente.">
              <input
                className={inputClass}
                value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                required
                disabled={editing}
              />
            </Field>
            <Field label="Ala" required>
              <select
                className={selectClass}
                value={form.ala}
                onChange={(e) => setForm((f) => ({ ...f, ala: e.target.value as Ala }))}
                required
              >
                {ALAS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Habitación" required hint="Número o identificador de la habitación">
              <input
                className={inputClass}
                value={form.habitacion}
                onChange={(e) => setForm((f) => ({ ...f, habitacion: e.target.value }))}
                required
              />
            </Field>

            {form.habitacion && (
              <p className="rounded-xl border border-brand-100/60 bg-gradient-to-r from-brand-50/80 to-brand-100/30 px-3.5 py-2.5 text-sm font-medium text-brand-800/80">
                Ubicación: {formatUbicacion(form.ala, form.habitacion)}
              </p>
            )}

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="submit">{editing ? 'Guardar cambios' : 'Añadir persona'}</Button>
              {editing && (
                <Button type="button" variant="secondary" onClick={cancelEdit}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          {!personas.length ? (
            <EmptyState
              title="Sin personas registradas"
              description="Añade la primera persona con su código, ala y habitación (sin nombre)."
            />
          ) : (
            ALAS.map(({ id, label }) => {
              const lista = porAla[id]
              if (!lista.length) return null

              return (
                <section key={id} className="animate-fade-up">
                  <SectionTitle>
                    {label}
                    <span className="ml-2 font-normal normal-case tracking-normal text-slate-400">
                      ({lista.length} persona{lista.length === 1 ? '' : 's'})
                    </span>
                  </SectionTitle>
                  <PersonasAlaTable personas={lista} onEdit={startEdit} onDelete={handleDelete} />
                </section>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
