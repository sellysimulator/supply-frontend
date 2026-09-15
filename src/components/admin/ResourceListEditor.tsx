import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input } from '../ui'
import type { GameResource } from '../../types/game'

/** Edits the list of instruction links and supporting material. */
export function ResourceListEditor({
  resources,
  onChange,
}: {
  resources: GameResource[]
  onChange: (next: GameResource[]) => void
}) {
  const { t } = useTranslation()

  const update = (index: number, patch: Partial<GameResource>) => {
    onChange(resources.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)))
  }

  return (
    <div className="flex flex-col gap-3">
      {resources.map((resource, index) => (
        <div key={index} className="flex flex-col gap-2 sm:flex-row">
          <Input
            aria-label={t('admin.resources.labelField', { index: index + 1 })}
            placeholder={t('admin.resources.labelPlaceholder')}
            value={resource.label}
            onChange={(event) => update(index, { label: event.target.value })}
            className="sm:w-1/3"
          />
          <Input
            aria-label={t('admin.resources.urlField', { index: index + 1 })}
            placeholder={t('admin.resources.urlPlaceholder')}
            value={resource.url}
            onChange={(event) => update(index, { url: event.target.value })}
            className="flex-1"
          />
          <Button
            variant="destructive"
            onClick={() => onChange(resources.filter((_, i) => i !== index))}
            aria-label={t('admin.resources.remove', { index: index + 1 })}
            className="sm:w-11 sm:px-0"
          >
            <Trash2 size={15} aria-hidden="true" />
          </Button>
        </div>
      ))}

      <Button
        variant="secondary"
        className="w-fit"
        onClick={() => onChange([...resources, { label: '', url: '' }])}
      >
        <Plus size={16} aria-hidden="true" />
        {t('admin.resources.add')}
      </Button>
    </div>
  )
}
