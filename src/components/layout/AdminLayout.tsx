import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3, LibraryBig, LogOut } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button, Card } from '../ui'
import { useAuth } from '../../auth/useAuth'
import { PageContainer } from './Layout'

const ADMIN_LINKS = [
  { to: '/admin', labelKey: 'admin.analytics', icon: BarChart3, end: true },
  { to: '/admin/games', labelKey: 'admin.games', icon: LibraryBig, end: false },
]

/** Shell for the protected administration area. */
export function AdminLayout() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()

  return (
    <PageContainer>
      <Card className="mb-4 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-foreground">
            {t('admin.title')}
          </h1>
          {user?.email && (
            <p className="text-sm text-muted-foreground">
              {t('admin.signedInAs', { email: user.email })}
            </p>
          )}
        </div>
        <Button variant="secondary" onClick={() => void signOut()} className="w-fit">
          <LogOut size={16} aria-hidden="true" />
          {t('admin.signOut')}
        </Button>
      </Card>

      <div className="flex flex-col gap-4 lg:flex-row">
        <nav aria-label={t('admin.navLabel')} className="lg:w-56 lg:shrink-0">
          <Card className="p-2">
            <ul className="flex gap-1 lg:flex-col">
              {ADMIN_LINKS.map(({ to, labelKey, icon: Icon, end }) => (
                <li key={to} className="flex-1 lg:flex-none">
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex h-11 w-full items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-200',
                        isActive
                          ? 'bg-primary-subtle text-primary'
                          : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                      )
                    }
                  >
                    <Icon size={16} aria-hidden="true" />
                    {t(labelKey)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </Card>
        </nav>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </PageContainer>
  )
}
