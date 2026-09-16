# CLAUDE.md — working on the Selly frontend

Selly is a **catalog** of educational supply chain games and simulations. It
describes each game and links out to it. It never runs a game, stores game data,
or acts as a backend for one.

The sibling projects under `../` (`Selly`, `Beery`, `Lemony`, `Pulky`) are the
games this catalog lists. Their stack — FastAPI, Socket.IO, MySQL, Redis,
`game_stack.md` — describes **them**, not Selly. Do not import their
conventions here.

Read this file before exploring. It is meant to spare you the search.

---

## Stack

| Concern | Choice                                                            |
| ------- | ----------------------------------------------------------------- |
| Build   | Vite 8, React 19, TypeScript (strict, `noUncheckedIndexedAccess`) |
| Routing | react-router-dom 7, `BrowserRouter`                               |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` — no `tailwind.config.js` |
| Backend | Supabase (Postgres + Auth + Storage), called from the browser     |
| Forms   | react-hook-form + zod through `@hookform/resolvers`               |
| i18n    | i18next + react-i18next + browser language detector               |
| Icons   | lucide-react (never emoji)                                        |
| Tests   | Vitest + Testing Library + jsdom                                  |
| Lint    | oxlint; Prettier (no semicolons, single quotes, width 100)        |
| Hosting | Firebase Hosting, static bundle from `dist/`                      |

There is **no application server**. Row level security in
`supabase/migrations/` is the authorization; hiding the admin UI is not.

## Commands

```bash
npm run dev          # Vite dev server on :5173
npm run build        # tsc -b && vite build  → dist/
npm test             # Vitest, single run
npm run test:watch
npm run lint         # oxlint
npm run format       # Prettier --write
npm run seed         # bulk-load scripts/seed-games.json with the secret key
npm run deploy       # build + firebase deploy --only hosting
```

Before handing work back: `npm run lint && npm test && npm run build`. CI
(`.github/workflows/`) runs exactly those three.

Environment: copy `.env.example` → `.env`. Only `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` reach the browser; `SUPABASE_SECRET_KEY` is read
by the seed script in Node only and must never gain a `VITE_` prefix.

## Where everything lives

```
src/
  main.tsx              providers: ThemeProvider > BrowserRouter > AuthProvider
  App.tsx               every route; the admin area is lazy-loaded
  index.css             design tokens, light and dark palettes, base layer
  i18n/
    index.ts            i18next init, language detection, <html lang>
    format.ts           labels that mix data and language (players, duration)
    locales/en.json     every English string
    locales/es.json     every Spanish string — same keys, enforced by a test
  theme/
    context.ts          ThemePreference, ThemeState, THEME_STORAGE_KEY
    ThemeProvider.tsx   resolves system/light/dark, toggles `.dark` on <html>
    useTheme.ts
  auth/
    AuthProvider.tsx    Supabase session + whether the account is in `admins`
    context.ts useAuth.ts RequireAdmin.tsx
  supabase/
    client.ts           the one Supabase client; CATALOG_IMAGE_BUCKET
    types.ts            snake_case row types — the only place column names live
  data/                 every read and write; pages never call supabase directly
    games.ts            catalog CRUD, row ↔ domain mapping
    analytics.ts        record_game_click RPC, the two aggregate reads
    clickMetrics.ts     pure summing helpers (unit-tested)
    images.ts           uploads to games/{gameId}/… in catalog-images
  types/game.ts         zod schema + Game/GameInput types + emptyGameInput
  hooks/useAsync.ts     the loading/error/data/reload shape every page uses
  lib/cn.ts             clsx + tailwind-merge
  components/
    ui/                 the primitive layer — see below
    layout/             Layout, Header, Footer, AdminLayout, Logo,
                        ThemeToggle, LanguageToggle, ScrollToTop
    catalog/            GameCard, GameMeta, GameThumbnail, CategoryFilter,
                        ScreenshotGallery
    charts/             StatTile, HourlyClicksChart, TopGamesChart (hand-rolled,
                        no charting library)
    admin/              ImageUploader, ResourceListEditor
    TermsModal.tsx
  pages/                Landing, Catalog, GameDetails, About, SignIn, NotFound
    admin/              Dashboard, GamesList, GameForm
  __tests__/            all tests, plus setup.ts

