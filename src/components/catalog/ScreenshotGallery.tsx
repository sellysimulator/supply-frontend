import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../ui'
import type { StoredImage } from '../../types/game'

/** Screenshots as a responsive grid; selecting one opens it at full size. */
export function ScreenshotGallery({
  screenshots,
  gameName,
}: {
  screenshots: StoredImage[]
  gameName: string
}) {
  const { t } = useTranslation()
  const [active, setActive] = useState<StoredImage | null>(null)

  if (screenshots.length === 0) return null

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {screenshots.map((shot, index) => (
          <li key={shot.path}>
            <button
              type="button"
              onClick={() => setActive(shot)}
              className="block w-full cursor-pointer overflow-hidden rounded-md border border-border bg-muted transition-colors duration-200 hover:border-primary"
            >
              <img
                src={shot.url}
                alt={t('game.screenshotAlt', { name: gameName, index: index + 1 })}
                loading="lazy"
                className="aspect-video w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        title={t('game.screenshotTitle', { name: gameName })}
        className="max-w-4xl"
      >
        {active && (
          <img
            src={active.url}
            alt={t('game.screenshotTitle', { name: gameName })}
            className="w-full rounded-md"
          />
        )}
      </Modal>
    </>
  )
}
