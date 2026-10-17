import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, SectionHeader } from '../ui'
import { Footer } from './Footer'
import { Header } from './Header'

/** The public shell: header, page, footer, with a skip link for keyboard users. */
export function Layout() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only rounded-md bg-primary px-4 py-2 text-on-primary shadow-tile focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        {t('common.skipToContent')}
      </a>
      <Header />
      <main id="main" className="w-full flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

/**
 * Standard page padding, so no page invents its own container. The board wants
 * 1280px, and the tiles carry their own vertical rhythm through the grid gap —
 * which is why the vertical padding is smaller than the old flat layout's.
 */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${className ?? ''}`}>
      {children}
    </div>
  )
}

/**
 * Every page opens with a header tile rather than a bare heading row, so the
 * first thing on the board is part of the board.
 */
export function PageHeading({
  title,
  description,
  eyebrow,
  actions,
  aside,
  children,
}: {
  title: string
  description?: string
  eyebrow?: string
  actions?: React.ReactNode
  /** A live count or status chip, shown at the end of the heading row. */
  aside?: React.ReactNode
  /** Filter chips or controls, on their own row below the heading. */
  children?: React.ReactNode
}) {
  return (
    <Card className="mb-4 p-6 sm:p-8">
      <SectionHeader
        level={1}
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          actions || aside ? (
            <>
              {aside}
              {actions}
            </>
          ) : undefined
        }
      />
      {children && <div className="mt-6">{children}</div>}
    </Card>
  )
}
