import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'
import { Button } from '../ui'
import { useTheme } from '../../theme/useTheme'

/**
 * Switches between the light and dark palettes. The icon shows the theme the
 * reader would move to, and the accessible name says so in words.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { resolvedTheme, toggleTheme } = useTheme()

  const goingDark = resolvedTheme === 'light'

  return (
    <Button
      variant="secondary"
      onClick={toggleTheme}
      aria-label={t(goingDark ? 'theme.toDark' : 'theme.toLight')}
      title={t(goingDark ? 'theme.toDark' : 'theme.toLight')}
      className={className ? `w-11 px-0 ${className}` : 'w-11 px-0'}
    >
      {goingDark ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
    </Button>
  )
}
