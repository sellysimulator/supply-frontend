import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TermsModal } from '../TermsModal'

export function Footer() {
  const { t } = useTranslation()
  const [termsOpen, setTermsOpen] = useState(false)

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">Selly</p>
          <p className="text-sm text-muted-foreground">{t('footer.tagline')}</p>
        </div>

        <nav aria-label={t('footer.label')} className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            to="/catalog"
            className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
          >
            {t('nav.catalog')}
          </Link>
          <Link
            to="/about"
            className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
          >
            {t('nav.about')}
          </Link>
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="cursor-pointer text-sm text-muted-foreground underline underline-offset-4 transition-colors duration-200 hover:text-primary"
          >
            {t('footer.terms')}
          </button>
        </nav>
      </div>

      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </footer>
  )
}
