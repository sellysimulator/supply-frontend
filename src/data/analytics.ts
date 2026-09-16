import { supabase } from '../supabase/client'

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

/**
 * Records one click. Deliberately best-effort: a blocked or failed analytics
 * call must never stop someone launching a game, so failures are logged and
 * swallowed.
 */
export async function recordGameClick(gameId: string): Promise<void> {
  const { error } = await supabase.rpc('record_game_click', { p_game_id: gameId })
  if (error) console.warn('Could not record game click', error.message)
}

/**
 * Total launches per game over the last `days` days, most launched first.
 * Aggregated by `click_totals_by_game` in Postgres rather than by summing every
 * raw counter row in the browser — the API's row cap would otherwise silently
 * truncate that read on a busy site. Administrators only — the policies deny
 * this read to everyone else, including the visitors who caused the counts.
 */
export async function listClickTotalsByGame(
  days = 30,
): Promise<{ gameId: string; clickCount: number }[]> {
  const { data, error } = await supabase.rpc('click_totals_by_game', { p_days: days })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({ gameId: row.game_id, clickCount: row.click_count }))
}

/**
 * A dense series with one entry per hour for the last `hours` hours, oldest
 * first and ending at the current UTC hour — hours with no clicks present with
 * `clickCount` 0, so the chart cannot mistake "no data" for "no traffic".
 * Built by `click_series_hourly` in Postgres for the same reason as
 * `listClickTotalsByGame`. Administrators only.
 */
export async function listHourlyClickSeries(
  hours = 48,
): Promise<{ hour: Date; clickCount: number }[]> {
  const { data, error } = await supabase.rpc('click_series_hourly', { p_hours: hours })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({ hour: new Date(row.hour), clickCount: row.click_count }))
}

export * from './clickMetrics'
