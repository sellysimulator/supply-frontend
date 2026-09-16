import { describe, expect, it } from 'vitest'
import { sumLastHours, totalClicks } from '../data/clickMetrics'

describe('totalClicks', () => {
  it('sums every entry', () => {
    expect(totalClicks([{ clickCount: 5 }, { clickCount: 2 }, { clickCount: 3 }])).toBe(10)
  })

  it('returns zero for an empty series', () => {
    expect(totalClicks([])).toBe(0)
  })
})

describe('sumLastHours', () => {
  it('sums only the trailing entries of a dense series', () => {
    const series = [
      { clickCount: 100 }, // outside the window
      { clickCount: 1 },
      { clickCount: 2 },
      { clickCount: 3 },
    ]
    expect(sumLastHours(series, 3)).toBe(6)
  })

  it('sums the whole series when it is shorter than the window', () => {
    expect(sumLastHours([{ clickCount: 4 }, { clickCount: 5 }], 24)).toBe(9)
  })

  it('returns zero for an empty series', () => {
    expect(sumLastHours([], 24)).toBe(0)
  })
})
