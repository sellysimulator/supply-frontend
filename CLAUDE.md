# CLAUDE.md — the Selly frontend (directory `Novus/Supply`)

Read this file before exploring. It is meant to spare you the search.

## What this app is

**Selly** is a **catalog** of educational supply chain games and simulations. It
describes each game, lets a visitor compare entries, and links out to the game.
It never runs a game, stores gameplay data, or acts as a backend for one.

> **Name vs. folder.** The product was renamed: this directory is still
> `Novus/Supply` but everything inside it is called **Selly** (`package.json`
> `name: "selly"`, `design-system/selly/`, `index.html` title). The folder
> rename is a pending manual step — see `../rebranding-steps.md`.

Where it sits in the Novus stack — the siblings under `../` are the games this
catalog lists, each independently developed, deployed and versioned:

| Folder           | What it is                                                     |
| ---------------- | -------------------------------------------------------------- |
| `Supply/`        | **this app** — Selly, the catalog                              |
| `Selly/`         | **Tequila Game** (the name `Selly` moved off it in the rename) |
| `Beery/`         | Beer Game                                                      |
| `Lemony/`        | Lemonade game                                                  |
| `Pulky/`         | Pulp game                                                      |
| `Selly-Designs/` | standalone HTML design explorations for this catalog           |

The games share a stack — FastAPI, Socket.IO, MySQL, Redis, documented in
`../game_stack.md` — that describes **them, not Selly**. Do not import their
conventions here. Selly has no application server and no Firestore/MySQL.

## Read the README

`README.md` is the operator's manual and is not duplicated here. Open it for:
first-time Supabase project setup (apply migrations, enable Google OAuth,
redirect URLs), how to become the first administrator, how the seed script
works, the **full data model** (`games`, `admins`, `click_counts`) and the
click-analytics abuse protection (`record_game_click` rate limiting,
`click_rate_limit`, `analytics_secrets`, the `cf-connecting-ip` /
rightmost-`x-forwarded-for` reasoning), and deployment.

## Stack

| Concern | Choice                                                               |
| ------- | -------------------------------------------------------------------- |
| Build   | Vite 8, React 19, TypeScript ~6 (strict, `noUncheckedIndexedAccess`) |
| Routing | react-router-dom 7, `BrowserRouter`                                  |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` — no `tailwind.config.js`    |
| Backend | Supabase (Postgres + Auth + Storage), called from the browser        |
| Forms   | react-hook-form + **zod 3** through `@hookform/resolvers`            |
| i18n    | i18next + react-i18next + browser language detector                  |
| Icons   | lucide-react (never emoji)                                           |
| Tests   | Vitest 5 + Testing Library + jsdom                                   |
| Lint    | oxlint; Prettier (no semicolons, single quotes, width 100)           |
| Hosting | Firebase Hosting, static bundle from `dist/`                         |

**Firebase is hosting only** — no Firestore, Auth, Functions or Storage from
Firebase. All data, auth and file storage is Supabase. (The Firebase agent
skills in `.claude/skills/` and `.agents/skills/` are vendored tooling, not a
statement about this app's architecture.)

There is **no application server**. Row level security in
`supabase/migrations/` is the authorization; hiding the admin UI is not.

## Commands

```bash
npm install
npm run dev          # Vite dev server on :5173
npm run build        # tsc -b && vite build  → dist/
npm run preview      # serve the built bundle
npm test             # Vitest, single run (15 files, 115 tests)
npm run test:watch
npm run lint         # oxlint
npm run format       # prettier --write .
npm run format:check # prettier --check .
npm run seed         # bulk-load scripts/seed-games.json with the secret key
npm run deploy       # build + firebase deploy --only hosting
```

Before handing work back: `npm run lint && npm test && npm run build`. Both CI
workflows run exactly those three, then deploy. `npm run lint` currently emits
one pre-existing **warning** (`GameForm.tsx` react-compiler
`incompatible-library`); oxlint exits 0 on warnings.

Node: `engines` allows `^22.14 || ^24 || >=26`; CI pins Node 24.

## Environment

Copy `.env.example` → `.env`. Only `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` reach the browser (Vite inlines every `VITE_*`
at build time, which is why both are repository secrets in CI).
`SUPABASE_SECRET_KEY` is read by `scripts/seed-catalog.mjs` in Node only and
must **never** gain a `VITE_` prefix — it bypasses row level security.

## Key configuration

- `vite.config.ts` — react + tailwind plugins, port 5173. **No path aliases.**
  Every import is relative (`../supabase/client`); do not introduce `@/…`
  without adding it to both Vite and the tsconfigs.
- `requireSupabaseEnv.ts` — the build plugin `vite.config.ts` adds. With
  `REQUIRE_SUPABASE_ENV=1` (both hosting workflows set it on the build step) it
  fails the build when `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` is
  empty, or when the URL is not `https://<ref>.supabase.co`, the only origin the
  CSP allows. Without it, a missing secret built cleanly into a blank page:
  `src/supabase/client.ts` throws on import. Off by default, so a local build
  without `.env` still works.
