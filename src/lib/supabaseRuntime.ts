export type SupabaseRuntimeConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseAuthEmail?: string
}

const BLOCKED_PROJECT_REFS = new Set(['vynreuhupgbwpymenwnk'])

function projectRefFromUrl(url: string): string | null {
  const match = url.trim().match(/^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i)
  return match?.[1] ?? null
}

function isUsableSupabaseConfig(url: string, key: string): boolean {
  if (!url || !key || url.includes('tu-proyecto') || key.includes('tu-anon')) return false
  if (/PEGA_AQUI|REPLACE|placeholder/i.test(key)) return false
  const ref = projectRefFromUrl(url)
  if (!ref || BLOCKED_PROJECT_REFS.has(ref)) return false
  return true
}

function configFromEnv(): SupabaseRuntimeConfig | null {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? ''
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? ''
  if (!isUsableSupabaseConfig(url, key)) return null
  return {
    supabaseUrl: url,
    supabaseAnonKey: key,
    supabaseAuthEmail: (import.meta.env.VITE_SUPABASE_AUTH_EMAIL as string | undefined)?.trim(),
  }
}

async function configFromFile(): Promise<SupabaseRuntimeConfig | null> {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' })
    if (!res.ok) return null
    const json = (await res.json()) as Partial<SupabaseRuntimeConfig>
    const url = json.supabaseUrl?.trim() ?? ''
    const key = json.supabaseAnonKey?.trim() ?? ''
    if (!isUsableSupabaseConfig(url, key)) return null
    return {
      supabaseUrl: url,
      supabaseAnonKey: key,
      supabaseAuthEmail: json.supabaseAuthEmail?.trim(),
    }
  } catch {
    return null
  }
}

export async function resolveSupabaseRuntimeConfig(): Promise<SupabaseRuntimeConfig | null> {
  const fromFile = await configFromFile()
  if (fromFile) return fromFile
  return configFromEnv()
}
