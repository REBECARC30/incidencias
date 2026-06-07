import { useCallback, useEffect, useState } from 'react'
import type { Incidencia, Persona } from '../types'
import { getIncidencias, getPersonas } from '../lib/storage'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

function useRemoteSync(reload: () => void, table: 'personas' | 'incidencias') {
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const channel = supabase
      .channel(`sync-${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => reload(),
      )
      .subscribe()

    const refreshOnVisible = () => reload()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshOnVisible()
    }

    window.addEventListener('focus', refreshOnVisible)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      if (supabase) void supabase.removeChannel(channel)
      window.removeEventListener('focus', refreshOnVisible)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [reload, table])
}

export function usePersonas(refreshKey = 0) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(() => {
    setLoading(true)
    setError('')
    getPersonas()
      .then(setPersonas)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar personas'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getPersonas()
      .then((data) => {
        if (!cancelled) setPersonas(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar personas')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refreshKey, reload])

  useRemoteSync(reload, 'personas')

  return { personas, loading, error, reload }
}

export function useIncidencias(refreshKey = 0) {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(() => {
    setLoading(true)
    setError('')
    getIncidencias()
      .then(setIncidencias)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar incidencias'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getIncidencias()
      .then((data) => {
        if (!cancelled) setIncidencias(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar incidencias')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refreshKey, reload])

  useRemoteSync(reload, 'incidencias')

  return { incidencias, loading, error, reload }
}
