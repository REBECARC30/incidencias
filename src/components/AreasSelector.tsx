import type { AreaCode } from '../types'
import { AREAS } from '../lib/constants'

interface AreasSelectorProps {
  value: AreaCode[]
  onChange: (value: AreaCode[]) => void
}

export function AreasSelector({ value, onChange }: AreasSelectorProps) {
  function toggle(code: AreaCode) {
    if (value.includes(code)) {
      onChange(value.filter((v) => v !== code))
    } else {
      onChange([...value, code])
    }
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {AREAS.map((area) => {
        const checked = value.includes(area.code)
        return (
          <label
            key={area.code}
            className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${
              checked
                ? 'border-brand-400 bg-white shadow-sm ring-1 ring-brand-200'
                : 'border-slate-200 bg-white hover:border-brand-200'
            }`}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
              checked={checked}
              onChange={() => toggle(area.code)}
            />
            <span>
              <span className="font-medium text-slate-800">{area.code}</span>
              <span className="mt-0.5 block text-xs leading-snug text-slate-500">{area.label}</span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
