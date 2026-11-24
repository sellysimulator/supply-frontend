import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'
import { isAdministrator } from '../data/admins'
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
  const [role, setRole] = useState<{
    userId: string
    isAdmin: boolean
    failed: boolean
  } | null>(null)
  const [roleAttempt, setRoleAttempt] = useState(0)

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

    // A failed lookup is kept apart from "not an administrator", so a network
    // error offers a retry instead of telling a real administrator otherwise.
    isAdministrator(userId).then(
      (isAdmin) => {
        if (!cancelled) setRole({ userId, isAdmin, failed: false })
      },
      () => {
        if (!cancelled) setRole({ userId, isAdmin: false, failed: true })
      },
    )

    return () => {
      cancelled = true
    }
    // Depends on the id rather than `user` itself: `getSession()` and every
    // `onAuthStateChange` event — including the hourly `TOKEN_REFRESHED` — hand
    // back a new `User` object for the same signed-in account, and re-running
    // this effect on each one would re-query `admins` for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, roleAttempt])

  const isAdmin = user !== null && role?.userId === user.id && role.isAdmin
  const checkingRole = user !== null && role?.userId !== user.id
  const roleCheckFailed = user !== null && role?.userId === user.id && role.failed

  const retryRoleCheck = useCallback(() => {
    setRole(null)
    setRoleAttempt((attempt) => attempt + 1)
  }, [])

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
    () => ({
      user,
      loading,
      isAdmin,
      checkingRole,
      roleCheckFailed,
      retryRoleCheck,
      signIn,
      signOut,
    }),
    [user, loading, isAdmin, checkingRole, roleCheckFailed, retryRoleCheck, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
