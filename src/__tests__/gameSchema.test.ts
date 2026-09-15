import { describe, expect, it } from 'vitest'
import { emptyGameInput, gameFormSchema, gameIdSchema } from '../types/game'

describe('game identifier', () => {
  it.each(['beer-game', 'selly', 'game-2', 'a1'])('accepts %s', (slug) => {
    expect(gameIdSchema.safeParse(slug).success).toBe(true)
  })

  it.each([
    ['Beer Game', 'spaces and capitals'],
    ['beer_game', 'underscores, which the slug constraint rejects'],
    ['-beer', 'a leading hyphen'],
    ['beer--game', 'a doubled hyphen'],
    ['b', 'a single character'],
  ])('rejects %s (%s)', (slug) => {
    expect(gameIdSchema.safeParse(slug).success).toBe(false)
  })
})

describe('game form validation', () => {
  const valid = {
    ...emptyGameInput,
    name: 'Beer Game',
    shortDescription: 'The classic supply chain simulation.',
    fullDescription: 'A longer description of the beer distribution game.',
    launchUrl: 'https://example.com/beer-game',
  }

  it('accepts a complete entry', () => {
    expect(gameFormSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a launch URL that is not https, matching the security rules', () => {
    const result = gameFormSchema.safeParse({ ...valid, launchUrl: 'http://example.com/game' })
    expect(result.success).toBe(false)
  })

  it('rejects a maximum player count below the minimum', () => {
    const result = gameFormSchema.safeParse({ ...valid, minPlayers: 8, maxPlayers: 2 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['maxPlayers'])
    }
  })

  it('rejects a catalog summary that would overflow the card', () => {
    const result = gameFormSchema.safeParse({ ...valid, shortDescription: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })
})
