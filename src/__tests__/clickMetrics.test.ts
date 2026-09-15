import { describe, expect, it } from 'vitest'
import {
  clicksByGame,
  clicksInLastHours,
  counterId,
  hourKey,
  hourlySeries,
  totalClicks,
  truncateToHour,
  type HourlyCount,
} from '../data/clickMetrics'

/** Hours are UTC throughout, so the bucket a click lands in does not depend on
 *  where the visitor is. */
describe('hour bucketing', () => {
  it('truncates a timestamp to the top of its UTC hour', () => {
    const hour = truncateToHour(new Date('2026-09-14T15:47:31.512Z'))
    expect(hour.toISOString()).toBe('2026-09-14T15:00:00.000Z')
  })

  it('derives the hour key used as the document id suffix', () => {
    expect(hourKey(new Date('2026-09-14T15:47:31Z'))).toBe('2026-09-14T15')
  })

  it('builds a counter id from the game and the hour', () => {
    expect(counterId('beer-game', new Date('2026-09-14T15:47:31Z'))).toBe('beer-game_2026-09-14T15')
  })

  it('keeps the game id as the first segment, which the rules check', () => {
    const id = counterId('beer-game', new Date('2026-09-14T15:00:00Z'))
    expect(id.split('_')[0]).toBe('beer-game')
  })
})

const at = (iso: string, gameId: string, clickCount: number): HourlyCount => ({
  gameId,
  hour: new Date(iso),
  clickCount,
})

describe('reporting', () => {
  const counts = [
    at('2026-09-14T10:00:00Z', 'beer-game', 5),
    at('2026-09-14T10:00:00Z', 'selly', 2),
    at('2026-09-14T11:00:00Z', 'beer-game', 3),
  ]

  it('totals every counter', () => {
    expect(totalClicks(counts)).toBe(10)
  })

  it('sums per game, most launched first', () => {
    expect(clicksByGame(counts)).toEqual([
      { gameId: 'beer-game', clickCount: 8 },
      { gameId: 'selly', clickCount: 2 },
    ])
  })

  it('returns nothing for an empty period', () => {
    expect(totalClicks([])).toBe(0)
    expect(clicksByGame([])).toEqual([])
  })
})

describe('hourly series', () => {
  it('produces one dense entry per hour, including empty hours', () => {
    const series = hourlySeries([], 12)
    expect(series).toHaveLength(12)
    expect(series.every((point) => point.clickCount === 0)).toBe(true)
  })

  it('runs in chronological order and ends at the current hour', () => {
    const series = hourlySeries([], 6)
    const times = series.map((point) => point.hour.getTime())
    expect([...times].sort((a, b) => a - b)).toEqual(times)
    expect(series.at(-1)?.hour.getTime()).toBe(truncateToHour(new Date()).getTime())
  })

  it('places a counter in its own hour', () => {
    const thisHour = truncateToHour(new Date())
    const series = hourlySeries([{ gameId: 'beer-game', hour: thisHour, clickCount: 7 }], 3)
    expect(series.at(-1)).toEqual({ hour: thisHour, clickCount: 7 })
  })

  it('merges several games into one hourly total', () => {
    const thisHour = truncateToHour(new Date())
    const series = hourlySeries(
      [
        { gameId: 'beer-game', hour: thisHour, clickCount: 4 },
        { gameId: 'selly', hour: thisHour, clickCount: 6 },
      ],
      2,
    )
    expect(series.at(-1)?.clickCount).toBe(10)
  })

  it('ignores counters older than the window', () => {
    const old = new Date(truncateToHour(new Date()).getTime() - 100 * 60 * 60 * 1000)
    const series = hourlySeries([{ gameId: 'beer-game', hour: old, clickCount: 9 }], 6)
    expect(series.reduce((sum, point) => sum + point.clickCount, 0)).toBe(0)
  })
})

describe('recent activity', () => {
  it('counts only clicks inside the requested window', () => {
    const thisHour = truncateToHour(new Date())
    const longAgo = new Date(thisHour.getTime() - 48 * 60 * 60 * 1000)
    const counts = [
      { gameId: 'beer-game', hour: thisHour, clickCount: 3 },
      { gameId: 'beer-game', hour: longAgo, clickCount: 99 },
    ]
    expect(clicksInLastHours(counts, 24)).toBe(3)
  })
})
