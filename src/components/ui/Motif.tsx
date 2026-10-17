import { cn } from '../../lib/cn'

export type MotifVariant = 'network' | 'rings' | 'route'

/**
 * Drawn brand imagery. The catalog ships no decorative image assets — where the
 * design wants a motif it is a hairline inline SVG in `currentColor`, so it
 * follows the palette, costs no request, and cannot go missing.
 *
 * Always `aria-hidden` and never `role="img"`: these are pure decoration, and a
 * motif that announced itself would land in the accessible name of whatever tile
 * or dialog it decorates.
 */
export function Motif({ variant, className }: { variant: MotifVariant; className?: string }) {
  const shared = {
    'aria-hidden': true as const,
    focusable: 'false' as const,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: cn('pointer-events-none', className),
  }

  if (variant === 'network') {
    /* An isometric node-and-link diagram: three stages, connected, with the
       nodes themselves picked out in the brand hue. */
    return (
      <svg viewBox="0 0 240 150" {...shared}>
        <path d="M14 75 54 55 94 75 54 95Z" />
        <path d="M132 40 172 20 212 40 172 60Z" />
        <path d="M132 110 172 90 212 110 172 130Z" />
        <path d="M54 95v14M172 60v14M172 130v8" />
        <path d="M94 75 132 55M94 75 132 95" />
        <g className="text-primary" stroke="none" fill="currentColor">
          <circle cx="54" cy="75" r="5" />
          <circle cx="172" cy="40" r="5" />
          <circle cx="172" cy="110" r="5" />
        </g>
      </svg>
    )
  }

  if (variant === 'rings') {
    return (
      <svg viewBox="0 0 160 160" {...shared}>
        <circle cx="80" cy="80" r="26" />
        <circle cx="80" cy="80" r="48" />
        <circle cx="80" cy="80" r="70" />
        <path d="M80 10v140M10 80h140" />
        <path d="m70 44 10-10 10 10M116 70l10 10-10 10M90 116l-10 10-10-10M44 90 34 80l10-10" />
      </svg>
    )
  }

  /* route */
  return (
    <svg viewBox="0 0 200 120" {...shared}>
      <path d="M16 96c24 0 24-36 48-36s24 36 48 36 24-60 48-60" />
      <path d="M16 24h40M144 108h40" strokeDasharray="6 8" />
      <g className="text-primary" stroke="none" fill="currentColor">
        <circle cx="16" cy="96" r="5" />
        <circle cx="112" cy="96" r="5" />
        <circle cx="184" cy="36" r="5" />
      </g>
    </svg>
  )
}
