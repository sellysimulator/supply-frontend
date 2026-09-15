import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'

export type AuthState = {
  user: User | null
  /** True until the stored session has been restored. */
  loading: boolean
  /**
   * Whether the signed-in account has a row in `admins`. This only decides what
   * the interface offers — the row level security policies are what enforce it.
   */
  isAdmin: boolean
  /** True until the administrator role has been resolved for the current user. */
  checkingRole: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | undefined>(undefined)
