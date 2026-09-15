import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase/app'
import { AuthContext, type AuthState } from './context'

/**
 * Tracks the signed-in Google account and whether it is an administrator.
 *
 * Visitors never sign in — browsing the catalog and launching a game are fully
 * anonymous. This provider exists only for the administration area.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  /* The resolved role is stored together with the uid it belongs to, so
     "still checking" is derived during render rather than toggled from inside
     the effect — which would start a second render on every sign-in. */
  const [role, setRole] = useState<{ uid: string; isAdmin: boolean } | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const uid = user?.uid
    if (!uid) return

    let cancelled = false

    // The rules allow a user to read only their own role document, so a
    // permission error here simply means "not an administrator".
    getDoc(doc(db, 'admins', uid))
      .then((snapshot) => {
        if (!cancelled) setRole({ uid, isAdmin: snapshot.exists() })
      })
      .catch(() => {
        if (!cancelled) setRole({ uid, isAdmin: false })
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const isAdmin = user !== null && role?.uid === user.uid && role.isAdmin
  const checkingRole = user !== null && role?.uid !== user.uid

  const signIn = useCallback(async () => {
    await signInWithPopup(auth, googleProvider)
  }, [])

  const signOut = useCallback(async () => {
    setRole(null)
    await firebaseSignOut(auth)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ user, loading, isAdmin, checkingRole, signIn, signOut }),
    [user, loading, isAdmin, checkingRole, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
