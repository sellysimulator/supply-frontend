/**
 * Display labels that depend on both the data and the reader's language.
 *
 * They take the translation function rather than calling `useTranslation`
 * themselves, so they stay ordinary functions that a test can drive with any
 * language.
 */

/** The shape of i18next's `t`, narrowed to what these helpers need. */
export type Translate = (key: string, options?: Record<string, unknown>) => string

export function playerRangeLabel(
  t: Translate,
  players: { minPlayers: number; maxPlayers: number },
): string {
  if (players.minPlayers === players.maxPlayers) {
    return t('game.players', { count: players.minPlayers })
  }
  return t('game.playerRange', { min: players.minPlayers, max: players.maxPlayers })
}

export function durationLabel(t: Translate, minutes: number): string {
  if (minutes < 60) return t('game.durationMinutes', { count: minutes })

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0
    ? t('game.durationHours', { count: hours })
    : t('game.durationHoursMinutes', { hours, minutes: rest })
}
