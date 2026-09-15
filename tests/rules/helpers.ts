import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'

export const PROJECT_ID = 'supply-rules-test'
export const ADMIN_UID = 'admin-uid'
export const VISITOR_UID = 'visitor-uid'
export const ADMIN_EMAIL = 'sellysimulator@gmail.com'

export async function createTestEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
    storage: {
      rules: readFileSync('storage.rules', 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
  })
}

/** The top of the current hour — what the client writes and the rules require. */
export function currentHour(): Date {
  const now = new Date()
  now.setUTCMinutes(0, 0, 0)
  return now
}

export function counterId(gameId: string, hour: Date = currentHour()): string {
  return `${gameId}_${hour.toISOString().slice(0, 13)}`
}

/** A catalog document that satisfies every field rule in firestore.rules. */
export function validGame(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Beer Game',
    shortDescription: 'The classic supply chain simulation.',
    fullDescription: 'A longer description of the beer distribution game and its dynamics.',
    learningObjectives: ['Understand the bullwhip effect'],
    audience: 'Undergraduate students',
    minPlayers: 4,
    maxPlayers: 4,
    durationMinutes: 90,
    categories: ['Simulation'],
    tags: ['bullwhip'],
    resources: [],
    thumbnail: null,
    screenshots: [],
    launchUrl: 'https://example.com/beer-game',
    published: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}
