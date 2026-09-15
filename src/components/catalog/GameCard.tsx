import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Badge, Card } from '../ui'
import type { Game } from '../../types/game'
import { GameMeta } from './GameMeta'
import { GameThumbnail } from './GameThumbnail'

/** One catalog entry in the grid. The whole card is not a link — the
 *  "More details" action is, so the card's text stays selectable. */
export function GameCard({ game }: { game: Game }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-colors duration-200 hover:border-primary">
      <GameThumbnail game={game} />

      <div className="flex flex-1 flex-col gap-3 p-5">
        {game.categories.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {game.categories.slice(0, 3).map((category) => (
              <li key={category}>
                <Badge tone="primary">{category}</Badge>
              </li>
            ))}
          </ul>
        )}

        <h3 className="text-lg font-semibold text-foreground">{game.name}</h3>
        <p className="flex-1 text-sm text-muted-foreground">{game.shortDescription}</p>

        <GameMeta game={game} />

        <Link
          to={`/games/${game.id}`}
          aria-label={`More details about ${game.name}`}
          className="mt-1 inline-flex h-11 w-fit items-center gap-1.5 rounded-md text-sm font-medium text-primary transition-colors duration-200 hover:text-primary-hover"
        >
          More details
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </Card>
  )
}
