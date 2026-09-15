import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase/app'
import type { Game, GameInput, StoredImage } from '../types/game'

/**
 * Every Firestore and Storage access for the catalog lives here. Pages and
 * components call these functions rather than touching the SDK, so the query
 * shapes stay in step with firestore.rules — in particular the mandatory
 * `where('published', '==', true)` on public reads.
 */

const GAMES = 'games'

function toGame(snapshot: QueryDocumentSnapshot<DocumentData>): Game {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    name: data.name ?? '',
    shortDescription: data.shortDescription ?? '',
    fullDescription: data.fullDescription ?? '',
    learningObjectives: data.learningObjectives ?? [],
    audience: data.audience ?? '',
    minPlayers: data.minPlayers ?? 1,
    maxPlayers: data.maxPlayers ?? 1,
    durationMinutes: data.durationMinutes ?? 0,
    categories: data.categories ?? [],
    tags: data.tags ?? [],
    resources: data.resources ?? [],
    thumbnail: data.thumbnail ?? null,
    screenshots: data.screenshots ?? [],
    launchUrl: data.launchUrl ?? '',
    published: data.published ?? false,
    sortOrder: data.sortOrder ?? 0,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

/* ─── Public reads ──────────────────────────────────────────────────────────*/

/**
 * The public catalog. The `published` filter is not cosmetic: the security
 * rules reject any listing of `games` that is not constrained this way.
 */
export async function listPublishedGames(): Promise<Game[]> {
  const snapshot = await getDocs(
    query(
      collection(db, GAMES),
      where('published', '==', true),
      orderBy('sortOrder', 'asc'),
      orderBy('name', 'asc'),
    ),
  )
  return snapshot.docs.map(toGame)
}

/**
 * A single catalog entry. Returns null both when the game does not exist and
 * when it is unpublished — the rules deny the read in the second case, and the
 * public site should not distinguish between the two.
 */
export async function getGame(gameId: string): Promise<Game | null> {
  try {
    const snapshot = await getDoc(doc(db, GAMES, gameId))
    if (!snapshot.exists()) return null
    return toGame(snapshot as QueryDocumentSnapshot<DocumentData>)
  } catch {
    return null
  }
}

/* ─── Admin reads and writes ────────────────────────────────────────────────*/

/** Every entry, published or not. Allowed only for administrators. */
export async function listAllGames(): Promise<Game[]> {
  const snapshot = await getDocs(query(collection(db, GAMES), orderBy('sortOrder', 'asc')))
  return snapshot.docs.map(toGame)
}

export async function gameIdExists(gameId: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, GAMES, gameId))
  return snapshot.exists()
}

export async function createGame(gameId: string, input: GameInput): Promise<void> {
  await setDoc(doc(db, GAMES, gameId), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateGame(gameId: string, input: GameInput): Promise<void> {
  // `createdAt` is deliberately omitted: the rules require it to survive
  // unchanged, and leaving it out lets the stored value carry over.
  await updateDoc(doc(db, GAMES, gameId), { ...input, updatedAt: serverTimestamp() })
}

export async function setGamePublished(gameId: string, published: boolean): Promise<void> {
  await updateDoc(doc(db, GAMES, gameId), { published, updatedAt: serverTimestamp() })
}

/**
 * Removes the catalog entry and the images it owns. The Firestore document goes
 * first: if an image delete fails the entry is still gone from the catalog, and
 * the leftover file is harmless. The reverse order could leave a published game
 * pointing at missing images.
 */
export async function deleteGame(game: Game): Promise<void> {
  await deleteDoc(doc(db, GAMES, game.id))
  const images = [game.thumbnail, ...game.screenshots].filter(
    (image): image is StoredImage => image !== null,
  )
  if (images.length === 0) return

  const { deleteCatalogImage } = await import('./images')
  await Promise.allSettled(images.map((image) => deleteCatalogImage(image)))
}

/* Catalog images live in `images.ts`. They are deliberately NOT re-exported
   here: a static re-export would pull the Cloud Storage SDK back into the
   public bundle, which is exactly what that split avoids. */
