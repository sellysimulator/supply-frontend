import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useAuth } from '../../auth/useAuth'
import { Logo } from './Logo'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/catalog', label: 'Catalog', end: false },
  { to: '/about', label: 'About', end: false },
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
  const { isAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = isAdmin ? [...LINKS, { to: '/admin', label: 'Admin', end: false }] : LINKS

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="rounded-md" aria-label="Supply — home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => linkClasses(isActive)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-border text-foreground transition-colors duration-200 hover:bg-muted md:hidden"
        >
          {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Main"
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
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
