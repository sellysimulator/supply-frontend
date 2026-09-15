import { useContext } from 'react'
import { ThemeContext, type ThemeState } from './context'

export function useTheme(): ThemeState {
  const value = useContext(ThemeContext)
  if (!value) {
    throw new Error('useTheme must be used inside <ThemeProvider>')
  }
  return value
}
