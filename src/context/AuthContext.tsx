import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthSession } from '../types'
import { getSession, login as authLogin, logout as authLogout } from '../lib/auth'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

const SESSION_KEY = 'appincidencias_session'

interface AuthContextValue {
  session: AuthSession | null
  loading: boolean
  login: (password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function sessionFromSupabaseUser(user: {
  id: string
  user_metadata?: Record<string, unknown>
}): AuthSession {
  return {
    workerId: user.id,
    displayName:
      (user.user_metadata?.displayName as string | undefined) || 'Personal del centro',
  }
}

function persistSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSession(getSession())
      setLoading(false)
      return
    }

    const supabaseClient = getSupabase()
    if (!supabaseClient) {
      setSession(getSession())
      setLoading(false)
      return
    }

    const db: SupabaseClient = supabaseClient
    let cancelled = false

    async function initSupabaseAuth() {
      const { data, error } = await db.auth.getSession()
      if (cancelled) return

      if (error || !data.session?.user) {
        persistSession(null)
        setSession(null)
        setLoading(false)
        return
      }

      const next = sessionFromSupabaseUser(data.session.user)
      persistSession(next)
      setSession(next)
      setLoading(false)
    }

    void initSupabaseAuth()

    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event, authSession) => {
      if (cancelled) return

      if (authSession?.user) {
        const next = sessionFromSupabaseUser(authSession.user)
        persistSession(next)
        setSession(next)
      } else {
        persistSession(null)
        setSession(null)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (password: string) => {
    const next = await authLogin(password)
    setSession(next)
  }, [])

  const logout = useCallback(async () => {
    await authLogout()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({ session, loading, login, logout }),
    [session, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
