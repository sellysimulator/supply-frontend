import { getStorageInstance } from '../firebase/storage'
import type { StoredImage } from '../types/game'

/**
 * Catalog image storage. Kept apart from `games.ts` and loaded dynamically so
 * the Cloud Storage SDK stays out of the public bundle — only administrators
 * ever reach this code.
 */

/** Uploads under `games/{gameId}/…`, the only path storage.rules permits. */
export async function uploadCatalogImage(gameId: string, file: File): Promise<StoredImage> {
  const [{ getDownloadURL, ref, uploadBytes }, storage] = await Promise.all([
    import('firebase/storage'),
    getStorageInstance(),
  ])

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const path = `games/${gameId}/${Date.now()}-${safeName}`
  const objectRef = ref(storage, path)

  await uploadBytes(objectRef, file, { contentType: file.type })
  return { path, url: await getDownloadURL(objectRef) }
}

export async function deleteCatalogImage(image: StoredImage): Promise<void> {
  const [{ deleteObject, ref }, storage] = await Promise.all([
    import('firebase/storage'),
    getStorageInstance(),
  ])
  await deleteObject(ref(storage, image.path))
}
