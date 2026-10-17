import { useTranslation } from 'react-i18next'
import { InitialsMark, Surface } from '../ui'
import type { IconPadTone } from '../ui'
import type { GameSummary } from '../../types/game'

/**
 * A game's picture on a tile. When an entry has an uploaded image it keeps a
 * fixed 16:9 box so the grid never shifts while it loads; when it has none the
 * thumbnail is *drawn* — its initials in the display face — rather than falling
 * back to a generic glyph that would look identical for every game.
 *
 * The drawn form is decorative and carries no `role="img"`: the game's name is
 * already the heading beside it.
 */
export function GameThumbnail({
  game,
  className,
  tone = 'primary',
}: {
  game: GameSummary
  className?: string
  tone?: IconPadTone
}) {
  const { t } = useTranslation()

  if (!game.thumbnail) {
    return <InitialsMark name={game.name} tone={tone} className={className} />
  }

  return (
    <Surface className={`aspect-video w-full overflow-hidden ${className ?? ''}`}>
      <img
        src={game.thumbnail.url}
        alt={t('game.thumbnailAlt', { name: game.name })}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </Surface>
  )
}
