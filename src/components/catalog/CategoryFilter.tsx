import { cn } from '../../lib/cn'

/**
 * Filters are always visible rather than tucked behind a control — a directory
 * that hides its filters reads as a shorter catalog than it is.
 */
export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories: string[]
  selected: string | null
  onSelect: (category: string | null) => void
}) {
  if (categories.length === 0) return null

  const options: { key: string; label: string; value: string | null }[] = [
    { key: '__all__', label: 'All', value: null },
    ...categories.map((category) => ({ key: category, label: category, value: category })),
  ]

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
      {options.map((option) => {
        const isActive = selected === option.value
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(option.value)}
            className={cn(
              'inline-flex h-9 cursor-pointer items-center rounded-md border px-3 text-sm font-medium transition-colors duration-200',
              isActive
                ? 'border-primary bg-primary text-on-primary'
                : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
