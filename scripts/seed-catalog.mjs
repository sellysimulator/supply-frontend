#!/usr/bin/env node
/**
 * Bulk-loads catalog entries with the Supabase secret key, which bypasses row
 * level security. Use it for the initial catalog; everyday edits belong in the
 * admin portal.
 *
 *   npm run seed
 *
 * Reads VITE_SUPABASE_URL and SUPABASE_SECRET_KEY from the environment, so a
 * filled in .env is enough. The secret key is a full-access credential that
 * bypasses every access rule in the database; it is read here, in Node, and
 * carries no VITE_ prefix, so Vite never places it in a browser bundle.
 *
 * Existing entries are left alone unless --force is passed, so re-running will
 * not overwrite edits made in the portal.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const here = dirname(fileURLToPath(import.meta.url))
const force = process.argv.includes('--force')

const url = process.env.VITE_SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SECRET_KEY before running this script.')
  process.exit(1)
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const games = JSON.parse(await readFile(join(here, 'seed-games.json'), 'utf8'))

let written = 0
let skipped = 0

for (const game of games) {
  const { data: existing, error: lookupError } = await supabase
    .from('games')
    .select('id')
    .eq('id', game.id)
    .maybeSingle()

  if (lookupError) {
    console.error(`  failed  ${game.id}: ${lookupError.message}`)
    process.exitCode = 1
    continue
  }

  if (existing && !force) {
    console.log(`  skip    ${game.id} (already exists — pass --force to overwrite)`)
    skipped += 1
    continue
  }

  const { error } = await supabase.from('games').upsert(game, { onConflict: 'id' })

  if (error) {
    console.error(`  failed  ${game.id}: ${error.message}`)
    process.exitCode = 1
    continue
  }

  console.log(`  ${existing ? 'replace' : 'create '} ${game.id}`)
  written += 1
}

console.log(`\nDone: ${written} written, ${skipped} skipped.`)
