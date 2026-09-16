# Selly

A web-based catalog for educational games and simulations about supply chains,
including the Beer Game and its relatives. Selly helps people discover a game,
understand what it teaches, and open it.

**Selly does not run the games.** Each game listed here is an independently
developed and deployed application with its own frontend, backend, data and
release cycle. Selly stores only the catalog metadata and the launch URL.

## Architecture

A static React bundle talking directly to Supabase from the browser. There is no
application server.

```
Selly
├── React frontend on Firebase Hosting
├── Supabase Auth (Google, administrators only)
├── Postgres — catalog entries
├── Postgres — anonymous click analytics
├── Supabase Storage — catalog images
└── Protected admin portal
```

Because there is no server, **row level security is the authorization**. Hiding
the admin interface is not a control; the policies in `supabase/migrations/` are,
and `supabase/verify.sql` proves they hold.

## Getting started

```bash
npm install
cp .env.example .env     # fill in from the Supabase dashboard
npm run dev
```

## Scripts

| Script                            | What it does                          |
| --------------------------------- | ------------------------------------- |
| `npm run dev`                     | Vite dev server                       |
| `npm run build`                   | Type-check and build to `dist/`       |
| `npm test`                        | Unit tests                            |
| `npm run seed`                    | Bulk-load catalog entries (see below) |
| `npm run lint` / `npm run format` | oxlint / Prettier                     |
| `npm run deploy`                  | Build and deploy to Firebase Hosting  |

## First-time Supabase setup

1. **Create a project** at supabase.com.
2. **Apply the schema.** In the SQL editor, run
   `supabase/migrations/0001_catalog.sql` then `supabase/migrations/0002_storage.sql`.
   The second creates the `catalog-images` bucket and its policies.
3. **Check the rules hold.** Run `supabase/verify.sql` in the SQL editor. It
   seeds fixtures, asserts what anonymous and non-administrator callers can and
   cannot do, and rolls everything back. Any failure raises an exception; success
   ends with `All access rule checks passed.`
4. **Enable Google sign-in.** _Authentication → Providers → Google_. You need a
   Google Cloud OAuth client; paste its client ID and secret, and add the
   callback URL Supabase shows you to that client's authorized redirect URIs.
5. **Set the redirect URLs.** _Authentication → URL Configuration_: set the site
   URL to your deployed origin and add `http://localhost:5173` plus your
   deployed origin to the redirect allow list. Sign-in is a redirect flow and
   will fail without this.
6. **Fill in `.env`** from _Project Settings → Data API_: the project URL and the
   anon (publishable) key. Only these two values; see `.env.example`.

### Becoming an administrator

Administrator roles live in the `admins` table. No policy grants insert, update
or delete — that is what stops anyone promoting themselves — so the first
administrator is added with the service role:

1. Sign in at `/sign-in` with the Google account that should be an administrator.
2. The page reports that the account is not an administrator and shows its user
   id.
3. In the SQL editor, run:

   ```sql
   insert into admins (user_id, email)
   values ('<the user id>', '<the email>');
   ```

4. Reload the page.

The same `is_admin()` check gates the catalog tables and the image bucket, so
this one row grants everything — there is nothing else to keep in step.

## Seeding the catalog

Everyday edits belong in the admin portal. For an initial bulk load, edit
`scripts/seed-games.json` and run:

```bash
npm run seed
```

It reads `VITE_SUPABASE_URL` and `SUPABASE_SECRET_KEY` from `.env`, so a
filled-in `.env` is all it needs. Existing entries are skipped unless `--force`
is passed.

The secret key bypasses row level security. It is read in Node only, and its
name has no `VITE_` prefix, so Vite never compiles it into a browser bundle.

## Data model

### `games`

`id` is a slug (`beer-game`), enforced by a check constraint. It is also the
public URL segment and the key every analytics counter is recorded against, so
it cannot be renamed in place.

Public reads are limited to published entries by the policy
`published or is_admin()`; writes require `is_admin()`.

### `admins`

`(user_id, email, added_at)`. Readable only by the user it describes, and not
writable by any client.

### `click_counts`

