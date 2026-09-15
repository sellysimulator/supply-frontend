import { useMemo } from 'react'
import { BarChart3, LibraryBig, MousePointerClick, TrendingUp } from 'lucide-react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingSection,
} from '../../components/ui'
import { StatTile } from '../../components/charts/StatTile'
import { HourlyClicksChart } from '../../components/charts/HourlyClicksChart'
import { TopGamesChart } from '../../components/charts/TopGamesChart'
import {
  clicksByGame,
  clicksInLastHours,
  hourlySeries,
  listRecentClicks,
  totalClicks,
} from '../../data/analytics'
import { listAllGames } from '../../data/games'
import { useAsync } from '../../hooks/useAsync'

/** Anonymous game-click analytics for the last 30 days. */
export default function Dashboard() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [clicks, games] = await Promise.all([listRecentClicks(30), listAllGames()])
    return { clicks, games }
  }, [])

  const view = useMemo(() => {
    if (!data) return null
    const names = new Map(data.games.map((game) => [game.id, game.name]))
    const perGame = clicksByGame(data.clicks).map((row) => ({
      ...row,
      // A counter can outlive the entry it belongs to, since counters are never
      // deleted; fall back to the identifier so the row is still readable.
      name: names.get(row.gameId) ?? row.gameId,
    }))

    return {
      total: totalClicks(data.clicks),
      last24h: clicksInLastHours(data.clicks, 24),
      series: hourlySeries(data.clicks, 48),
      perGame,
      topGame: perGame[0] ?? null,
      publishedCount: data.games.filter((game) => game.published).length,
      totalGames: data.games.length,
    }
  }, [data])

  if (loading) return <LoadingSection label="Loading analytics" />

  if (error) {
    return (
      <ErrorState
        description="The analytics could not be loaded."
        action={
          <Button variant="secondary" onClick={reload}>
            Try again
          </Button>
        }
      />
    )
  }

  if (!view) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Anonymous game launches recorded over the last 30 days. No visitor information is stored —
          only which game was opened and in which hour.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Launches (30 days)"
          value={view.total.toLocaleString()}
          icon={<MousePointerClick size={16} aria-hidden="true" />}
        />
        <StatTile
          label="Launches (24 hours)"
          value={view.last24h.toLocaleString()}
          icon={<TrendingUp size={16} aria-hidden="true" />}
        />
        <StatTile
          label="Most launched"
          value={view.topGame ? view.topGame.name : '—'}
          hint={view.topGame ? `${view.topGame.clickCount} launches` : 'No launches recorded yet'}
          icon={<BarChart3 size={16} aria-hidden="true" />}
        />
        <StatTile
          label="Published games"
          value={view.publishedCount}
          hint={`${view.totalGames} ${view.totalGames === 1 ? 'entry' : 'entries'} in total`}
          icon={<LibraryBig size={16} aria-hidden="true" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Launches per hour, last 48 hours</CardTitle>
        </CardHeader>
        <CardBody>
          {view.total === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No launches have been recorded yet.
            </p>
          ) : (
            <HourlyClicksChart points={view.series} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Launches per game, last 30 days</CardTitle>
        </CardHeader>
        <CardBody>
          {view.perGame.length === 0 ? (
            <EmptyState
              title="Nothing to report yet"
              description="Game launches will appear here once visitors start opening games from the catalog."
            />
          ) : (
            <TopGamesChart rows={view.perGame} />
          )}
        </CardBody>
      </Card>
    </div>
  )
}
