import { describe, expect, it } from 'vitest'
import {
  durationLabel,
  gameFormSchema,
  gameIdSchema,
  emptyGameInput,
  playerRangeLabel,
} from '../types/game'

describe('game identifier', () => {
  it.each(['beer-game', 'selly', 'game-2', 'a1'])('accepts %s', (slug) => {
    expect(gameIdSchema.safeParse(slug).success).toBe(true)
  })

  it.each([
    ['Beer Game', 'spaces and capitals'],
    ['beer_game', 'underscores, which would break the analytics document id'],
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

describe('display labels', () => {
  it('collapses an equal player range to a single figure', () => {
    expect(playerRangeLabel({ minPlayers: 4, maxPlayers: 4 })).toBe('4 players')
    expect(playerRangeLabel({ minPlayers: 1, maxPlayers: 1 })).toBe('1 player')
  })

  it('shows a range when the counts differ', () => {
    expect(playerRangeLabel({ minPlayers: 2, maxPlayers: 6 })).toBe('2–6 players')
  })

  it('formats durations in minutes and hours', () => {
    expect(durationLabel(45)).toBe('45 min')
    expect(durationLabel(120)).toBe('2 h')
    expect(durationLabel(90)).toBe('1 h 30 min')
  })
})
