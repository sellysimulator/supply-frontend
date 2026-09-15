import { useTranslation } from 'react-i18next'
import { ArrowRight, BookOpen, Compass, ExternalLink } from 'lucide-react'
import { ButtonLink, Card, CardBody, LoadingSection } from '../components/ui'
import { PageContainer } from '../components/layout/Layout'
import { GameCard } from '../components/catalog/GameCard'
import { listPublishedGames } from '../data/games'
import { useAsync } from '../hooks/useAsync'

const VALUE_POINTS = [
  { key: 'find', icon: Compass },
  { key: 'teach', icon: BookOpen },
  { key: 'launch', icon: ExternalLink },
]

export default function Landing() {
  const { t } = useTranslation()
  const { data: games, loading } = useAsync(() => listPublishedGames(), [])
  const featured = (games ?? []).slice(0, 3)

  return (
    <>
      {/* Flat surface, no gradient — the hero is set apart by a border only. */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="flex max-w-3xl flex-col gap-6">
            <p className="text-sm font-medium tracking-wide text-primary uppercase">
              {t('landing.eyebrow')}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {t('landing.title')}
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">{t('landing.intro')}</p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to="/catalog" size="lg">
                {t('landing.browseCatalog')}
                <ArrowRight size={16} aria-hidden="true" />
              </ButtonLink>
              <ButtonLink to="/about" size="lg" variant="secondary">
                {t('landing.aboutSupply')}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <PageContainer>
        <section aria-labelledby="what-supply-does" className="mb-14">
          <h2 id="what-supply-does" className="sr-only">
            {t('landing.whatSupplyDoes')}
          </h2>
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {VALUE_POINTS.map(({ key, icon: Icon }) => (
              <li key={key}>
                <Card className="h-full">
                  <CardBody className="flex flex-col gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary-subtle text-primary">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <h3 className="text-base font-semibold text-foreground">
                      {t(`landing.values.${key}.title`)}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t(`landing.values.${key}.body`)}
                    </p>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="featured">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 id="featured" className="text-2xl font-semibold tracking-tight text-foreground">
                {t('landing.featured.title')}
              </h2>
              <p className="text-muted-foreground">{t('landing.featured.description')}</p>
            </div>
            <ButtonLink to="/catalog" variant="ghost" className="shrink-0">
              {t('landing.featured.viewAll')}
              <ArrowRight size={16} aria-hidden="true" />
            </ButtonLink>
          </div>

          {loading ? (
            <LoadingSection label={t('landing.featured.loading')} />
          ) : featured.length === 0 ? (
            <Card>
              <CardBody className="py-10 text-center text-muted-foreground">
                {t('landing.featured.empty')}
              </CardBody>
            </Card>
          ) : (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((game) => (
                <li key={game.id}>
                  <GameCard game={game} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageContainer>
    </>
  )
}
