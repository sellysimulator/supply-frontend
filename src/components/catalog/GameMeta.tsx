import { useTranslation } from 'react-i18next'
import { Clock, Users, GraduationCap } from 'lucide-react'
import { cn } from '../../lib/cn'
import { durationLabel, playerRangeLabel } from '../../i18n/format'
import type { GameSummary } from '../../types/game'

/**
 * The three facts a visitor scans for before opening a game. Rendered identically
 * on the catalog tile and the details page, so it asks only for the summary
 * fields both of them have.
 *
 * Each label stays inside a single element — it is one fact, not a sentence
 * assembled from parts.
 */
export function GameMeta({
  game,
  className,
  tone = 'default',
  compact = false,
}: {
  game: GameSummary
  className?: string
  tone?: 'default' | 'onFeatured'
  /** Drops the audience, which the tile already shows in its top corner. */
  compact?: boolean
}) {
  const { t } = useTranslation()

  const items = [
    { icon: Users, label: playerRangeLabel(t, game) },
    { icon: Clock, label: durationLabel(t, game.durationMinutes) },
    ...(game.audience && !compact ? [{ icon: GraduationCap, label: game.audience }] : []),
  ]

  const text = tone === 'onFeatured' ? 'text-on-featured-muted' : 'text-muted-foreground'

  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className={cn('inline-flex items-center gap-1.5 text-sm font-medium', text)}
        >
          <Icon size={15} aria-hidden="true" className="shrink-0" />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  )
}
