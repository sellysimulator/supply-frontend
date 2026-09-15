import { createContext } from 'react'
import type { User } from 'firebase/auth'

export type AuthState = {
  user: User | null
  /** True until the first Firebase auth state callback has fired. */
  loading: boolean
  /**
   * Whether the signed-in user has an `admins/{uid}` document. This only drives
   * what the interface offers — Firestore rules are what actually enforce it.
   */
  isAdmin: boolean
  /** True until the admin role has been resolved for the current user. */
  checkingRole: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | undefined>(undefined)
