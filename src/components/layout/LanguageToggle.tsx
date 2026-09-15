import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { Button } from '../ui'
import type { Language } from '../../i18n'

/**
 * Switches the interface between English and Spanish. The button carries the
 * code of the language it switches *to*, and its accessible name is written in
 * that language — the convention that lets a reader who does not read the
 * current one still recognise it.
 *
 * Two languages fit a single toggle. A third would call for the `Select`
 * primitive instead, driven by `SUPPORTED_LANGUAGES`.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()

  const next: Language = i18n.resolvedLanguage === 'es' ? 'en' : 'es'

  return (
    <Button
      variant="secondary"
      onClick={() => void i18n.changeLanguage(next)}
      aria-label={t('language.switchAria')}
      title={t('language.switchAria')}
      className={className ? `px-3 ${className}` : 'px-3'}
    >
      <Languages size={18} aria-hidden="true" />
      <span className="text-sm font-medium">{t('language.switchLabel')}</span>
    </Button>
  )
}
