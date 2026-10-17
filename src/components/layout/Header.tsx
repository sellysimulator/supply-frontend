import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useAuth } from '../../auth/useAuth'
import { ButtonLink } from '../ui'
import { LanguageToggle } from './LanguageToggle'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

const LINKS = [
  { to: '/', labelKey: 'nav.home', end: true },
  { to: '/catalog', labelKey: 'nav.catalog', end: false },
  { to: '/about', labelKey: 'nav.about', end: false },
]

function linkClasses(isActive: boolean) {
  return cn(
    'inline-flex h-11 items-center rounded-full px-4 text-sm font-medium transition-colors duration-200',
    isActive
      ? 'bg-primary-subtle text-primary'
      : 'text-muted-foreground hover:bg-surface hover:text-foreground',
  )
}

/**
 * The header is a tile too: a rounded pill bar floating on the canvas, translucent
 * with a slight blur so the board scrolls under it rather than behind a solid band.
 */
export function Header() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = isAdmin ? [...LINKS, { to: '/admin', labelKey: 'nav.admin', end: false }] : LINKS

  /* The catalog page already leads with this action, and two identical calls to
     action above the fold help nobody. */
  const showBrowse = pathname !== '/catalog'

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 sm:px-6 sm:pt-4 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card/80 p-2 shadow-tile backdrop-blur-md">
          <Link to="/" className="rounded-full pl-1" aria-label={t('nav.homeAria')}>
            <Logo />
          </Link>

          <nav aria-label={t('nav.main')} className="ml-auto hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => linkClasses(isActive)}
              >
                {t(link.labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <div className="hidden items-center gap-2 md:flex">
              <LanguageToggle />
              <ThemeToggle />
              {showBrowse && (
                <ButtonLink to="/catalog" shape="pill" className="ml-1">
                  {t('nav.browse')}
                </ButtonLink>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={t(menuOpen ? 'nav.closeMenu' : 'nav.openMenu')}
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border text-foreground transition-colors duration-200 hover:bg-surface md:hidden"
            >
              {menuOpen ? (
                <X size={18} aria-hidden="true" />
              ) : (
                <Menu size={18} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            id="mobile-nav"
            aria-label={t('nav.main')}
            className="mt-2 rounded-lg border border-border bg-card p-3 shadow-tile md:hidden"
          >
            <ul className="flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) => cn(linkClasses(isActive), 'w-full')}
                  >
                    {t(link.labelKey)}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
