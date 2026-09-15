import { cn } from '../../lib/cn'

/** Indeterminate loading indicator. Motion stays subtle and respects
 *  prefers-reduced-motion via the global rule in index.css. */
export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary',
        className,
      )}
    />
  )
}

/** Full-section loading state, so pages don't each invent their own. */
export function LoadingSection({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
      <Spinner label={label} />
      <span>{label}…</span>
    </div>
  )
}
