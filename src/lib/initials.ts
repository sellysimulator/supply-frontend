/**
 * Two initials for a game, used as its drawn thumbnail. Articles are dropped so
 * "The Forecast Room" reads as FR rather than TF, and diacritics are folded so a
 * name like "Ópera" yields a plain letter.
 */
export function initials(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z ]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 0 && word.toLowerCase() !== 'the')
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('') || '?'
  )
}
