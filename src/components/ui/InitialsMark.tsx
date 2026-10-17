import { initials } from '../../lib/initials'
import { IconPad, type IconPadSize, type IconPadTone } from './IconPad'

/**
 * The drawn thumbnail: a game's two initials set in the display face inside an
 * icon pad. Used wherever an entry has no uploaded image, so the grid never
 * falls back to a generic glyph that looks the same for every game.
 */
export function InitialsMark({
  name,
  size = 'md',
  tone = 'primary',
  className,
}: {
  name: string
  size?: IconPadSize
  tone?: IconPadTone
  className?: string
}) {
  return (
    <IconPad size={size} tone={tone} className={className}>
      {initials(name)}
    </IconPad>
  )
}
