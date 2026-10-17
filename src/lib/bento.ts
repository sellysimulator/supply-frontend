/**
 * The bento grid: a 12-column board whose tiles have deliberately uneven spans.
 *
 * An even grid kills the concept, so spans follow a repeating rhythm rather than
 * a single width. The last row is widened until it fills all twelve columns, so
 * filtering the catalog never leaves a ragged hole in the composition.
 */

/** Column spans, repeated in order. Every full row of the pattern sums to 12. */
export const BENTO_PATTERN = [6, 3, 3, 4, 4, 4] as const

/**
 * Tailwind v4's scanner reads source files as plain text and never evaluates
 * JavaScript, so a template literal like `lg:col-span-${n}` compiles to nothing.
 * These maps are the safelist — every class the grid can emit appears here as a
 * literal string, in a file Tailwind scans. Keep them literal.
 */
export const LG_COL_SPAN = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12',
} as const satisfies Record<number, string>

/** At the six-column breakpoint tiles go two up, and a featured tile goes full. */
export const SM_COL_SPAN = {
  3: 'sm:col-span-3',
  6: 'sm:col-span-6',
} as const satisfies Record<number, string>

const clampSpan = (span: number) => Math.min(12, Math.max(1, Math.round(span)))

/**
 * Spans for `count` tiles laid out on the pattern.
 *
 *   computeSpans(1) → [12]
 *   computeSpans(2) → [8, 4]
 *   computeSpans(9) → [6, 3, 3, 4, 4, 4, 4, 4, 4]
 */
export function computeSpans(count: number, pattern: readonly number[] = BENTO_PATTERN): number[] {
  if (count <= 0 || pattern.length === 0) return []

  const spans: number[] = []
  for (let index = 0; index < count; index += 1) {
    spans.push(pattern[index % pattern.length] ?? 4)
  }

  /* Group the spans into rows of at most twelve columns, so the final — possibly
     partial — row can be identified and stretched. */
  const rows: number[][] = []
  let row: number[] = []
  let used = 0

  spans.forEach((span, index) => {
    if (used + span > 12) {
      rows.push(row)
      row = []
      used = 0
    }
    row.push(index)
    used += span
  })
  if (row.length > 0) rows.push(row)

  const last = rows[rows.length - 1]
  if (last && last.length > 0) {
    let total = last.reduce((sum, index) => sum + (spans[index] ?? 0), 0)
    let cursor = 0
    while (total < 12) {
      const target = last[cursor % last.length] ?? 0
      spans[target] = (spans[target] ?? 0) + 1
      total += 1
      cursor += 1
    }
  }

  return spans
}

/**
 * The full responsive class string for one tile: full width on phones, two up at
 * the six-column breakpoint, and its computed span on the twelve-column board.
 */
export function tileSpanClasses(span: number, featured = false): string {
  const lg = LG_COL_SPAN[clampSpan(span) as keyof typeof LG_COL_SPAN]
  const sm = featured ? SM_COL_SPAN[6] : SM_COL_SPAN[3]
  return `${sm} ${lg}`
}