- `vitest.config.ts` — jsdom, globals, `src/__tests__/setup.ts`, include
  `src/**/*.test.{ts,tsx}`.
- `tsconfig.json` — project references only; `tsconfig.app.json` covers `src`
  (strict, `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`,
  `erasableSyntaxOnly`, `verbatimModuleSyntax`), `tsconfig.node.json` covers
  `vite.config.ts` and `requireSupabaseEnv.ts`.
- `.oxlintrc.json` — plugins react/typescript/oxc; `react/rules-of-hooks` error,
  `react/only-export-components` warn.
- `.prettierrc.json` — `semi: false`, `singleQuote`, width 100, trailing commas.
  `.prettierignore` excludes `dist`, `node_modules`, `package-lock.json` and
  **`design-system`**.
- `.firebaserc` — project `supply-739a5`; `firebase.json` — site
  `supply-catalog`, `public: dist`, SPA rewrite, immutable caching on
  `/assets/**`, `no-cache` on `index.html` **and on every extensionless route**
  (regex `^/[^.]*$`; the rewrite serves those as `index.html`, and a `source`
  of `/index.html` does not match them, so without it a page stayed cached for
  an hour and asked for bundles a newer deploy had deleted), and the security
  headers (CSP, nosniff, Referrer-Policy, X-Frame-Options). Both names keep the old brand
  **deliberately** — a Firebase project id cannot be changed; see
  `../rebranding-steps.md`.
- `.github/workflows/` — `firebase-hosting-merge.yml` (push to `main` → live)
  and `firebase-hosting-pull-request.yml` (PR → preview channel, same-repo PRs
  only). Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
  `FIREBASE_SERVICE_ACCOUNT_SUPPLY_739A5`. Both build steps set
  `REQUIRE_SUPABASE_ENV: '1'`; `src/__tests__/deployWorkflows.test.ts` fails if
  either loses it or a gate.
- `supabase/` holds SQL only — there is **no Supabase CLI project here**.
  Migrations are applied by hand in the SQL editor.

## Where everything lives

```
src/
  main.tsx              providers: ThemeProvider > BrowserRouter > AuthProvider > ScrollToTop
  App.tsx               every route; the admin area is lazy-loaded
  index.css             design tokens, light and dark palettes, base + components layers
  i18n/
    index.ts            i18next init, language detection, <html lang>, SUPPORTED_LANGUAGES
    format.ts           labels that mix data and language (players, duration)
    locales/{en,es}.json  every string — same keys, enforced by a test
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
    games.ts            catalog CRUD, row ↔ domain mapping, GAME_SUMMARY_COLUMNS
    analytics.ts        record_game_click RPC, the two aggregate reads
    clickMetrics.ts     pure summing helpers (unit-tested)
    images.ts           uploads to games/{gameId}/… in catalog-images
  types/game.ts         zod schema + Game/GameInput/GameSummary + emptyGameInput
  hooks/
    useAsync.ts         the loading/error/data/reload shape every page uses
    useRevealOnScroll.ts  one-shot IntersectionObserver reveal with a stagger
  lib/
    cn.ts               clsx + tailwind-merge
    bento.ts            the 12-column span rhythm; every span class as a literal
    initials.ts         a game's two initials, for the drawn thumbnail
  components/
    ui/                 the primitive layer, barrelled through ui/index.ts
    layout/             Layout (+ PageContainer, PageHeading), BentoGrid, Header,
                        Footer, AdminLayout, Logo, ThemeToggle, LanguageToggle,
                        ScrollToTop
    catalog/            GameCard, GameMeta, GameThumbnail, CategoryFilter,
                        ScreenshotGallery
    charts/             HourlyClicksChart, TopGamesChart — hand-rolled from the
                        `Table` primitive, no charting library
    admin/              ImageUploader, ResourceListEditor
    TermsModal.tsx
  pages/                Landing, Catalog, GameDetails, About, SignIn, NotFound
    admin/              Dashboard (uses the `Stat` primitive), GamesList, GameForm
  __tests__/            all tests, plus setup.ts

supabase/migrations/    0001 schema + RLS + analytics functions; 0002 image bucket;
                        0003 featured game
supabase/verify.sql     asserts the access rules hold; run it after any policy change
design-system/selly/MASTER.md   the visual spec (pages/ is currently empty)
scripts/seed-catalog.mjs        bulk loader (Node, service role); seed-games.json
requireSupabaseEnv.ts           build guard against an empty or wrong Supabase URL/key
.claude/skills/ .agents/skills/ vendored Firebase/Xcode agent skills (not app code)
```

