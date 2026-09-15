import { useTranslation } from 'react-i18next'
import { ButtonLink, Card, CardBody } from '../components/ui'
import { PageContainer, PageHeading } from '../components/layout/Layout'

const BOUNDARIES = ['catalog', 'independent', 'curated']
const PARAGRAPHS = ['p1', 'p2', 'p3', 'p4']

export default function About() {
  const { t } = useTranslation()

  return (
    <PageContainer>
      <PageHeading title={t('about.title')} description={t('about.description')} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-6 leading-relaxed text-muted-foreground lg:col-span-2">
          {PARAGRAPHS.map((key) => (
            <p key={key}>{t(`about.${key}`)}</p>
          ))}
        </div>

        <aside className="flex flex-col gap-4">
          {BOUNDARIES.map((key) => (
            <Card key={key}>
              <CardBody className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {t(`about.boundaries.${key}.title`)}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`about.boundaries.${key}.body`)}
                </p>
              </CardBody>
            </Card>
          ))}
        </aside>
      </div>

      <div className="mt-12 flex flex-col items-start gap-4 border-t border-border pt-8">
        <h2 className="text-lg font-semibold text-foreground">{t('about.cta.title')}</h2>
        <p className="max-w-2xl text-muted-foreground">{t('about.cta.body')}</p>
        <ButtonLink to="/catalog">{t('about.cta.action')}</ButtonLink>
      </div>
    </PageContainer>
  )
}
