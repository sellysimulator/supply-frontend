import { useMemo, useState } from 'react'
import { Button, EmptyState, ErrorState, LoadingSection } from '../components/ui'
import { PageContainer, PageHeading } from '../components/layout/Layout'
import { CategoryFilter } from '../components/catalog/CategoryFilter'
import { GameCard } from '../components/catalog/GameCard'
import { listPublishedGames } from '../data/games'
import { useAsync } from '../hooks/useAsync'

export default function Catalog() {
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
      <PageHeading
        title="Catalog"
        description="Browse the games and simulations available in Supply. Open a game's details to see what it teaches and how to run it."
      />

      {loading && <LoadingSection label="Loading the catalog" />}

      {error && (
        <ErrorState
          description="The catalog could not be loaded. Check your connection and try again."
          action={
            <Button variant="secondary" onClick={reload}>
              Try again
            </Button>
          }
        />
      )}

      {games && !loading && !error && (
        <div className="flex flex-col gap-6">
          <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />

          {visible.length === 0 ? (
            <EmptyState
              title={category ? 'No games in this category' : 'The catalog is empty'}
              description={
                category
                  ? 'Try another category, or view all games.'
                  : 'Games will appear here once they have been published.'
              }
              action={
                category ? (
                  <Button variant="secondary" onClick={() => setCategory(null)}>
                    View all games
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {visible.length} {visible.length === 1 ? 'game' : 'games'}
                {category ? ` in ${category}` : ''}
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
