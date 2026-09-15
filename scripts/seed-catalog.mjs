#!/usr/bin/env node
/**
 * Bulk-loads catalog entries with the Firebase Admin SDK, which bypasses
 * security rules. Use it for the initial catalog; everyday edits belong in the
 * admin portal.
 *
 * Against the emulator (no credentials needed):
 *   firebase emulators:exec --only firestore "npm run seed"
 *
 * Against the real project:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *   FIREBASE_PROJECT_ID=your-project-id npm run seed
 *
 * Existing documents are left alone unless --force is passed, so re-running is
 * safe and will not overwrite edits made in the portal.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { cert, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const here = dirname(fileURLToPath(import.meta.url))
const force = process.argv.includes('--force')

const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST)
const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? 'supply-catalog'

if (usingEmulator) {
  initializeApp({ projectId })
  console.log(`Seeding the Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`)
} else {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!credentialsPath) {
    console.error(
      'Set GOOGLE_APPLICATION_CREDENTIALS to a service account key, or run against the emulator.',
    )
    process.exit(1)
  }
  const serviceAccount = JSON.parse(await readFile(credentialsPath, 'utf8'))
  initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id })
  console.log(`Seeding project ${serviceAccount.project_id}`)
}

const db = getFirestore()
const games = JSON.parse(await readFile(join(here, 'seed-games.json'), 'utf8'))

let created = 0
let skipped = 0

for (const { id, ...game } of games) {
  const ref = db.collection('games').doc(id)
  const snapshot = await ref.get()

  if (snapshot.exists && !force) {
    console.log(`  skip    ${id} (already exists — pass --force to overwrite)`)
    skipped += 1
    continue
  }

  await ref.set({
    ...game,
    createdAt: snapshot.exists ? snapshot.get('createdAt') : FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
  console.log(`  ${snapshot.exists ? 'replace' : 'create '} ${id}`)
  created += 1
}

console.log(`\nDone: ${created} written, ${skipped} skipped.`)
process.exit(0)
