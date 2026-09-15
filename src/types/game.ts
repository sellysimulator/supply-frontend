import { z } from 'zod'

/**
 * The catalog's domain model. One schema drives the admin form's validation,
 * the database write path, and the TypeScript types the whole app reads, so
 * the three cannot drift apart.
 */

/** A slug like `beer-game`: lowercase, digits and single hyphens. */
export const gameIdSchema = z
  .string()
  .min(2, 'Identifier must be at least 2 characters')
  .max(60, 'Identifier must be 60 characters or fewer')
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    'Use lowercase letters, numbers and single hyphens (for example: beer-game)',
  )

const httpsUrl = z
  .string()
  .url('Enter a full URL')
  .refine((value) => value.startsWith('https://'), 'URL must start with https://')

export const storedImageSchema = z.object({
  /** Storage object path, kept so the file can be deleted with the game. */
  path: z.string(),
  url: z.string().url(),
})

export const resourceSchema = z.object({
  label: z.string().min(1, 'Give the resource a label'),
  url: httpsUrl,
})

/** The editable fields — what the admin form produces. */
export const gameInputSchema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  shortDescription: z
    .string()
    .min(10, 'Write at least a short sentence')
    .max(200, 'Keep the catalog summary under 200 characters'),
  fullDescription: z.string().min(20, 'Describe the game for its details page'),
  learningObjectives: z.array(z.string().min(1)).default([]),
  audience: z.string().max(160).default(''),
  minPlayers: z.number().int().min(1, 'At least 1 player'),
  maxPlayers: z.number().int().min(1),
  durationMinutes: z.number().int().min(1, 'Estimated duration in minutes'),
  categories: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  resources: z.array(resourceSchema).default([]),
  thumbnail: storedImageSchema.nullable().default(null),
  screenshots: z.array(storedImageSchema).default([]),
  launchUrl: httpsUrl,
  published: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
})

export const gameFormSchema = gameInputSchema.refine((game) => game.maxPlayers >= game.minPlayers, {
  message: 'Maximum players must be greater than or equal to minimum',
  path: ['maxPlayers'],
})

export type GameInput = z.infer<typeof gameInputSchema>
export type StoredImage = z.infer<typeof storedImageSchema>
export type GameResource = z.infer<typeof resourceSchema>

/** A catalog entry as read back from the database. */
export type Game = GameInput & {
  id: string
  createdAt: Date | null
  updatedAt: Date | null
}

/** Defaults for a blank "add game" form. */
export const emptyGameInput: GameInput = {
  name: '',
  shortDescription: '',
  fullDescription: '',
  learningObjectives: [],
  audience: '',
  minPlayers: 1,
  maxPlayers: 4,
  durationMinutes: 60,
  categories: [],
  tags: [],
  resources: [],
  thumbnail: null,
  screenshots: [],
  launchUrl: '',
  published: false,
  sortOrder: 0,
}

export function playerRangeLabel(game: Pick<Game, 'minPlayers' | 'maxPlayers'>): string {
  if (game.minPlayers === game.maxPlayers) {
    return `${game.minPlayers} player${game.minPlayers === 1 ? '' : 's'}`
  }
  return `${game.minPlayers}–${game.maxPlayers} players`
}

export function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}
