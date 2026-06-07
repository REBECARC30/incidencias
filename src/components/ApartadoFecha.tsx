import { Field, inputClass } from './ui'

interface ApartadoFechaProps {
  value: string
  onChange: (value: string) => void
}

export function ApartadoFecha({ value, onChange }: ApartadoFechaProps) {
  return (
    <Field label="Fecha">
      <input
        type="date"
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  )
}