`(game_id, hour, click_count)` — one row per game per hour.

No visitor identifier is recorded: no name, email, account id, cookie, session
or address. No policy allows a client to insert, update or delete here. The only
way in is `record_game_click(p_game_id)`, a security definer function whose sole
possible effect is to add one to the current hour's count for a **published**
game. It cannot be made to set an arbitrary value, backdate a counter, or store
anything about the caller.

Counters have no foreign key to `games`, so deleting a game never rewrites
history.

Administrators never read these rows directly. `click_totals_by_game(p_days)` and
`click_series_hourly(p_hours)` aggregate them in Postgres and are the dashboard's
only way in: both are security definer, both refuse anyone who is not an
administrator, and both clamp their window. Fetching the raw rows instead would
run into the API's 1000-row cap, which truncates without erroring — and since the
rows read oldest first, a busy month would silently hide the most recent
traffic.

### Abuse protection

`record_game_click` throttles per caller: it keeps a salted one-way hash of the
request's address in `click_rate_limit`, bucketed by minute and pruned after ten,
and stops counting past 20 calls a minute. The salt lives in `analytics_secrets`,
generated randomly when the migration runs. Both tables have row level security
on and no policies at all, so nothing outside the function can read them. The
hash is never written to, or joined with, `click_counts`.

The address is taken from `cf-connecting-ip`, which the edge sets from its own
view of the connection, falling back to the **rightmost** element of
`x-forwarded-for`. Proxies append to that header, so the last entry is what the
nearest trusted proxy observed while the first is whatever the caller claimed —
keying the throttle on the first would let anyone mint a fresh bucket per request
by varying a header, and inflate a counter without limit.

A second ceiling, keyed by the game rather than the caller, caps any one game at
600 counted clicks a minute, so a flood spread across many genuine addresses
cannot move a counter arbitrarily either. Only callers already inside their own
per-caller ceiling reach it: were every request counted there, one address could
spend its rejected calls pushing the game over the edge and suppress everybody
else's clicks for the rest of the minute.

The function returns normally when throttled, so a client cannot detect the
ceiling and adapt to it.

## Design

The visual language — tokens, type, spacing and the rules that keep it
consistent — is recorded in `design-system/selly/MASTER.md`. In short:
minimal and formal, a single blue, flat fills with **no gradients anywhere**,
Inter, hairline borders instead of shadows, and SVG icons rather than emoji.

Every color lives as a token in `src/index.css`; components reference tokens
through Tailwind utilities and never hardcode a hex value. UI is composed from
the primitives in `src/components/ui/` so pages cannot fork the styling.

### Light and dark

The site follows the operating system setting until the reader picks a theme
from the header, and then remembers the choice. `src/index.css` defines the same
token names twice — `:root` for light, `.dark` for dark — and `@theme inline`
maps Tailwind's colors onto them, so a component written as `bg-card
text-foreground` works in both themes without `dark:` variants. An inline script
in `index.html` applies the remembered theme before the first paint, so there is
no flash of the wrong one.

### Languages

The interface is available in English and Spanish, chosen from the header and
remembered between visits; a first-time visitor gets whichever their browser
asks for. Every string lives in `src/i18n/locales/en.json` and `es.json`, and a
unit test fails the build if the two files stop carrying the same keys, so a
missing translation cannot slip through as a silent fallback to English.

## Testing

```bash
npm test    # 74 unit tests — summing, schema, pages, components, data layer,
            #   translation key parity, theme switching, untrusted-name escaping,
            #   content-security-policy hash
```

The access rules are not covered by these: they run inside Postgres, so they are
verified by running `supabase/verify.sql` against the database. That script is
the real specification of who can do what — it asserts that unpublished games
are invisible, that non-administrators cannot write to the catalog, that the
click counters cannot be read or forged, that the rate limit holds, and that
nobody can grant themselves administrator.

## Deployment

The site is a static bundle on Firebase Hosting (the free tier, no billing
account required). `npm run deploy` builds and deploys it. The GitHub workflows
in `.github/workflows/` do the same on push and on pull requests; they need
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as repository secrets,
because those values are compiled into the bundle at build time.
