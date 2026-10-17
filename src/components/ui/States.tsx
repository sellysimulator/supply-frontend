import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Inbox, TriangleAlert } from 'lucide-react'
import { Card } from './Card'
import { IconPad } from './IconPad'

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
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <IconPad size="lg">
        <Inbox size={22} />
      </IconPad>
      <p className="font-display text-lg font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  )
}

/** Shown when a query fails. Always offers a way forward. */
export function ErrorState({
  title,
  description,
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <Card className="flex flex-col items-center gap-3 border-destructive/30 px-6 py-14 text-center">
      <IconPad size="lg" tone="muted" className="text-destructive">
        <TriangleAlert size={22} />
      </IconPad>
      <p className="font-display text-lg font-semibold text-destructive">
        {title ?? t('common.somethingWentWrong')}
      </p>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  )
}
