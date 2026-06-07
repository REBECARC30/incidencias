import { getSupabase, isSupabaseConfigured } from './supabase'

export type SyncTable = 'personas' | 'incidencias'

type SyncListener = () => void

type TableSync = {
  listeners: Set<SyncListener>
  channel: ReturnType<NonNullable<ReturnType<typeof getSupabase>>['channel']> | null
}

const tableSync: Record<SyncTable, TableSync> = {
  personas: { listeners: new Set(), channel: null },
  incidencias: { listeners: new Set(), channel: null },
}

const visibilityListeners = new Set<SyncListener>()
let visibilityBound = false

function notify(table: SyncTable) {
  tableSync[table].listeners.forEach((listener) => listener())
}

function ensureRealtimeChannel(table: SyncTable) {
  if (!isSupabaseConfigured()) return
  const supabase = getSupabase()
  if (!supabase) return

  const state = tableSync[table]
  if (state.channel) return

  state.channel = supabase
    .channel(`appincidencias-sync-${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      notify(table)
    })
    .subscribe()
}

function removeRealtimeChannel(table: SyncTable) {
  const supabase = getSupabase()
  if (!supabase) return

  const state = tableSync[table]
  if (state.listeners.size > 0 || !state.channel) return

  void supabase.removeChannel(state.channel)
  state.channel = null
}

function ensureVisibilityHandlers() {
  if (visibilityBound) return
  visibilityBound = true

  const refreshAll = () => {
    visibilityListeners.forEach((listener) => listener())
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') refreshAll()
  }

  window.addEventListener('focus', refreshAll)
  document.addEventListener('visibilitychange', onVisibilityChange)
}

export function subscribeStorageSync(table: SyncTable, listener: SyncListener): () => void {
  tableSync[table].listeners.add(listener)
  ensureRealtimeChannel(table)
  visibilityListeners.add(listener)
  ensureVisibilityHandlers()

  return () => {
    tableSync[table].listeners.delete(listener)
    visibilityListeners.delete(listener)
    removeRealtimeChannel(table)
  }
}
