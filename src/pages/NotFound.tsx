import { useTranslation } from 'react-i18next'
import { ButtonLink } from '../components/ui'
import { PageContainer } from '../components/layout/Layout'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <PageContainer>
      <div className="flex flex-col items-start gap-4 py-16">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">
          {t('notFound.eyebrow')}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t('notFound.title')}
        </h1>
        <p className="max-w-xl text-muted-foreground">{t('notFound.description')}</p>
        <ButtonLink to="/">{t('notFound.home')}</ButtonLink>
      </div>
    </PageContainer>
  )
}
