import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Surface } from '../ui'
import { Logo } from './Logo'
import { TermsModal } from '../TermsModal'

/** One inset tile at the foot of the board, three columns inside it. */
export function Footer() {
  const { t } = useTranslation()
  const [termsOpen, setTermsOpen] = useState(false)

  const linkClass =
    'inline-flex h-11 w-fit items-center rounded-sm text-sm text-muted-foreground transition-colors duration-200 hover:text-primary'

  return (
    <footer className="mt-auto w-full">
      <div className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <Surface as="div" className="p-6 sm:p-8">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col gap-3">
              <Logo />
              <p className="max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
                {t('footer.tagline')}
              </p>
            </div>

            <nav aria-label={t('footer.label')} className="flex flex-col items-start">
              <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground">
                {t('footer.linksHeading')}
              </p>
              <Link to="/catalog" className={linkClass}>
                {t('nav.catalog')}
              </Link>
              <Link to="/about" className={linkClass}>
                {t('nav.about')}
              </Link>
              <button
                type="button"
                onClick={() => setTermsOpen(true)}
                className={`${linkClass} cursor-pointer underline underline-offset-4`}
              >
                {t('footer.terms')}
              </button>
            </nav>

            <p className="max-w-[34ch] text-sm leading-relaxed text-muted-foreground sm:text-right">
              {t('footer.disclaimer')}
            </p>
          </div>
        </Surface>
      </div>

      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </footer>
  )
}
