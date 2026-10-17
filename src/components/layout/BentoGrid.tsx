import type { ElementType, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { tileSpanClasses } from '../../lib/bento'
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'

/**
 * The board: one twelve-column grid that every tile on a page shares. Collapses
 * to six columns at `sm` and a single column below, so the composition survives
 * a 375px viewport.
 */
export function BentoGrid({
  as: As = 'div',
  rows = false,
  className,
  children,
  ...rest
}: {
  as?: ElementType
  /** Fixed 120px auto-rows, for bands whose tiles should share a height. */
  rows?: boolean
  className?: string
  children: ReactNode
  'aria-label'?: string
  'aria-labelledby'?: string
  id?: string
}) {
  return (
    <As
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-6 lg:grid-cols-12',
        rows && 'sm:auto-rows-[minmax(7.5rem,auto)]',
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  )
}

/**
 * One tile on the board. Owns the column span, the scroll reveal and the stagger,
 * so no page ever writes a `col-span-*` class or touches the observer — this is
 * the single seam between the grid, the motion and the pages.
 */
export function BentoItem({
  as: As = 'div',
  span,
  index = 0,
  featured = false,
  reveal = true,
  rowSpan = false,
  className,
  children,
  ...rest
}: {
  as?: ElementType
  span: number
  /** Position in the stagger; the delay is capped so a long grid never crawls. */
  index?: number
  featured?: boolean
  reveal?: boolean
  rowSpan?: boolean
  className?: string
  children: ReactNode
  id?: string
}) {
  const { ref, revealed } = useRevealOnScroll<HTMLElement>({
    delayMs: Math.min(index, 6) * 40,
  })

  return (
    <As
      ref={reveal ? ref : undefined}
      className={cn(
        reveal && 'tile-enter',
        reveal && revealed && 'is-in',
        tileSpanClasses(span, featured),
        rowSpan && 'sm:row-span-2',
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  )
}
