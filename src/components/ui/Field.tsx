import type { ReactNode } from 'react'
import { useId } from 'react'
import { cn } from '../../lib/cn'

/**
 * Every form row in the admin portal goes through this component, so labels,
 * helper text and error messages are positioned and announced identically —
 * the label is always visible (never a placeholder) and the error always sits
 * next to the field it belongs to.
 */
export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  /** Receives the ids to wire up `id` and `aria-describedby` on the control. */
  children: (ids: { id: string; describedBy: string | undefined }) => ReactNode
  className?: string
}) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {children({ id, describedBy })}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
