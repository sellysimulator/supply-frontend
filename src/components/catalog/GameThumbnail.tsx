import { useTranslation } from 'react-i18next'
import { Layers } from 'lucide-react'
import type { Game } from '../../types/game'

/**
 * Fixed 16:9 box so the grid never shifts while images load, with a flat
 * placeholder for entries that have no thumbnail yet.
 */
export function GameThumbnail({ game, className }: { game: Game; className?: string }) {
  const { t } = useTranslation()

  return (
    <div className={`aspect-video w-full overflow-hidden bg-muted ${className ?? ''}`}>
      {game.thumbnail ? (
        <img
          src={game.thumbnail.url}
          alt={t('game.thumbnailAlt', { name: game.name })}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <Layers size={28} aria-hidden="true" />
        </div>
      )}
    </div>
  )
}
