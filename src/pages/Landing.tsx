import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BookOpen, Compass, ExternalLink } from 'lucide-react'
import {
  ButtonLink,
  Card,
  IconPad,
  LoadingSection,
  Motif,
  SectionHeader,
  Stat,
} from '../components/ui'
import { PageContainer } from '../components/layout/Layout'
import { BentoGrid, BentoItem } from '../components/layout/BentoGrid'
import { GameCard } from '../components/catalog/GameCard'
import { computeSpans } from '../lib/bento'
import { rangeLabel } from '../i18n/format'
import { listPublishedGames } from '../data/games'
import { useAsync } from '../hooks/useAsync'
import type { GameSummary } from '../types/game'

/* Find and Teach sit in their own band; Launch shares the hero band, which is
   what keeps the first screen from being a plain row of three equal cards. */
const VALUE_POINTS = [
  { key: 'find', icon: Compass },
  { key: 'teach', icon: BookOpen },
] as const

const LAUNCH_POINT = { key: 'launch', icon: ExternalLink } as const

/** The figures in the hero band are read off the catalog, never hardcoded. */
function summarise(games: GameSummary[] | null) {
  if (!games || games.length === 0) return null

  const durations = games.map((game) => game.durationMinutes)
  const minPlayers = games.map((game) => game.minPlayers)
  const maxPlayers = games.map((game) => game.maxPlayers)

  return {
    count: games.length,
    duration: rangeLabel(Math.min(...durations), Math.max(...durations)),
    players: rangeLabel(Math.min(...minPlayers), Math.max(...maxPlayers)),
  }
}

export default function Landing() {
  const { t } = useTranslation()
  const { data: games, loading } = useAsync(() => listPublishedGames(), [])

  const stats = useMemo(() => summarise(games), [games])
  /* The featured game, if one is set, sorts first, so it always makes the cut. */
  const preview = useMemo(() => (games ?? []).slice(0, 6), [games])
  const spans = useMemo(() => computeSpans(preview.length), [preview.length])

  return (
    <PageContainer>
      {/* ------------------------------------------------------------- Hero */}
      <BentoGrid as="section" aria-label={t('landing.whatSellyDoes')} rows>
        <BentoItem span={8} reveal={false} className="sm:col-span-6 lg:row-span-3">
          <Card className="relative flex h-full flex-col justify-center overflow-hidden p-6 sm:p-8 lg:p-10">
            <p className="inline-flex w-fit items-center rounded-sm bg-primary-subtle px-3 py-1.5 text-xs font-medium tracking-wide text-primary">
              {t('landing.eyebrow')}
            </p>
            <h1 className="mt-5 max-w-[20ch] font-display text-[clamp(2.25rem,4.5vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.03em] text-foreground">
              {t('landing.title')}
            </h1>
            <p className="mt-5 max-w-[58ch] leading-relaxed text-muted-foreground">
              {t('landing.intro')}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink to="/catalog" size="lg">
                {t('landing.browseCatalog')}
                <ArrowRight size={16} aria-hidden="true" />
              </ButtonLink>
              <ButtonLink to="/about" size="lg" variant="secondary">
                {t('landing.aboutSelly')}
              </ButtonLink>
            </div>
            <Motif
              variant="network"
              className="absolute right-0 -bottom-2 hidden h-36 w-56 text-border lg:block"
            />
          </Card>
        </BentoItem>

        <h2 className="sr-only">{t('landing.stats.heading')}</h2>

        <BentoItem span={4} index={1} className="sm:col-span-2">
          <Card className="flex h-full flex-col justify-center p-6">
            <Stat value={stats ? stats.count : '—'} label={t('landing.stats.gamesLabel')} />
          </Card>
        </BentoItem>

        <BentoItem span={2} index={2} className="sm:col-span-2">
          <Card elevation="flat" className="flex h-full flex-col justify-center bg-surface p-6">
            <Stat value={stats ? stats.duration : '—'} label={t('landing.stats.durationLabel')} />
          </Card>
        </BentoItem>

        <BentoItem span={2} index={3} className="sm:col-span-2">
          <Card elevation="flat" className="flex h-full flex-col justify-center bg-surface p-6">
            <Stat value={stats ? stats.players : '—'} label={t('landing.stats.playersLabel')} />
          </Card>
        </BentoItem>

        {/* The third value point shares the hero band; the other two follow. */}
        <BentoItem span={4} index={4} className="sm:col-span-6">
          <Card className="flex h-full flex-col justify-center p-6">
            <IconPad>
              <LAUNCH_POINT.icon size={20} />
            </IconPad>
            <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
              {t(`landing.values.${LAUNCH_POINT.key}.title`)}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {t(`landing.values.${LAUNCH_POINT.key}.body`)}
            </p>
          </Card>
        </BentoItem>
      </BentoGrid>

      {/* ------------------------------------------------- Value points 1–2 */}
      <BentoGrid as="ul" className="mt-4">
        {VALUE_POINTS.map(({ key, icon: Icon }, index) => (
          <BentoItem as="li" key={key} span={6} index={index} className="sm:col-span-3">
            <Card className="flex h-full flex-col p-6">
              <IconPad>
                <Icon size={20} />
              </IconPad>
              <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
                {t(`landing.values.${key}.title`)}
              </h2>
              <p className="mt-1.5 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                {t(`landing.values.${key}.body`)}
              </p>
            </Card>
          </BentoItem>
        ))}
      </BentoGrid>

      {/* ---------------------------------------------------------- Featured */}
      <section aria-labelledby="featured" className="mt-4">
        <Card className="p-6 sm:p-8">
          <SectionHeader
            id="featured"
            title={t('landing.featured.title')}
            description={t('landing.featured.description')}
            actions={
              <ButtonLink to="/catalog" variant="soft">
                {t('landing.featured.viewAll')}
                <ArrowRight size={16} aria-hidden="true" />
              </ButtonLink>
            }
          />
        </Card>

        {loading ? (
          <LoadingSection label={t('landing.featured.loading')} />
        ) : preview.length === 0 ? (
          <Card className="mt-4 px-6 py-10 text-center text-muted-foreground">
            {t('landing.featured.empty')}
          </Card>
        ) : (
          <BentoGrid as="ul" className="mt-4">
            {preview.map((game, index) => (
              <BentoItem
                as="li"
                key={game.id}
                span={spans[index] ?? 4}
                index={index}
                featured={game.featured}
                rowSpan
              >
                <GameCard game={game} featured={game.featured} />
              </BentoItem>
            ))}
          </BentoGrid>
        )}
      </section>
    </PageContainer>
  )
}
