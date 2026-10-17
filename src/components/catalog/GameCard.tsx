import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { Badge, Card, CardFooter, Motif } from '../ui'
import { cn } from '../../lib/cn'
import type { GameSummary } from '../../types/game'
import { GameMeta } from './GameMeta'
import { GameThumbnail } from './GameThumbnail'

/**
 * One catalog entry as a tile.
 *
 * The title link is stretched across the whole tile, so anywhere on the card is
 * a target, while "More details" stays a real focusable link with its own
 * accessible name. That is a change from the earlier flat card, which avoided
 * being a link so its body text stayed selectable — the tile composition needs a
 * whole-surface target more than the blurb needs to be selected.
 *
 * The card deliberately does not link out to the game. Launches are counted on
 * the details page, so an outbound link here would walk straight past the
 * counter.
 */
export function GameCard({ game, featured = false }: { game: GameSummary; featured?: boolean }) {
  const { t } = useTranslation()

  const body = featured ? 'text-on-featured-muted' : 'text-muted-foreground'
  const title = featured ? 'text-on-featured' : 'text-foreground'

  return (
    <Card
      elevation={featured ? 'featured' : 'tile'}
      interactive
      className="relative flex h-full flex-col overflow-hidden"
    >
      {featured && (
        <Motif
          variant="rings"
          className="absolute -right-8 -bottom-10 h-52 w-52 text-on-featured opacity-10"
        />
      )}

      <div className="relative flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <GameThumbnail game={game} tone={featured ? 'onFeatured' : 'primary'} />
          <div className="flex flex-col items-end gap-1.5">
            {featured && <Badge tone="onFeatured">{t('game.featured')}</Badge>}
            {game.audience && (
              <span className={cn('text-xs font-medium tracking-wide', body)}>{game.audience}</span>
            )}
          </div>
        </div>

        <h3 className={cn('font-display text-xl font-semibold tracking-[-0.02em]', title)}>
          <Link to={`/games/${game.id}`} className="stretched rounded-sm">
            {game.name}
          </Link>
        </h3>

        {game.categories.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {game.categories.slice(0, 3).map((category) => (
              <li key={category}>
                <Badge tone={featured ? 'onFeatured' : 'primary'}>{category}</Badge>
              </li>
            ))}
          </ul>
        )}

        <p className={cn('flex-1 text-sm leading-relaxed', body, !featured && 'line-clamp-3')}>
          {game.shortDescription}
        </p>
      </div>

      <CardFooter
        className={cn(
          'relative flex flex-wrap items-center justify-between gap-x-4 gap-y-2',
          featured && 'border-on-featured-line',
        )}
      >
        <GameMeta game={game} tone={featured ? 'onFeatured' : 'default'} compact />
        <Link
          to={`/games/${game.id}`}
          aria-label={t('game.moreDetailsAbout', { name: game.name })}
          className={cn(
            'relative z-10 inline-flex h-11 items-center gap-1.5 rounded-sm text-sm font-semibold transition-colors duration-200',
            featured ? 'text-on-featured' : 'text-primary hover:text-primary-hover',
          )}
        >
          {t('game.moreDetails')}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </CardFooter>
    </Card>
  )
}