**Naming:** pages are `export default`; everything else is a named export.
Components are `PascalCase.tsx`, hooks/lib/data are `camelCase.ts`. Tests are
`src/__tests__/<Subject>.test.{ts,tsx}` — they do **not** sit next to the code.

Dead scaffolding left by the Firebase CLI: `public/index.html` (the "Welcome to
Firebase Hosting" page, shadowed by the built `index.html`) and `public/404.html`
(unreachable behind the SPA rewrite). `public/favicon.svg` is real.

## Conventions that matter

**Never call Supabase from a component.** Add a function to `src/data/` instead.
Column names appear only in `src/supabase/types.ts` and `src/data/`.

**Never hardcode a color.** Every color is a token in `src/index.css`, reached
through a Tailwind utility (`bg-card`, `text-muted-foreground`, `border-border`).
A hex value in a component is a bug.

**No gradients, anywhere.** Flat fills only — no `linear-gradient`, no
`bg-gradient-to-*`, no gradient text or scrims. A `backdrop-blur` and a
token-with-alpha fill (`bg-card/80`) are not gradients and are allowed. The look
is modular, composed and calm: rounded tiles on a shared grid, lifted off the
canvas by a soft shadow, in one blue.

**Compose from `src/components/ui/`** (import from the `ui` barrel): Button
(+ ButtonLink/ButtonExternal), Card, Badge, Field, FilterChip, IconPad,
InitialsMark, Input/Textarea/Select, Modal, Motif, SectionHeader,
Spinner/LoadingSection, Stat, EmptyState/ErrorState, Surface, Table (Th/Td),
TagInput. If a page needs a new look, add a variant to the primitive; do not
style one-offs in the page. `PageContainer` and `PageHeading` are the exception
— they live in `components/layout/Layout.tsx`.

**Typography.** `--font-sans` is Lexend, `--font-display` is Quicksand, loaded
from Google Fonts in `index.html`. Only Quicksand 600/700 are loaded, so
anything with `font-display` must also carry `font-semibold`/`font-bold`.
Headings get the display face globally from `@layer base`.

**Write `rounded-xs/sm/md/lg`, never a custom radius name.** The scale is
renamed in meaning, not in name (xs = data marks, sm = chip, md = inner element,
lg = tile) precisely so `tailwind-merge` keeps resolving a caller's override
against a primitive's default. A custom name like `rounded-tile` is invisible to
tailwind-merge, so both declarations would ship and source order would decide.

**The bento grid.** Pages never write a `col-span-*` class or touch the reveal
observer — `BentoGrid` and `BentoItem` in `components/layout/BentoGrid.tsx` are
the only seam. Spans come from `computeSpans` in `src/lib/bento.ts`, which widens
the last row so a filtered catalog never leaves a hole. **Tailwind v4 reads source
as plain text and never evaluates JavaScript**, so a template literal like
`` `lg:col-span-${n}` `` compiles to nothing; every span class lives in that file
as a literal string. `index.css` also carries `@source inline("lg:col-span-{1..12}")`
and `@source inline("sm:col-span-{3,6} sm:row-span-2")` as belt-and-braces.

**Pages follow one shape:** `useAsync(...)` → `LoadingSection` → `ErrorState`
with a retry → `EmptyState` → content, inside `PageContainer` + `PageHeading`.

**Error handling.** `src/data/` throws `new Error(error.message)` on a failed
query; `useAsync` catches it into `error` and pages render `ErrorState` with a
`reload` retry. Two deliberate exceptions: `recordGameClick` swallows failures
(analytics must never block a launch) and `getGame` returns `null` for both
"missing" and "not allowed to see it", so the public site cannot distinguish.

**Accessibility is not optional:** visible labels (never placeholder-as-label),
44px touch targets, a visible focus ring (`:focus-visible` in `@layer base`,
never removed), `aria-live` on result counts, `prefers-reduced-motion` respected
globally — and note the `.tile-hover` / `.tile-enter` rules that re-cancel the
end state inside `@layer components`, since a base-layer rule cannot outrank one.

## Translations

Every visible string lives in `src/i18n/locales/{en,es}.json`. Components read
them with `useTranslation()`; a literal sentence in a component is a bug.

- **Adding a string:** add the key to `en.json` **and** `es.json`. The key sets
  are compared in `src/__tests__/i18n.test.ts`, so a forgotten translation fails
  the test run rather than silently falling back to English.
- **Markup inside a sentence** uses `<Trans>` with numbered placeholders
  (`<0>…</0>`) — see `pages/SignIn.tsx` and `pages/admin/GamesList.tsx`.
- **Validation messages are keys, not sentences.** `src/types/game.ts` stores
  `'validation.nameRequired'`; `GameForm` resolves it when it renders the error.
- **Labels that mix data and language** (player counts, durations) live in
  `src/i18n/format.ts` and take `t` as their first argument, so they stay
  testable.
- **Dates and numbers** use `toLocaleString`-family calls with the active locale
  (`i18n.resolvedLanguage`), never a hardcoded `'en-US'`.
- The choice is remembered under `selly-language` (with a one-time copy from the
  legacy `supply-language` key) and `<html lang>` follows it.
- **Adding a third language:** add the JSON file, register it in
  `src/i18n/index.ts`, and replace `LanguageToggle` with the `Select` primitive
  driven by `SUPPORTED_LANGUAGES`.

## Dark mode

`ThemeProvider` resolves `light | dark | system` and toggles a `dark` class on
`<html>`. An inline script in `index.html` applies the remembered choice before
the first paint, so there is no white flash; it reads the same `selly-theme` key
as `src/theme/context.ts` (falling back once to the legacy `supply-theme`), and
the two must stay in step.

That script's exact text is allow-listed by SHA-256 hash in the
Content-Security-Policy in `firebase.json`, because a static host cannot issue a
per-request nonce. **Editing it by so much as a space means recomputing that hash
in the same change**; `src/__tests__/csp.test.ts` fails when the two drift apart,
which is the only thing that catches it — the browser just declines to run the
script, and the build still succeeds.

`src/index.css` is the whole of the theming:

- `@custom-variant dark (&:where(.dark, .dark *))` — the class drives dark, not
  the media query alone, so a reader can override their system.
- `@theme inline { --color-card: var(--card); … }` maps each Tailwind color onto
  a variable, so `bg-card` compiles to `var(--card)` and follows the palette.
- `:root { … }` is the light palette; `.dark { … }` is the dark one. **Both must
  define the same names.** Adding a color means adding it in three places: the
  `@theme inline` map, `:root`, and `.dark`. That applies to the shadows too —
  `--shadow-tile` and `--shadow-lift` resolve through `--tile-shadow` and
  `--lift-shadow` the same way the colors do.
- **Depth is not the same mechanism in both themes.** In light mode a tile casts a
  soft two-layer shadow. In dark mode a soft shadow is invisible, so the canvas is
  darker than any tile, the shadow becomes a 1px spread ring plus a tight drop, and
  the hairline brightens to `--border-strong` on hover. Reach for `--surface` when
  something should read as _raised_ in the dark palette; it is lighter than
  `--card`, not darker.

Because every utility resolves through a token, components need almost no
`dark:` variants — write `bg-card text-foreground` and both themes work. In the
dark palette the blue lightens and `--on-primary` darkens, so filled controls
keep 4.5:1 contrast. Translucent surfaces use the `--overlay` token rather than
`bg-foreground/40`, which would invert into a white scrim.

## Testing

`npm test` runs everything in `src/__tests__/` (15 files, 115 tests). The Supabase
client is never constructed: `src/data/*` is mocked with `vi.mock`. `setup.ts`
pins i18next to English (assertions quote the English copy) and stubs
`matchMedia` for jsdom.

Covered: catalog page behaviour, game card and details, admin games list, terms
disclosure, click summing, the bento span arithmetic, the zod schema, the data
layer, translation key parity, the language and theme toggles, that an untrusted
game name renders as text rather than markup, that the
Content-Security-Policy still matches the inline script it allow-lists, the
Supabase build guard, and that both hosting workflows run the gates and turn it on.

jsdom implements no `IntersectionObserver`, and `useRevealOnScroll` guards on
exactly that, so every tile is revealed on mount under test. That guard is also
the production fallback, which is why there is no stub in `setup.ts`.

Access rules are **not** covered here — they live in Postgres and are proven by
running `supabase/verify.sql`, which seeds fixtures, asserts what anonymous and
non-administrator callers can and cannot do, and rolls everything back.

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
At most one published game is `featured` (partial unique index + check + an
unpublish trigger); it is changed only through `set_featured_game`, never by the
form, so `GameWriteRow` leaves it out. Pages read `game.featured` for the
accented tile — never "the first game".
