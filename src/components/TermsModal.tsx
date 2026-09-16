import { useTranslation } from 'react-i18next'
import { Button, Modal } from './ui'

/**
 * Terms and conditions, opened from the footer. The substance the spec calls
 * for is the analytics disclosure: Selly counts game launches anonymously, in
 * hourly totals, to understand which games draw interest.
 */
export function TermsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('terms.title')}
      footer={
        <Button variant="primary" onClick={onClose}>
          {t('common.close')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{t('terms.catalogHeading')}</h3>
          <p>{t('terms.catalogBody')}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{t('terms.analyticsHeading')}</h3>
          <p>{t('terms.analyticsP1')}</p>
          <p>{t('terms.analyticsP2')}</p>
          <p>{t('terms.analyticsP3')}</p>
          <p>{t('terms.analyticsP4')}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{t('terms.gamesHeading')}</h3>
          <p>{t('terms.gamesBody')}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{t('terms.adminHeading')}</h3>
          <p>{t('terms.adminBody')}</p>
        </section>
      </div>
    </Modal>
  )
}
