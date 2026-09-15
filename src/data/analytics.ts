import { supabase } from '../supabase/client'
import type { ClickCountRow } from '../supabase/types'
import { truncateToHour, type HourlyCount } from './clickMetrics'

/**
 * Anonymous game-click analytics.
 *
 * A click increments one counter per game per hour. Nothing that could identify
 * a visitor is stored: no name, email, account id, cookie, session or address.
 * The only facts recorded are which game was opened and in which hour.
 *
 * Visitors never write the counter table directly — no policy permits it. The
 * `record_game_click` database function is the only way in, and it can do
 * exactly one thing: add one to the current hour's count for a published game.
 */

const CLICK_COUNTS = 'click_counts'

/**
 * Records one click. Deliberately best-effort: a blocked or failed analytics
 * call must never stop someone launching a game, so failures are logged and
 * swallowed.
 */
export async function recordGameClick(gameId: string): Promise<void> {
  const { error } = await supabase.rpc('record_game_click', { p_game_id: gameId })
  if (error) console.warn('Could not record game click', error.message)
}

function toHourlyCount(row: ClickCountRow): HourlyCount {
  return {
    gameId: row.game_id,
    hour: new Date(row.hour),
    clickCount: row.click_count,
  }
}

/**
 * Every counter from the last `days` days. Administrators only — the policies
 * deny this read to everyone else, including the visitors who caused the
 * counts.
 */
export async function listRecentClicks(days = 30): Promise<HourlyCount[]> {
  const since = truncateToHour(new Date(Date.now() - days * 24 * 60 * 60 * 1000))

  const { data, error } = await supabase
    .from(CLICK_COUNTS)
    .select('game_id, hour, click_count')
    .gte('hour', since.toISOString())
    .order('hour', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(toHourlyCount)
}

export * from './clickMetrics'
