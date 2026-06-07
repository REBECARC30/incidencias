import { useEffect, useState, type ReactNode } from 'react'
import { initSupabase } from '../lib/supabase'

export function SupabaseBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void initSupabase().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 text-sm text-slate-600">
        Cargando…
      </div>
    )
  }

  return children
}
