#!/usr/bin/env node
/**
 * Uploads catalog images for one or more games and points each entry at them,
 * with the Supabase secret key. Use it for bulk image loads such as the
 * marketing media in Novus/Marketing/ShowcaseMedia; everyday edits belong in
 * the admin portal.
 *
 *   npm run seed:media -- <game-id>=<folder> [<game-id>=<folder> ...] [--dry-run]
 *
 * In each folder, the file whose name starts with `00-thumbnail` becomes the
 * thumbnail, and every other image becomes a screenshot, in file-name order.
 * The game's entry must already exist (run `npm run seed` first).
 *
 * Files are stored under games/<game-id>/ with a hash of their content in the
 * name. Re-running with the same images rewrites the same objects. A changed
 * image gets a new URL, so no browser or CDN keeps serving a stale copy under
 * a year-long cache header. After the entry is updated, any image it used to
 * point at that is no longer referenced is deleted, as the portal does when an
 * image is removed.
 *
 * `--dry-run` reads the folders and prints the plan without connecting.
 *
 * Reads VITE_SUPABASE_URL and SUPABASE_SECRET_KEY from the environment, like
 * seed-catalog.mjs. The secret key bypasses every access rule; it is read here,
 * in Node, and never reaches a browser bundle.
 */
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

/** Same bucket as CATALOG_IMAGE_BUCKET in src/supabase/client.ts. */
const BUCKET = 'catalog-images'
/** The bucket's own limits (supabase/migrations/0002_storage.sql). */
const MAX_BYTES = 5 * 1024 * 1024
const CONTENT_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const targets = args
  .filter((arg) => !arg.startsWith('--'))
  .map((arg) => {
    const at = arg.indexOf('=')
    if (at < 1) {
      console.error(`Expected <game-id>=<folder>, got "${arg}".`)
      process.exit(1)
    }
    return { gameId: arg.slice(0, at), folder: resolve(arg.slice(at + 1)) }
  })

if (targets.length === 0) {
  console.error('Usage: npm run seed:media -- <game-id>=<folder> [...] [--dry-run]')
  process.exit(1)
}

/** Reads a folder into { thumbnail, screenshots } of upload-ready files. */
async function readImages(gameId, folder) {
  const names = (await readdir(folder))
    .filter((name) => CONTENT_TYPES[extname(name).toLowerCase()])
    .sort()
  const files = []
  for (const name of names) {
    const body = await readFile(join(folder, name))
    if (body.length > MAX_BYTES) throw new Error(`${name} is over the bucket's 5 MB limit`)
    const hash = createHash('sha256').update(body).digest('hex').slice(0, 12)
    const safeName = basename(name).replace(/[^a-zA-Z0-9._-]/g, '-')
    files.push({
      name,
      body,
      contentType: CONTENT_TYPES[extname(name).toLowerCase()],
      path: `games/${gameId}/${hash}-${safeName}`,
    })
  }
  const thumbnail = files.find((file) => file.name.startsWith('00-thumbnail')) ?? null
  const screenshots = files.filter((file) => file !== thumbnail)
  return { thumbnail, screenshots }
}

const plans = []
for (const target of targets) {
  const images = await readImages(target.gameId, target.folder)
  plans.push({ ...target, ...images })
  console.log(
    `${target.gameId}: thumbnail ${images.thumbnail?.name ?? '(none)'}, ` +
      `${images.screenshots.length} screenshots from ${target.folder}`,
  )
}

if (dryRun) {
  for (const plan of plans) {
    for (const file of [plan.thumbnail, ...plan.screenshots].filter(Boolean)) {
      console.log(`  ${file.path}  (${(file.body.length / 1024).toFixed(0)} KB)`)
    }
  }
  console.log('\nDry run: nothing was uploaded.')
  process.exit(0)
}

const url = process.env.VITE_SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY before running this script.')
  process.exit(1)
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const storage = supabase.storage.from(BUCKET)

async function upload(file) {
  const { error } = await storage.upload(file.path, file.body, {
    contentType: file.contentType,
    cacheControl: '31536000',
    upsert: true,
  })
  if (error) throw new Error(`${file.name}: ${error.message}`)
  return { path: file.path, url: storage.getPublicUrl(file.path).data.publicUrl }
}

for (const plan of plans) {
  try {
    const { data: existing, error: lookupError } = await supabase
      .from('games')
      .select('id, thumbnail, screenshots')
      .eq('id', plan.gameId)
      .maybeSingle()
    if (lookupError) throw new Error(lookupError.message)
    if (!existing) throw new Error('no such entry — run `npm run seed` first')

    const thumbnail = plan.thumbnail ? await upload(plan.thumbnail) : null
    const screenshots = []
    for (const file of plan.screenshots) screenshots.push(await upload(file))

    const { error: updateError } = await supabase
      .from('games')
      .update({ thumbnail, screenshots })
      .eq('id', plan.gameId)
    if (updateError) throw new Error(updateError.message)

    // Only after the entry points at the new files: drop what nothing uses now.
    const kept = new Set([thumbnail, ...screenshots].filter(Boolean).map((image) => image.path))
    const stale = [existing.thumbnail, ...(existing.screenshots ?? [])]
      .filter((image) => image?.path && !kept.has(image.path))
      .map((image) => image.path)
    if (stale.length > 0) {
      const { error: removeError } = await storage.remove(stale)
      if (removeError)
        console.warn(`  ${plan.gameId}: could not delete old images: ${removeError.message}`)
    }

    console.log(
      `  done    ${plan.gameId}: ${thumbnail ? 1 : 0} thumbnail, ${screenshots.length} screenshots` +
        (stale.length ? `, ${stale.length} old images deleted` : ''),
    )
  } catch (error) {
    console.error(`  failed  ${plan.gameId}: ${error.message}`)
    process.exitCode = 1
  }
}
