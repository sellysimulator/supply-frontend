import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useAuth } from '../../auth/useAuth'
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
    'inline-flex h-11 items-center rounded-md px-3 text-sm font-medium transition-colors duration-200',
    isActive
      ? 'bg-primary-subtle text-primary'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  )
}

export function Header() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = isAdmin ? [...LINKS, { to: '/admin', labelKey: 'nav.admin', end: false }] : LINKS

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="rounded-md" aria-label={t('nav.homeAria')}>
          <Logo />
        </Link>

        <div className="flex items-center gap-2">
          <nav aria-label={t('nav.main')} className="hidden items-center gap-1 md:flex">
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

          <div className="hidden items-center gap-2 md:flex">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={t(menuOpen ? 'nav.closeMenu' : 'nav.openMenu')}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-border text-foreground transition-colors duration-200 hover:bg-muted md:hidden"
          >
            {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label={t('nav.main')}
          className="border-t border-border bg-card px-4 pb-3 md:hidden"
        >
          <ul className="flex flex-col gap-1 pt-2">
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
    </header>
  )
}
