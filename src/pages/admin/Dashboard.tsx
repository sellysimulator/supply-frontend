import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  listClickTotalsByGame,
  listHourlyClickSeries,
  sumLastHours,
  totalClicks,
} from '../../data/analytics'
import { listAllGames } from '../../data/games'
import { useAsync } from '../../hooks/useAsync'

/** Anonymous game-click analytics for the last 30 days. */
export default function Dashboard() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsync(async () => {
    const [totals, series, games] = await Promise.all([
      listClickTotalsByGame(30),
      listHourlyClickSeries(48),
      listAllGames(),
    ])
    return { totals, series, games }
  }, [])

  const view = useMemo(() => {
    if (!data) return null
    const names = new Map(data.games.map((game) => [game.id, game.name]))
    const perGame = data.totals.map((row) => ({
      ...row,
      // A counter can outlive the entry it belongs to, since counters are never
      // deleted; fall back to the identifier so the row is still readable.
      name: names.get(row.gameId) ?? row.gameId,
    }))

    return {
      total: totalClicks(data.totals),
      // The 48-hour series is dense and oldest-first, so the last 24 points
      // are exactly the last 24 hours.
      last24h: sumLastHours(data.series, 24),
      series: data.series,
      perGame,
      topGame: perGame[0] ?? null,
      publishedCount: data.games.filter((game) => game.published).length,
      totalGames: data.games.length,
    }
  }, [data])

  if (loading) return <LoadingSection label={t('admin.dashboard.loading')} />

  if (error) {
    return (
      <ErrorState
        description={t('admin.dashboard.loadError')}
        action={
          <Button variant="secondary" onClick={reload}>
            {t('common.tryAgain')}
          </Button>
        }
      />
    )
  }

  if (!view) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{t('admin.dashboard.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('admin.dashboard.description')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={t('admin.dashboard.launches30d')}
          value={view.total.toLocaleString()}
          icon={<MousePointerClick size={16} aria-hidden="true" />}
        />
        <StatTile
          label={t('admin.dashboard.launches24h')}
          value={view.last24h.toLocaleString()}
          icon={<TrendingUp size={16} aria-hidden="true" />}
        />
        <StatTile
          label={t('admin.dashboard.mostLaunched')}
          value={view.topGame ? view.topGame.name : '—'}
          hint={
            view.topGame
              ? t('admin.dashboard.launchCount', { count: view.topGame.clickCount })
              : t('admin.dashboard.noLaunchesYet')
          }
          icon={<BarChart3 size={16} aria-hidden="true" />}
        />
        <StatTile
          label={t('admin.dashboard.publishedGames')}
          value={view.publishedCount}
          hint={t('admin.dashboard.entryCount', { count: view.totalGames })}
          icon={<LibraryBig size={16} aria-hidden="true" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.dashboard.hourlyTitle')}</CardTitle>
        </CardHeader>
        <CardBody>
          {view.total === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('admin.dashboard.hourlyEmpty')}
            </p>
          ) : (
            <HourlyClicksChart points={view.series} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.dashboard.perGameTitle')}</CardTitle>
        </CardHeader>
        <CardBody>
          {view.perGame.length === 0 ? (
            <EmptyState
              title={t('admin.dashboard.perGameEmptyTitle')}
              description={t('admin.dashboard.perGameEmptyDescription')}
            />
          ) : (
            <TopGamesChart rows={view.perGame} />
          )}
        </CardBody>
      </Card>
    </div>
  )
}
