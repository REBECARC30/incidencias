import type { AuthSession } from '../types'
import { getSupabase, getSupabaseAuthEmail, isSupabaseConfigured } from './supabase'

const SESSION_KEY = 'appincidencias_session'
const PLACEHOLDER_PASSWORD = 'tu-contraseña-segura'

function getAppPassword(): string {
  const password = import.meta.env.VITE_APP_PASSWORD?.trim()
  if (!password || password === PLACEHOLDER_PASSWORD) return ''
  return password
}

export function isLocalAuthConfigured(): boolean {
  return getAppPassword().length > 0
}

const CENTRO_SESSION: AuthSession = {
  workerId: 'centro',
  displayName: 'Personal del centro',
}

export async function login(password: string): Promise<AuthSession> {
  const pass = password

  if (isSupabaseConfigured()) {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase no disponible')
    const email = getSupabaseAuthEmail()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (!error && data.user) {
      const session: AuthSession = {
        workerId: data.user.id,
        displayName:
          (data.user.user_metadata?.displayName as string) || CENTRO_SESSION.displayName,
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      return session
    }
  }

  const expected = getAppPassword()
  if (!expected) {
    throw new Error('La aplicación no está configurada. Contacta con el administrador.')
  }
  if (pass !== expected) {
    throw new Error('Contraseña incorrecta')
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(CENTRO_SESSION))
  return CENTRO_SESSION
}

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export async function logout(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()
    if (supabase) await supabase.auth.signOut()
  }
  localStorage.removeItem(SESSION_KEY)
}

export function isUsingLocalMode(): boolean {
  return !isSupabaseConfigured()
}
