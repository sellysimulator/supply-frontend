import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, EmptyState, ErrorState, LoadingSection } from '../components/ui'
import { PageContainer, PageHeading } from '../components/layout/Layout'
import { CategoryFilter } from '../components/catalog/CategoryFilter'
import { GameCard } from '../components/catalog/GameCard'
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

  return (
    <PageContainer>
      <PageHeading title={t('catalog.title')} description={t('catalog.description')} />

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

      {games && !loading && !error && (
        <div className="flex flex-col gap-6">
          <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />

          {visible.length === 0 ? (
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
            <>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {category
                  ? t('catalog.countInCategory', { count: visible.length, category })
                  : t('catalog.count', { count: visible.length })}
              </p>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((game) => (
                  <li key={game.id}>
                    <GameCard game={game} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </PageContainer>
  )
}
