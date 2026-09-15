import type { ReactNode } from 'react'
import { Card } from './Card'

/** Shown when a query succeeds but returns nothing. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </Card>
  )
}

/** Shown when a query fails. Always offers a way forward. */
export function ErrorState({
  title = 'Something went wrong',
  description,
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <Card className="flex flex-col items-center gap-2 border-destructive/30 px-6 py-14 text-center">
      <p className="text-base font-semibold text-destructive">{title}</p>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </Card>
  )
}
