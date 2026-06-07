import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { resolveSupabaseRuntimeConfig, type SupabaseRuntimeConfig } from './supabaseRuntime'

let supabaseClient: SupabaseClient | null = null
let runtimeConfig: SupabaseRuntimeConfig | null = null
let initDone = false

export function isSupabaseConfigured(): boolean {
  return supabaseClient !== null
}

export function getSupabase(): SupabaseClient | null {
  return supabaseClient
}

/** Compatibilidad: ya no se usa el cliente estático de build. */
export const supabase = null as import('@supabase/supabase-js').SupabaseClient | null

export function getSupabaseAuthEmail(): string {
  return (
    runtimeConfig?.supabaseAuthEmail?.trim() ||
    (import.meta.env.VITE_SUPABASE_AUTH_EMAIL as string | undefined)?.trim() ||
    'centro@appincidencias.local'
  )
}

export async function initSupabase(): Promise<void> {
  if (initDone) return
  initDone = true

  runtimeConfig = await resolveSupabaseRuntimeConfig()
  if (!runtimeConfig) {
    supabaseClient = null
    return
  }

  supabaseClient = createClient(runtimeConfig.supabaseUrl, runtimeConfig.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}
