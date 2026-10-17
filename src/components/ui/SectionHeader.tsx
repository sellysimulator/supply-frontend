import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * The heading block that opens a tile or a page: an optional eyebrow chip, a
 * display-face title, a line of description, and actions or a live count pushed
 * to the right. Every section in the application uses this rather than assembling
 * its own heading row.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  id,
  level = 2,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  id?: string
  level?: 1 | 2 | 3
  className?: string
}) {
  const Heading = `h${level}` as 'h1' | 'h2' | 'h3'
  const size =
    level === 1
      ? 'text-3xl sm:text-4xl'
      : level === 2
        ? 'text-2xl sm:text-[1.75rem]'
        : 'text-lg sm:text-xl'

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6',
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        {eyebrow && (
          <p className="inline-flex w-fit items-center rounded-sm bg-primary-subtle px-3 py-1.5 text-xs font-medium tracking-wide text-primary">
            {eyebrow}
          </p>
        )}
        <Heading
          id={id}
          className={cn('font-display font-semibold tracking-[-0.02em] text-foreground', size)}
        >
          {title}
        </Heading>
        {description && (
          <p className="max-w-2xl leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
