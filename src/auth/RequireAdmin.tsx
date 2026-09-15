import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LoadingSection } from '../components/ui'
import { useAuth } from './useAuth'

/**
 * Keeps the administration area out of the interface for everyone who is not an
 * administrator. This is a convenience, not a security boundary: the row level
 * security policies reject the underlying reads and writes regardless of what
 * renders.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { user, loading, isAdmin, checkingRole } = useAuth()
  const location = useLocation()

  if (loading || checkingRole) {
    return <LoadingSection label={t('signIn.checking')} />
  }

  if (!user || !isAdmin) {
    return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
