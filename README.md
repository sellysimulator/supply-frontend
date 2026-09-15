# Supply

A web-based catalog for educational games and simulations about supply chains,
including the Beer Game and its relatives. Supply helps people discover a game,
understand what it teaches, and open it.

**Supply does not run the games.** Each game listed here is an independently
developed and deployed application with its own frontend, backend, data and
release cycle. Supply stores only the catalog metadata and the launch URL.

## Architecture

A static React bundle on Firebase Hosting, talking directly to Firebase from the
browser. There is no application server.

```
Supply
├── React frontend on Firebase Hosting
├── Firebase Authentication (Google, administrators only)
├── Cloud Firestore — catalog entries
├── Cloud Firestore — anonymous click analytics
├── Cloud Storage — catalog images
└── Protected admin portal
```

Because there is no server, **Security Rules are the authorization**. Hiding the
admin interface is not a control; `firestore.rules` and `storage.rules` are, and
they are covered by the test suite in `tests/rules/`.

## Getting started

```bash
npm install
cp .env.example .env     # fill in from the Firebase console
npm run dev
```

To work without a Firebase project at all, against the local emulator suite:

```bash
cp .env.emulator .env    # demo config, VITE_USE_EMULATORS=true
npm run emulators        # terminal 1 — auth, firestore, storage
npm run seed:emulator    # optional — loads scripts/seed-games.json
npm run dev              # terminal 2
```

Switching back to the real project means copying `.env.example` over `.env` and
setting `VITE_USE_EMULATORS=false`; otherwise the app keeps talking to the
emulator and the catalog looks empty.

## Scripts

| Script                            | What it does                                  |
| --------------------------------- | --------------------------------------------- |
| `npm run dev`                     | Vite dev server                               |
| `npm run build`                   | Type-check and build to `dist/`               |
| `npm test`                        | Unit tests (jsdom)                            |
| `npm run test:rules`              | Security-rule tests against the emulator      |
| `npm run emulators`               | Start the local Firebase emulator suite       |
| `npm run seed`                    | Bulk-load catalog entries (see below)         |
| `npm run lint` / `npm run format` | oxlint / Prettier                             |
| `npm run deploy`                  | Build, then deploy rules, indexes and hosting |

## First-time Firebase setup

These steps have no CLI equivalent and must be done in the console.

1. **Create the project**, add a **Web app**, and copy its config into `.env`.
   Put the project id in `.firebaserc` (it currently reads `supply-catalog`).
2. **Authentication → Sign-in method → Google**: enable.
3. **Firestore**: create the database in production mode — the rules in this
   repository replace the defaults on first deploy.
4. **Storage**: enable.
5. **App Check**: register the web app with **reCAPTCHA v3** and put the site key
   in `VITE_RECAPTCHA_SITE_KEY`. For local development, add a debug token under
   _App Check → Apps → Manage debug tokens_ and set `VITE_APPCHECK_DEBUG_TOKEN`
   to the same value. Turn on **enforcement** for Firestore and Storage only
   after the first successful deploy.
6. **Deploy the rules** before using the app:
   `firebase deploy --only firestore:rules,firestore:indexes,storage`.

### Becoming an administrator

Administrator roles live in a protected `admins/{uid}` collection. No client code
path can write to it — that is the point — so the first administrator is seeded
by hand:

1. Sign in at `/sign-in` with the Google account that should be an administrator.
2. The page reports that the account is not an administrator and shows its UID.
3. In the Firebase console, create `admins/{that-uid}` with fields `email`
   (string) and `addedAt` (timestamp).
4. Add the same email address to the allowlist in `storage.rules` and run
   `firebase deploy --only storage`.
5. Sign out and back in.

Step 4 is needed because **Storage rules cannot read Firestore**, so image
uploads are gated on an email allowlist rather than the `admins` collection. The
two must be kept in step by hand. If that becomes tedious, the upgrade path is a
custom claim set by a Cloud Function — not built here, because Supply is
intentionally serverless.

## Seeding the catalog

Everyday edits belong in the admin portal. For an initial bulk load, edit
`scripts/seed-games.json` and run:

```bash
# against the emulator
firebase emulators:exec --only firestore "npm run seed"

# against the real project
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json npm run seed
```

Existing entries are skipped unless `--force` is passed.

## Data model

### `games/{gameId}`

The document id is a slug (`beer-game`) and is also the URL segment and the
prefix of every analytics counter for that game, so it cannot be renamed in
place.

Fields: `name`, `shortDescription`, `fullDescription`, `learningObjectives[]`,
`audience`, `minPlayers`, `maxPlayers`, `durationMinutes`, `categories[]`,
`tags[]`, `resources[]`, `thumbnail`, `screenshots[]`, `launchUrl`, `published`,
`sortOrder`, `createdAt`, `updatedAt`.

Public reads are limited to published entries. Because Security Rules filter
documents rather than queries, the catalog **must** query
`where('published', '==', true)` — an unconstrained listing is rejected.

### `admins/{uid}`

`{ email, addedAt }`. Readable only by the user it describes; not writable by any
client.

### `clickCounts/{gameId}_{YYYY-MM-DDTHH}`

`{ gameId, hour, clickCount }` — one counter per game per hour.

No visitor identifier of any kind is recorded: no name, email, UID, cookie,
session id or address. Anonymous visitors must be able to write here, so the
rules constrain the _transition_ rather than the writer: a counter may only be
created at 1 or raised by exactly 1, must belong to a published game, must be
stamped with the current hour, and may never be read or deleted by the public.
App Check is what makes repeating a legal write expensive for a bot.

Counters are never deleted, including when a game is deleted, so historical
analytics survive catalog changes.

## Design

The visual language — tokens, type, spacing and the rules that keep it
consistent — is recorded in `design-system/supply/MASTER.md`. In short:
minimal and formal, a single blue, flat fills with **no gradients anywhere**,
Inter, hairline borders instead of shadows, and SVG icons rather than emoji.

Every color lives as a token in `src/index.css`; components reference tokens
through Tailwind utilities and never hardcode a hex value. UI is composed from
the primitives in `src/components/ui/` so pages cannot fork the styling.

## Testing

```bash
npm test           # 52 unit tests — bucketing, schema, pages, components
npm run test:rules # 37 rule tests — starts the emulator, runs, shuts down
```

The rules suite is the real specification of who can do what: it asserts that
unpublished games are invisible, that non-admins cannot write to the catalog,
that analytics counters can only be nudged by one, and that nobody can grant
themselves admin.
