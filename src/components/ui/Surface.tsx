import type { ElementType, HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export type SurfaceTone = 'surface' | 'muted'

const TONES: Record<SurfaceTone, string> = {
  surface: 'bg-surface border-border',
  muted: 'bg-muted border-muted',
}

/**
 * An inset panel inside a tile. This is what gives the page its levels: the
 * canvas holds a tile, the tile holds a surface, the surface holds chips — three
 * backgrounds a reader can actually tell apart. Never carries a shadow; a tile
 * lifts, an inset recedes.
 */
export function Surface({
  tone = 'surface',
  as: As = 'div',
  className,
  ...props
}: HTMLAttributes<HTMLElement> & { tone?: SurfaceTone; as?: ElementType }) {
  return <As className={cn('rounded-md border', TONES[tone], className)} {...props} />
}
