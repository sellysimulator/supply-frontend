/**
 * Pure helpers for the anonymous click counters: how an hour bucket is derived,
 * and how a set of counters is turned into the figures the dashboard shows.
 *
 * Deliberately free of any network dependency, so the bucketing logic — which
 * must agree with the hour the database function records against — can be
 * tested on its own.
 */

export type HourlyCount = {
  gameId: string
  hour: Date
  clickCount: number
}

/** `2026-09-14T15` — a stable key for an hour bucket. */
export function hourKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 13)
}

/** The top of the hour containing `date`, in UTC. */
export function truncateToHour(date: Date = new Date()): Date {
  const hour = new Date(date)
  hour.setUTCMinutes(0, 0, 0)
  return hour
}

export function totalClicks(counts: HourlyCount[]): number {
  return counts.reduce((sum, entry) => sum + entry.clickCount, 0)
}

/** Clicks per game, most launched first. */
export function clicksByGame(counts: HourlyCount[]): { gameId: string; clickCount: number }[] {
  const totals = new Map<string, number>()
  for (const entry of counts) {
    totals.set(entry.gameId, (totals.get(entry.gameId) ?? 0) + entry.clickCount)
  }
  return [...totals.entries()]
    .map(([gameId, clickCount]) => ({ gameId, clickCount }))
    .sort((a, b) => b.clickCount - a.clickCount)
}

/**
 * A dense series with one entry per hour for the last `hours` hours, including
 * hours with no clicks — a chart with gaps silently reads as low traffic rather
 * than no traffic.
 */
export function hourlySeries(
  counts: HourlyCount[],
  hours = 48,
): { hour: Date; clickCount: number }[] {
  const buckets = new Map<number, number>()
  for (const entry of counts) {
    const key = truncateToHour(entry.hour).getTime()
    buckets.set(key, (buckets.get(key) ?? 0) + entry.clickCount)
  }

  const end = truncateToHour(new Date())
  const series: { hour: Date; clickCount: number }[] = []
  for (let offset = hours - 1; offset >= 0; offset -= 1) {
    const hour = new Date(end.getTime() - offset * 60 * 60 * 1000)
    series.push({ hour, clickCount: buckets.get(hour.getTime()) ?? 0 })
  }
  return series
}

/** Clicks recorded since the top of the hour `hours` ago. */
export function clicksInLastHours(counts: HourlyCount[], hours: number): number {
  const cutoff = truncateToHour(new Date(Date.now() - (hours - 1) * 60 * 60 * 1000))
  return totalClicks(counts.filter((entry) => entry.hour.getTime() >= cutoff.getTime()))
}
