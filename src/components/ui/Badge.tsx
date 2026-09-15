import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'muted'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-card text-muted-foreground border-border',
  primary: 'bg-primary-subtle text-primary border-primary-subtle',
  success: 'bg-success-subtle text-success border-success-subtle',
  muted: 'bg-muted text-muted-foreground border-muted',
}

/** Small, squared-off label. Used for categories, tags and publication state. */
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
        'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
