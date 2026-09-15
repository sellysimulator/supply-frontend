import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Input } from './Input'

/**
 * Edits a string[] field (categories, tags, learning objectives) as removable
 * chips. Commits on Enter or comma; Backspace on an empty box removes the last
 * entry.
 */
export function TagInput({
  value,
  onChange,
  id,
  describedBy,
  placeholder,
}: {
  value: string[]
  onChange: (next: string[]) => void
  id?: string
  describedBy?: string
  placeholder?: string
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')

  const commit = () => {
    const entry = draft.trim()
    if (!entry || value.includes(entry)) {
      setDraft('')
      return
    }
    onChange([...value, entry])
    setDraft('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        id={id}
        aria-describedby={describedBy}
        value={draft}
        placeholder={placeholder ?? t('tagInput.placeholder')}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
      />
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((entry) => (
            <li key={entry}>
              <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted py-0.5 pr-1 pl-2 text-xs text-foreground">
                {entry}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((item) => item !== entry))}
                  aria-label={t('tagInput.remove', { entry })}
                  className="cursor-pointer rounded-sm p-0.5 text-muted-foreground transition-colors duration-200 hover:bg-card hover:text-destructive"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
