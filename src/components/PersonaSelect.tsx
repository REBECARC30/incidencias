import type { Ala } from '../types'
import { ALAS, groupPersonasPorAla } from '../lib/habitaciones'
import { usePersonas } from '../hooks/useStorageData'
import { selectClass } from './ui'

interface PersonaSelectProps {
  value: string
  onChange: (personaId: string) => void
  emptyLabel?: string
  className?: string
  alaFilter?: Ala | ''
}

export function PersonaSelect({
  value,
  onChange,
  emptyLabel = 'Todas',
  className = selectClass,
  alaFilter = '',
}: PersonaSelectProps) {
  const { personas } = usePersonas()

  const porAla = groupPersonasPorAla(personas)
  const alas = alaFilter ? ALAS.filter((a) => a.id === alaFilter) : ALAS

  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{emptyLabel}</option>
      {alas.map(({ id, label }) => {
        const lista = porAla[id as Ala]
        if (!lista.length) return null

        return (
          <optgroup key={id} label={label}>
            {lista.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · Hab. {p.habitacion}
              </option>
            ))}
          </optgroup>
        )
      })}
    </select>
  )
}
