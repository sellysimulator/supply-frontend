import { describe, expect, it } from 'vitest'
import { BENTO_PATTERN, computeSpans, tileSpanClasses } from '../lib/bento'

/* Group a span list back into the rows the grid will lay out. */
const rowsOf = (spans: number[]): number[][] => {
  const rows: number[][] = []
  let row: number[] = []
  let used = 0
  for (const span of spans) {
    if (used + span > 12) {
      rows.push(row)
      row = []
      used = 0
    }
    row.push(span)
    used += span
  }
  if (row.length > 0) rows.push(row)
  return rows
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

describe('computeSpans', () => {
  it('returns nothing for an empty catalog', () => {
    expect(computeSpans(0)).toEqual([])
    expect(computeSpans(-3)).toEqual([])
  })

  it('gives a lone tile the whole row', () => {
    expect(computeSpans(1)).toEqual([12])
  })

  it('fills every row, including the last, for any count', () => {
    for (let count = 1; count <= 24; count += 1) {
      const rows = rowsOf(computeSpans(count))
      for (const row of rows) {
        expect({ count, row, total: sum(row) }).toMatchObject({ total: 12 })
      }
    }
  })

  it('keeps every span inside the twelve-column board', () => {
    for (let count = 1; count <= 24; count += 1) {
      for (const span of computeSpans(count)) {
        expect(span).toBeGreaterThanOrEqual(1)
        expect(span).toBeLessThanOrEqual(12)
      }
    }
  })

  it('follows the pattern once there are enough tiles to close a row', () => {
    expect(computeSpans(6)).toEqual([...BENTO_PATTERN])
  })
})

describe('tileSpanClasses', () => {
  it('emits literal span classes Tailwind can compile', () => {
    expect(tileSpanClasses(4)).toBe('sm:col-span-3 lg:col-span-4')
    expect(tileSpanClasses(6, true)).toBe('sm:col-span-6 lg:col-span-6')
  })

  it('clamps a span that would fall outside the board', () => {
    expect(tileSpanClasses(0)).toBe('sm:col-span-3 lg:col-span-1')
    expect(tileSpanClasses(99)).toBe('sm:col-span-3 lg:col-span-12')
  })
})
