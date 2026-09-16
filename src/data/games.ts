import { supabase } from '../supabase/client'
import type { GameRow, GameWriteRow } from '../supabase/types'
import type { Game, GameInput, GameSummary, StoredImage } from '../types/game'

/**
 * Every catalog read and write. Pages and components call these functions
 * rather than the Supabase client, so column names and query shapes stay in one
 * place.
 */

const GAMES = 'games'

/**
 * The columns a catalog card needs — kept next to `toGameSummary` so the
 * PostgREST projection and the row-to-summary mapping cannot drift apart.
 * Deliberately excludes `full_description` (unbounded text) and the
 * `resources`/`screenshots` jsonb columns, which no card renders.
 */
const GAME_SUMMARY_COLUMNS =
  'id, name, short_description, audience, categories, min_players, max_players, duration_minutes, thumbnail, sort_order'

type GameSummaryRow = Pick<
  GameRow,
  | 'id'
  | 'name'
  | 'short_description'
  | 'audience'
  | 'categories'
  | 'min_players'
  | 'max_players'
  | 'duration_minutes'
  | 'thumbnail'
  | 'sort_order'
>

function toGameSummary(row: GameSummaryRow): GameSummary {
  return {
    id: row.id,
    name: row.name,
    shortDescription: row.short_description,
    audience: row.audience ?? '',
    categories: row.categories ?? [],
    minPlayers: row.min_players,
    maxPlayers: row.max_players,
    durationMinutes: row.duration_minutes,
    thumbnail: row.thumbnail,
    sortOrder: row.sort_order,
  }
}

function toGame(row: GameRow): Game {
  return {
    id: row.id,
    name: row.name,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    learningObjectives: row.learning_objectives ?? [],
    audience: row.audience ?? '',
    minPlayers: row.min_players,
    maxPlayers: row.max_players,
    durationMinutes: row.duration_minutes,
    categories: row.categories ?? [],
    tags: row.tags ?? [],
    resources: row.resources ?? [],
    thumbnail: row.thumbnail,
    screenshots: row.screenshots ?? [],
    launchUrl: row.launch_url,
    published: row.published,
    sortOrder: row.sort_order,
    createdAt: row.created_at ? new Date(row.created_at) : null,
    updatedAt: row.updated_at ? new Date(row.updated_at) : null,
  }
}

function toRow(gameId: string, input: GameInput): GameWriteRow {
  return {
    id: gameId,
    name: input.name,
    short_description: input.shortDescription,
    full_description: input.fullDescription,
    learning_objectives: input.learningObjectives,
    audience: input.audience,
    min_players: input.minPlayers,
    max_players: input.maxPlayers,
    duration_minutes: input.durationMinutes,
    categories: input.categories,
    tags: input.tags,
    resources: input.resources,
    thumbnail: input.thumbnail,
    screenshots: input.screenshots,
    launch_url: input.launchUrl,
    published: input.published,
    sort_order: input.sortOrder,
  }
}

/* ─── Public reads ──────────────────────────────────────────────────────────*/

/**
 * The public catalog, as the cards that list it render it. Unpublished entries
 * are filtered out by row level security, so this returns only what the caller
 * is allowed to see. `limit` bounds the row count for callers — like the
 * landing page — that only ever show the first few; the ordering matches the
 * `games_catalog_order_idx (published, sort_order, name)` index.
 */
export async function listPublishedGames(limit?: number): Promise<GameSummary[]> {
  let query = supabase
    .from(GAMES)
    .select(GAME_SUMMARY_COLUMNS)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (limit !== undefined) query = query.limit(limit)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(toGameSummary)
}

/**
 * A single catalog entry. Returns null both when the game does not exist and
 * when the caller may not see it — the public site should not distinguish
 * between the two.
 */
export async function getGame(gameId: string): Promise<Game | null> {
  const { data, error } = await supabase.from(GAMES).select('*').eq('id', gameId).maybeSingle()

  if (error || !data) return null
  return toGame(data)
}

/* ─── Administrator reads and writes ────────────────────────────────────────*/

/** Every entry, published or not. The policies allow this only for admins. */
export async function listAllGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from(GAMES)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(toGame)
}

export async function gameIdExists(gameId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from(GAMES)
    .select('id', { count: 'exact', head: true })
    .eq('id', gameId)

  if (error) throw new Error(error.message)
  return (count ?? 0) > 0
}

export async function createGame(gameId: string, input: GameInput): Promise<void> {
  const { error } = await supabase.from(GAMES).insert(toRow(gameId, input))
  if (error) throw new Error(error.message)
}

export async function updateGame(gameId: string, input: GameInput): Promise<void> {
  const { error } = await supabase.from(GAMES).update(toRow(gameId, input)).eq('id', gameId)
  if (error) throw new Error(error.message)
}

export async function setGamePublished(gameId: string, published: boolean): Promise<void> {
  const { error } = await supabase.from(GAMES).update({ published }).eq('id', gameId)
  if (error) throw new Error(error.message)
}

/**
 * Removes the catalog entry and the images it owns. The row goes first: if an
 * image delete fails the entry is still gone from the catalog and the leftover
 * file is harmless, whereas the reverse order could leave a published game
 * pointing at missing images.
 */
export async function deleteGame(game: Game): Promise<void> {
  const { error } = await supabase.from(GAMES).delete().eq('id', game.id)
  if (error) throw new Error(error.message)

  const images = [game.thumbnail, ...game.screenshots].filter(
    (image): image is StoredImage => image !== null,
  )
  if (images.length === 0) return

  const { deleteCatalogImages } = await import('./images')
  await deleteCatalogImages(images)
}
