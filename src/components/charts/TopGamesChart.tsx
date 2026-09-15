export type GameCount = { gameId: string; name: string; clickCount: number }

/**
 * Launches per game. One series, so every bar carries the same hue — colouring
 * each bar darker-where-bigger would double-encode the length it already shows.
 * Values are direct-labelled here because the list is short.
 */
export function TopGamesChart({ rows }: { rows: GameCount[] }) {
  const max = Math.max(1, ...rows.map((row) => row.clickCount))

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.gameId} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm text-foreground">{row.name}</span>
            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
              {row.clickCount}
            </span>
          </div>
          <div className="h-2 w-full rounded-sm bg-muted">
            <div
              className="h-2 rounded-sm bg-primary"
              style={{ width: `${(row.clickCount / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
