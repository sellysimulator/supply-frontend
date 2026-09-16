import { useTranslation } from 'react-i18next'
import { Clock, Users, GraduationCap } from 'lucide-react'
import { durationLabel, playerRangeLabel } from '../../i18n/format'
import type { GameSummary } from '../../types/game'

/**
 * The three facts a visitor scans for before opening a game. Rendered
 * identically on the catalog card and the details page, so it asks only for
 * the summary fields both of them have.
 */
export function GameMeta({ game, className }: { game: GameSummary; className?: string }) {
  const { t } = useTranslation()

  const items = [
    { icon: Users, label: playerRangeLabel(t, game) },
    { icon: Clock, label: durationLabel(t, game.durationMinutes) },
    ...(game.audience ? [{ icon: GraduationCap, label: game.audience }] : []),
  ]

  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 ${className ?? ''}`}>
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Icon size={15} aria-hidden="true" className="shrink-0" />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  )
}