supabase/migrations/    schema + RLS policies; 0002 creates the image bucket
supabase/verify.sql     asserts the access rules hold; run it after any policy change
design-system/selly/MASTER.md   the visual spec
scripts/seed-catalog.mjs         bulk loader (Node, service role)
```

Dead scaffolding left by the Firebase CLI: `public/index.html` (shadowed by the
built `index.html`) and `public/404.html` (unreachable behind the SPA rewrite).
`public/favicon.svg` is real.

## Conventions that matter

**Never call Supabase from a component.** Add a function to `src/data/` instead.
Column names appear only in `src/supabase/types.ts` and `src/data/`.

**Never hardcode a color.** Every color is a token in `src/index.css`, reached
through a Tailwind utility (`bg-card`, `text-muted-foreground`, `border-border`).
A hex value in a component is a bug.

**No gradients, anywhere.** Flat fills only — no `linear-gradient`, no
`bg-gradient-to-*`, no gradient text or scrims. The look is minimal, modern,
formal and blue.

**Compose from `src/components/ui/`.** Button, Card, Badge, Field, Input,
Textarea, Select, Modal, Spinner/LoadingSection, EmptyState/ErrorState, Table,
TagInput. If a page needs a new look, add a variant to the primitive; do not
style one-offs in the page.

**Pages follow one shape:** `useAsync(...)` → `LoadingSection` → `ErrorState`
with a retry → `EmptyState` → content, inside `PageContainer` + `PageHeading`.

**Accessibility is not optional:** visible labels (never placeholder-as-label),
44px touch targets, a visible focus ring, `aria-live` on result counts,
`prefers-reduced-motion` respected globally.

## Translations

Every visible string lives in `src/i18n/locales/{en,es}.json`. Components read
them with `useTranslation()`; a literal sentence in a component is a bug.

```tsx
const { t } = useTranslation()
<h1>{t('catalog.title')}</h1>
<p>{t('catalog.count', { count: games.length })}</p>   // count_one / count_other
```

- **Adding a string:** add the key to `en.json` **and** `es.json`. The key sets
  are compared in `src/__tests__/i18n.test.ts`, so a forgotten translation fails
  the test run rather than silently falling back to English.
- **Markup inside a sentence** uses `<Trans>` with numbered placeholders
  (`<0>…</0>`) — see `pages/SignIn.tsx` and `pages/admin/GamesList.tsx`.
- **Validation messages are keys, not sentences.** `src/types/game.ts` stores
  `'validation.nameRequired'`; `GameForm` resolves it with a local `message()`
  helper when it renders the error.
- **Labels that mix data and language** (player counts, durations) live in
  `src/i18n/format.ts` and take `t` as their first argument, so they stay
  testable.
- **Dates and numbers** are formatted with `toLocaleString`-family calls and the
  active locale (`i18n.resolvedLanguage`), never a hardcoded `'en-US'`.
- The choice is remembered under `selly-language` and `<html lang>` follows it.
- **Adding a third language:** add the JSON file, register it in
  `src/i18n/index.ts`, and replace `LanguageToggle` with the `Select` primitive
  driven by `SUPPORTED_LANGUAGES`.

## Dark mode

`ThemeProvider` resolves `light | dark | system` and toggles a `dark` class on
`<html>`. An inline script in `index.html` applies the remembered choice before
the first paint, so there is no white flash; it reads the same `selly-theme`
key as `src/theme/context.ts`, and the two must stay in step.

That script's exact text is allow-listed by SHA-256 hash in the
Content-Security-Policy in `firebase.json`, because a static host cannot issue a
per-request nonce. Editing it by so much as a space means recomputing that hash
in the same change; `src/__tests__/csp.test.ts` fails when the two drift apart,
which is the only thing that catches it — the browser just declines to run the
script, and the build still succeeds.

`src/index.css` is the whole of the theming:

- `@custom-variant dark (&:where(.dark, .dark *))` — the class drives dark, not
  the media query alone, so a reader can override their system.
- `@theme inline { --color-card: var(--card); … }` maps each Tailwind color onto
  a variable, so `bg-card` compiles to `var(--card)` and follows the palette.
- `:root { … }` is the light palette; `.dark { … }` is the dark one. **Both must
  define the same names.** Adding a color means adding it in three places: the
  `@theme inline` map, `:root`, and `.dark`.

Because every utility resolves through a token, components need almost no
`dark:` variants — write `bg-card text-foreground` and both themes work. Reach
for a `dark:` utility only for something a token cannot express.

In the dark palette the blue lightens and `--on-primary` darkens, so filled
controls keep 4.5:1 contrast. Translucent surfaces use the `--overlay` token
rather than `bg-foreground/40`, which would invert into a white scrim.

## Testing

`npm test` runs everything in `src/__tests__/`. The Supabase client is never
constructed: `src/data/*` is mocked with `vi.mock`. `setup.ts` pins i18next to
English (assertions quote the English copy) and stubs `matchMedia` for jsdom.

Covered: catalog page behaviour, game card and details, terms disclosure, click
summing, the zod schema, the data layer, translation key parity, the theme
toggle, that an untrusted game name renders as text rather than markup, and that
the Content-Security-Policy still matches the inline script it allow-lists.
Access rules are **not** covered here — they live in Postgres and are proven by
running `supabase/verify.sql`.

## Data model in one paragraph

`games.id` is a slug (`beer-game`) that doubles as the public URL segment and the
analytics key, so it can never be renamed in place. Public reads are limited to
`published or is_admin()`. `admins` is readable only by the user it describes and
writable by nobody — the first administrator is inserted with the service role.
`click_counts` holds one row per game per hour with no visitor identifier of any
kind; clients cannot write it, and `record_game_click(p_game_id)` is the only way
in. Deleting a game leaves its counters intact. The dashboard never reads those
rows directly — `click_totals_by_game` and `click_series_hourly` aggregate them
in Postgres, so the figures cannot be silently truncated by the API's row cap.
