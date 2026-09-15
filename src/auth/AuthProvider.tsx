import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'
import { AuthContext, type AuthState } from './context'

/**
 * Tracks the signed-in Google account and whether it is an administrator.
 *
 * Visitors never sign in — browsing the catalog and launching a game are fully
 * anonymous. This exists only for the administration area.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  /* The resolved role is stored together with the id it belongs to, so "still
     checking" is derived during render rather than toggled from inside the
     effect, which would start a second render on every sign-in. */
  const [role, setRole] = useState<{ userId: string; isAdmin: boolean } | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const userId = user?.id
    if (!userId) return

    let cancelled = false

    // A user may read only their own row, so an empty result means "not an
    // administrator" rather than an error worth surfacing.
    supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setRole({ userId, isAdmin: data !== null })
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const isAdmin = user !== null && role?.userId === user.id && role.isAdmin
  const checkingRole = user !== null && role?.userId !== user.id

  const signIn = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/sign-in` },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    setRole(null)
    await supabase.auth.signOut()
  }, [])

  const value = useMemo<AuthState>(
    () => ({ user, loading, isAdmin, checkingRole, signIn, signOut }),
    [user, loading, isAdmin, checkingRole, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
