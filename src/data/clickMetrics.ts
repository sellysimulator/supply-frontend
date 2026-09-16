/**
 * Pure helpers for the two figures the dashboard derives from an
 * already-aggregated series: a total across a set of counts, and the total
 * across the most recent hours of one. Grouping clicks by game and building the
 * dense hourly series belong to Postgres (`click_totals_by_game`,
 * `click_series_hourly`), which is what keeps these free of any network
 * dependency and testable on their own.
 */

export function totalClicks(counts: { clickCount: number }[]): number {
  return counts.reduce((sum, entry) => sum + entry.clickCount, 0)
}

/** The sum of the last `hours` entries of a dense hourly series (oldest first). */
export function sumLastHours(series: { clickCount: number }[], hours: number): number {
  return totalClicks(series.slice(-hours))
}
