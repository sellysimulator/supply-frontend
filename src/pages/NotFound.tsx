import { useTranslation } from 'react-i18next'
import { ButtonLink, Card, Motif } from '../components/ui'
import { PageContainer } from '../components/layout/Layout'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <PageContainer>
      <Card className="relative mx-auto flex max-w-2xl flex-col items-start gap-4 overflow-hidden p-8 sm:p-12">
        <Motif
          variant="route"
          className="absolute right-0 -bottom-4 hidden h-32 w-52 text-border sm:block"
        />
        <p className="relative inline-flex w-fit items-center rounded-sm bg-primary-subtle px-3 py-1.5 text-xs font-medium tracking-wide text-primary">
          {t('notFound.eyebrow')}
        </p>
        <h1 className="relative font-display text-3xl font-bold tracking-[-0.02em] text-foreground">
          {t('notFound.title')}
        </h1>
        <p className="relative max-w-xl leading-relaxed text-muted-foreground">
          {t('notFound.description')}
        </p>
        <ButtonLink to="/" className="relative">
          {t('notFound.home')}
        </ButtonLink>
      </Card>
    </PageContainer>
  )
}
