import { useTranslation } from 'react-i18next'
import { Library, Link2, ShieldCheck } from 'lucide-react'
import { ButtonLink, Card, IconPad, Motif } from '../components/ui'
import { PageContainer, PageHeading } from '../components/layout/Layout'
import { BentoGrid, BentoItem } from '../components/layout/BentoGrid'

const BOUNDARIES = [
  { key: 'catalog', icon: Library },
  { key: 'independent', icon: Link2 },
  { key: 'curated', icon: ShieldCheck },
] as const

const PARAGRAPHS = ['p1', 'p2', 'p3', 'p4']

export default function About() {
  const { t } = useTranslation()

  return (
    <PageContainer>
      <PageHeading title={t('about.title')} description={t('about.description')} />

      <BentoGrid>
        <BentoItem span={8} reveal={false} className="sm:col-span-6">
          <Card className="h-full p-6 sm:p-8">
            <div className="flex flex-col gap-6 leading-relaxed text-muted-foreground">
              {PARAGRAPHS.map((key) => (
                <p key={key}>{t(`about.${key}`)}</p>
              ))}
            </div>
          </Card>
        </BentoItem>

        <BentoItem span={4} reveal={false} className="sm:col-span-6">
          <ul className="flex h-full flex-col gap-4">
            {BOUNDARIES.map(({ key, icon: Icon }) => (
              <li key={key} className="flex-1">
                <Card className="flex h-full flex-col gap-2 p-5">
                  <IconPad>
                    <Icon size={20} />
                  </IconPad>
                  <h2 className="mt-2 font-display text-base font-semibold text-foreground">
                    {t(`about.boundaries.${key}.title`)}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`about.boundaries.${key}.body`)}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </BentoItem>

        <BentoItem span={12} index={1} className="sm:col-span-6">
          <Card elevation="featured" className="relative overflow-hidden p-6 sm:p-8">
            <Motif
              variant="route"
              className="absolute right-0 -bottom-4 hidden h-32 w-52 text-on-featured opacity-15 sm:block"
            />
            <div className="relative flex flex-col items-start gap-4">
              <p className="inline-flex w-fit items-center rounded-sm bg-on-featured/15 px-3 py-1.5 text-xs font-medium tracking-wide text-on-featured">
                {t('about.ctaBadge')}
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-on-featured">
                {t('about.cta.title')}
              </h2>
              <p className="max-w-2xl leading-relaxed text-on-featured-muted">
                {t('about.cta.body')}
              </p>
              <ButtonLink to="/catalog" variant="inverse" size="lg">
                {t('about.cta.action')}
              </ButtonLink>
            </div>
          </Card>
        </BentoItem>
      </BentoGrid>
    </PageContainer>
  )
}
