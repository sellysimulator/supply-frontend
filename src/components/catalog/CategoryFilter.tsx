import { useTranslation } from 'react-i18next'
import { FilterChip } from '../ui'

/**
 * Filters are always visible rather than tucked behind a control — a directory
 * that hides its filters reads as a shorter catalog than it is. The row wraps; it
 * is never clipped into a horizontal scroller.
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
  const { t } = useTranslation()

  if (categories.length === 0) return null

  const options: { key: string; label: string; value: string | null }[] = [
    { key: '__all__', label: t('catalog.all'), value: null },
    ...categories.map((category) => ({ key: category, label: category, value: category })),
  ]

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium tracking-wide text-muted-foreground">
        {t('catalog.filterHeading')}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('catalog.filterLabel')}>
        {options.map((option) => (
          <FilterChip
            key={option.key}
            label={option.label}
            pressed={selected === option.value}
            onPress={() => onSelect(option.value)}
          />
        ))}
      </div>
    </div>
  )
}
