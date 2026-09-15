import { afterAll, describe, expect, it } from 'vitest'
import i18n, { SUPPORTED_LANGUAGES } from '../i18n'
import { durationLabel, playerRangeLabel } from '../i18n/format'
import en from '../i18n/locales/en.json'
import es from '../i18n/locales/es.json'

type Tree = { [key: string]: string | Tree }

function flatten(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value === 'string' ? [path] : flatten(value, path)
  })
}

/* A missing key falls back silently to English, which is exactly the kind of
   half-translated page that ships unnoticed — so the key sets are compared
   instead of trusted. */
describe('translation catalogs', () => {
  const englishKeys = flatten(en as Tree).sort()
  const spanishKeys = flatten(es as Tree).sort()

  it('covers every supported language', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['en', 'es'])
  })

  it('defines the same keys in both languages', () => {
    expect(spanishKeys).toEqual(englishKeys)
  })

  it('leaves no empty strings behind', () => {
    for (const [language, tree] of [
      ['en', en],
      ['es', es],
    ] as const) {
      for (const key of flatten(tree as Tree)) {
        const value = key.split('.').reduce<unknown>((node, part) => {
          return (node as Record<string, unknown>)[part]
        }, tree)
        expect(value, `${language}:${key}`).not.toBe('')
      }
    }
  })
})

describe('display labels', () => {
  const t = i18n.getFixedT('en')

  it('collapses an equal player range to a single figure', () => {
    expect(playerRangeLabel(t, { minPlayers: 4, maxPlayers: 4 })).toBe('4 players')
    expect(playerRangeLabel(t, { minPlayers: 1, maxPlayers: 1 })).toBe('1 player')
  })

  it('shows a range when the counts differ', () => {
    expect(playerRangeLabel(t, { minPlayers: 2, maxPlayers: 6 })).toBe('2–6 players')
  })

  it('formats durations in minutes and hours', () => {
    expect(durationLabel(t, 45)).toBe('45 min')
    expect(durationLabel(t, 120)).toBe('2 h')
    expect(durationLabel(t, 90)).toBe('1 h 30 min')
  })

  it('translates the same figures into Spanish', () => {
    const es = i18n.getFixedT('es')
    expect(playerRangeLabel(es, { minPlayers: 1, maxPlayers: 1 })).toBe('1 jugador')
    expect(playerRangeLabel(es, { minPlayers: 2, maxPlayers: 6 })).toBe('2–6 jugadores')
    expect(durationLabel(es, 90)).toBe('1 h 30 min')
  })

  afterAll(async () => {
    await i18n.changeLanguage('en')
  })
})
