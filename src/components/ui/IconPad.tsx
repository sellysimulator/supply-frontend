import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type IconPadSize = 'sm' | 'md' | 'lg'
export type IconPadTone = 'primary' | 'muted' | 'onFeatured'

const SIZES: Record<IconPadSize, string> = {
  sm: 'h-8 w-8 rounded-sm text-xs',
  md: 'h-10 w-10 rounded-md text-sm',
  lg: 'h-12 w-12 rounded-md text-base',
}

const TONES: Record<IconPadTone, string> = {
  primary: 'bg-primary-subtle text-primary',
  muted: 'bg-surface text-muted-foreground border border-border',
  onFeatured: 'bg-on-featured text-featured',
}

/**
 * The rounded square that anchors a tile — an icon or a pair of initials in a
 * brand wash. Always decorative: the label it belongs to sits beside it, so the
 * pad itself is hidden from assistive technology.
 */
export function IconPad({
  children,
  size = 'md',
  tone = 'primary',
  className,
}: {
  children: ReactNode
  size?: IconPadSize
  tone?: IconPadTone
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-display font-bold',
        SIZES[size],
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
