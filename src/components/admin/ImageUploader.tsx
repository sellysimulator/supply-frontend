import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImagePlus, Trash2 } from 'lucide-react'
import { Button, Spinner } from '../ui'
import { deleteCatalogImage, uploadCatalogImage } from '../../data/images'
import type { StoredImage } from '../../types/game'

/**
 * Uploads catalog images to `games/{gameId}/…`, the only path storage.rules
 * permits. Uploading requires the identifier to exist first, because it decides
 * where the file lands.
 */
export function ImageUploader({
  gameId,
  images,
  onChange,
  multiple = false,
  label,
}: {
  gameId: string
  images: StoredImage[]
  onChange: (next: StoredImage[]) => void
  multiple?: boolean
  label: string
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const disabled = gameId.trim() === ''

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    setError(null)
    try {
      // Uploads are independent, so they run concurrently; `Promise.all`
      // preserves the order the files were selected in.
      const uploaded = await Promise.all(
        Array.from(files).map((file) => uploadCatalogImage(gameId, file)),
      )
      onChange(multiple ? [...images, ...uploaded] : (uploaded.slice(-1) as StoredImage[]))
    } catch {
      setError(t('admin.images.uploadFailed'))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  /* The stored file is removed as well as the reference, so unpublishing an
     image does not leave an orphan in the bucket. A failed delete still drops
     the reference — a stale object is harmless, a broken link is not. */
  const removeImage = async (image: StoredImage) => {
    onChange(images.filter((entry) => entry.path !== image.path))
    try {
      await deleteCatalogImage(image)
    } catch {
      /* ignored on purpose */
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple={multiple}
          onChange={(event) => void onFiles(event.target.files)}
          className="sr-only"
          id={`upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
        />
        <Button
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
        >
          {busy ? <Spinner /> : <ImagePlus size={16} aria-hidden="true" />}
          {busy
            ? t('admin.images.uploading')
            : t(multiple ? 'admin.images.addImages' : 'admin.images.chooseImage')}
        </Button>
        {disabled && (
          <p className="text-xs text-muted-foreground">{t('admin.images.identifierFirst')}</p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <li key={image.path} className="relative">
              <img
                src={image.url}
                alt=""
                className="aspect-video w-full rounded-md border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => void removeImage(image)}
                aria-label={t('admin.images.remove')}
                className="absolute top-1.5 right-1.5 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors duration-200 hover:border-destructive hover:text-destructive"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
