import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type StatTone = 'default' | 'onFeatured'

/**
 * A single headline number. When the story is one value, a tile is the correct
 * form — a one-bar chart is not.
 *
 * Renders bare so the caller supplies the tile, which lets the same component
 * serve the landing hero band and the admin dashboard.
 */
export function Stat({
  value,
  label,
  hint,
  icon,
  tone = 'default',
  className,
}: {
  value: ReactNode
  label: string
  hint?: string
  icon?: ReactNode
  tone?: StatTone
  className?: string
}) {
  const muted = tone === 'onFeatured' ? 'text-on-featured-muted' : 'text-muted-foreground'
  const figure = tone === 'onFeatured' ? 'text-on-featured' : 'text-foreground'

  return (
    <div className={cn('flex h-full flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className={cn('text-xs font-medium tracking-wide', muted)}>{label}</p>
        {icon && <span className={muted}>{icon}</span>}
      </div>
      {/* The figure wears a text token and the display face — never a series
          color, and never a synthesised weight: Quicksand ships 600 and 700. */}
      <p
        className={cn(
          'font-display text-4xl font-bold tracking-[-0.03em] tabular-nums sm:text-5xl',
          'leading-none',
          figure,
        )}
      >
        {value}
      </p>
      {hint && <p className={cn('mt-auto pt-1 text-xs', muted)}>{hint}</p>}
    </div>
  )
}
