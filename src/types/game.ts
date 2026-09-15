import { z } from 'zod'

/**
 * The catalog's domain model. One schema drives the admin form's validation,
 * the database write path, and the TypeScript types the whole app reads, so
 * the three cannot drift apart.
 *
 * Validation messages are translation keys, not sentences: the form resolves
 * them through `t()` when it renders an error, so the same schema serves every
 * language. See src/i18n/locales/*.json, `validation.*`.
 */

/** A slug like `beer-game`: lowercase, digits and single hyphens. */
export const gameIdSchema = z
  .string()
  .min(2, 'validation.identifierMin')
  .max(60, 'validation.identifierMax')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'validation.identifierFormat')

const httpsUrl = z
  .string()
  .url('validation.urlFull')
  .refine((value) => value.startsWith('https://'), 'validation.urlHttps')

const wholeNumber = (message: string) =>
  z
    .number({
      required_error: 'validation.numberRequired',
      invalid_type_error: 'validation.numberRequired',
    })
    .int('validation.numberRequired')
    .min(1, message)

export const storedImageSchema = z.object({
  /** Storage object path, kept so the file can be deleted with the game. */
  path: z.string(),
  url: z.string().url(),
})

export const resourceSchema = z.object({
  label: z.string().min(1, 'validation.resourceLabel'),
  url: httpsUrl,
})

/** The editable fields — what the admin form produces. */
export const gameInputSchema = z.object({
  name: z.string().min(2, 'validation.nameRequired').max(120, 'validation.nameMax'),
  shortDescription: z
    .string()
    .min(10, 'validation.shortDescriptionMin')
    .max(200, 'validation.shortDescriptionMax'),
  fullDescription: z.string().min(20, 'validation.fullDescriptionMin'),
  learningObjectives: z.array(z.string().min(1)).default([]),
  audience: z.string().max(160, 'validation.audienceMax').default(''),
  minPlayers: wholeNumber('validation.minPlayers'),
  maxPlayers: wholeNumber('validation.maxPlayers'),
  durationMinutes: wholeNumber('validation.duration'),
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
  message: 'validation.maxBelowMin',
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
