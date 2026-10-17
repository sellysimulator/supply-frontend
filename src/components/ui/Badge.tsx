import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'muted' | 'onFeatured'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface text-muted-foreground border-border',
  primary: 'bg-primary-subtle text-primary border-primary-line',
  success: 'bg-success-subtle text-success border-success-subtle',
  muted: 'bg-muted text-muted-foreground border-muted',
  /* For chips sitting on a filled `featured` tile. */
  onFeatured: 'bg-on-featured/15 text-on-featured border-on-featured-line',
}

/** Small rounded chip. Used for categories, tags and publication state. */
export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
