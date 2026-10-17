import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * One category filter. The pressed state is carried by a check mark as well as
 * the fill, so it never depends on color alone. The icon is decorative — the
 * button's accessible name stays the bare category label.
 */
export function FilterChip({
  label,
  pressed,
  onPress,
  className,
}: {
  label: string
  pressed: boolean
  onPress: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onPress}
      className={cn(
        'inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-sm border px-4 text-sm font-medium transition-colors duration-150',
        pressed
          ? 'border-primary bg-primary text-on-primary'
          : 'border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground',
        className,
      )}
    >
      {pressed && <Check size={14} aria-hidden="true" className="shrink-0" />}
      {label}
    </button>
  )
}
