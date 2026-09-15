import { CATALOG_IMAGE_BUCKET, supabase } from '../supabase/client'
import type { StoredImage } from '../types/game'

/**
 * Catalog image storage. Uploads land under `games/{gameId}/`, and the bucket
 * policies allow writes only for administrators, so an upload from anyone else
 * is rejected by the server regardless of what the interface offers.
 */

/** Uploads one image and returns its stored path and public URL. */
export async function uploadCatalogImage(gameId: string, file: File): Promise<StoredImage> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const path = `games/${gameId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage
    .from(CATALOG_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(CATALOG_IMAGE_BUCKET).getPublicUrl(path)
  return { path, url: data.publicUrl }
}

export async function deleteCatalogImages(images: StoredImage[]): Promise<void> {
  if (images.length === 0) return
  await supabase.storage.from(CATALOG_IMAGE_BUCKET).remove(images.map((image) => image.path))
}

export async function deleteCatalogImage(image: StoredImage): Promise<void> {
  await deleteCatalogImages([image])
}
