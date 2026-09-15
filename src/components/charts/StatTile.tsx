import type { ReactNode } from 'react'
import { Card } from '../ui'

/**
 * A single headline number. When the story is one value, a tile is the correct
 * form — a one-bar chart is not.
 */
export function StatTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
}) {
  return (
    <Card className="h-full">
      <div className="flex h-full flex-col gap-1.5 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        {/* The figure wears a text token and the body face — never a series
            color or a display face. */}
        <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        {hint && <p className="mt-auto text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  )
}
