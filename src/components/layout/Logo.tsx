import { cn } from '../../lib/cn'

/** Flat mark: three stacked lines suggesting a chain of stages. No gradients. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden="true" focusable="false">
        <rect width="32" height="32" rx="6" className="fill-primary" />
        <path
          d="M9 11h14M9 16h14M9 21h9"
          stroke="currentColor"
          className="text-on-primary"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-lg font-semibold tracking-tight text-foreground">Supply</span>
    </span>
  )
}
