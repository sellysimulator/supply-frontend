import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { Header } from './Header'

/** The public shell: header, page, footer, with a skip link for keyboard users. */
export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only rounded-md bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="w-full flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

/** Standard page padding, so no page invents its own container. */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 ${className ?? ''}`}>
      {children}
    </div>
  )
}

/** Consistent page heading block across public and admin pages. */
export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && <p className="max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
