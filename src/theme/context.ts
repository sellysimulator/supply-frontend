import { createContext } from 'react'

/** What the reader chose. `system` follows the operating system setting. */
export type ThemePreference = 'light' | 'dark' | 'system'

/** What is actually painted once `system` has been resolved. */
export type ResolvedTheme = 'light' | 'dark'

export type ThemeState = {
  theme: ThemePreference
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemePreference) => void
  /** Switches between light and dark, leaving `system` behind. */
  toggleTheme: () => void
}

/** Where the choice is remembered. The inline script in index.html reads the
 *  same key before the first paint, so the two must stay in step. */
export const THEME_STORAGE_KEY = 'supply-theme'

export const ThemeContext = createContext<ThemeState | undefined>(undefined)
