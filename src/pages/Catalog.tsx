import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button, EmptyState, ErrorState, LoadingSection } from '../components/ui'
import { PageContainer, PageHeading } from '../components/layout/Layout'
import { BentoGrid, BentoItem } from '../components/layout/BentoGrid'
import { CategoryFilter } from '../components/catalog/CategoryFilter'
import { GameCard } from '../components/catalog/GameCard'
import { computeSpans } from '../lib/bento'
import { listPublishedGames } from '../data/games'
import { useAsync } from '../hooks/useAsync'

export default function Catalog() {
  const { t } = useTranslation()
  const { data: games, loading, error, reload } = useAsync(() => listPublishedGames(), [])
  const [category, setCategory] = useState<string | null>(null)

  const categories = useMemo(() => {
    const unique = new Set<string>()
    for (const game of games ?? []) {
      for (const entry of game.categories) unique.add(entry)
    }
    return [...unique].sort((a, b) => a.localeCompare(b))
  }, [games])

  const visible = useMemo(() => {
    if (!games) return []
    return category ? games.filter((game) => game.categories.includes(category)) : games
  }, [games, category])

  /* Recomputed on every filter, so the last row always closes the board. */
  const spans = useMemo(() => computeSpans(visible.length), [visible.length])

  const count = category
    ? t('catalog.countInCategory', { count: visible.length, category })
    : t('catalog.count', { count: visible.length })

  return (
    <PageContainer>
      <PageHeading
        title={t('catalog.title')}
        description={t('catalog.description')}
        aside={
          games && !loading && !error ? (
            <p aria-live="polite">
              <Badge tone="neutral" className="tabular-nums">
                {count}
              </Badge>
            </p>
          ) : undefined
        }
      >
        {games && !loading && !error && (
          <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />
        )}
      </PageHeading>

      {loading && <LoadingSection label={t('catalog.loading')} />}

      {error && (
        <ErrorState
          description={t('catalog.loadError')}
          action={
            <Button variant="secondary" onClick={reload}>
              {t('common.tryAgain')}
            </Button>
          }
        />
      )}

      {games &&
        !loading &&
        !error &&
        (visible.length === 0 ? (
          <EmptyState
            title={t(category ? 'catalog.emptyCategory.title' : 'catalog.empty.title')}
            description={t(
              category ? 'catalog.emptyCategory.description' : 'catalog.empty.description',
            )}
            action={
              category ? (
                <Button variant="secondary" onClick={() => setCategory(null)}>
                  {t('catalog.emptyCategory.action')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <BentoGrid as="ul">
            {visible.map((game, index) => (
              <BentoItem
                as="li"
                key={game.id}
                span={spans[index] ?? 4}
                index={index}
                featured={index === 0}
                rowSpan
              >
                <GameCard game={game} featured={index === 0} />
              </BentoItem>
            ))}
          </BentoGrid>
        ))}
    </PageContainer>
  )
}
