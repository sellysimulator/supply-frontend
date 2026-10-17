import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/**
 * A tile. Every panel in the application is one of these: a 24px rounded surface
 * lifted off the canvas by a soft two-layer shadow and outlined by a single
 * hairline. `elevation` chooses how far off the canvas it sits, and `interactive`
 * adds the 200ms hover lift.
 *
 * `featured` is the one accented surface — a filled blue tile. It sets its own
 * text color on the container so nothing inside it can reach for
 * `text-muted-foreground`, which has no contrast against the fill.
 */
export type CardElevation = 'flat' | 'tile' | 'featured'

const ELEVATIONS: Record<CardElevation, string> = {
  flat: 'border-border bg-card',
  tile: 'border-border bg-card shadow-tile',
  featured: 'border-featured bg-featured text-on-featured shadow-tile',
}

export function Card({
  elevation = 'tile',
  interactive = false,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  elevation?: CardElevation
  interactive?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg border',
        ELEVATIONS[elevation],
        interactive && 'tile-hover',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-border px-5 py-4', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('font-display text-base font-semibold text-foreground', className)}
      {...props}
    />
  )
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)} {...props} />
}

/** A hairline-separated footer row, for the meta-and-action line on a tile. */
export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-t border-border px-5 py-3', className)} {...props} />
}
