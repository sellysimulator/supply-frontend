# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Selly
**Generated:** 2026-09-14 19:25:20
**Category:** Directory / Listing Site
**Design Dials:** Variance 6/10 (Modular bento grid) | Motion 3/10 (Polite) | Density 5/10 (Standard)

---

## Global Rules

### Color Palette

Every name below is defined in **both** `:root` and `.dark` in `src/index.css`
and mapped through `@theme inline`. The table gives the light value; see the
`.dark` block for its counterpart.

| Role | Light hex | CSS Variable |
|------|-----------|--------------|
| Primary | `#1D4ED8` | `--color-primary` |
| Primary hover | `#1E40AF` | `--color-primary-hover` |
| Primary subtle (icon pads, eyebrow chips) | `#E6EEFE` | `--color-primary-subtle` |
| Primary line (hairline inside a pad) | `#C7D9FD` | `--color-primary-line` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| On Primary muted | `#DBEAFE` | `--color-on-primary-muted` |
| On Primary line | `#93B4F5` | `--color-on-primary-line` |
| Featured fill | = primary | `--color-featured` |
| On Featured / muted / line | = on-primary set | `--color-on-featured*` |
| Background (the canvas, i.e. the gap between tiles) | `#EEF2F7` | `--color-background` |
| Card (a tile) | `#FFFFFF` | `--color-card` |
| Surface (an inset panel inside a tile) | `#F4F7FB` | `--color-surface` |
| Muted (a recessed fill) | `#E9EEF5` | `--color-muted` |
| Foreground | `#0F172A` | `--color-foreground` |
| Muted Foreground | `#475569` | `--color-muted-foreground` |
| Border (hairline) | `#E2E8F0` | `--color-border` |
| Border strong (hover hairline) | `#C3CFDF` | `--color-border-strong` |
| Overlay (modal scrim) | `rgb(15 23 42 / .45)` | `--color-overlay` |
| Destructive | `#DC2626` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `--color-on-destructive` |
| Success | `#047857` | `--color-success` |
| Ring | `#1D4ED8` | `--color-ring` |

**Surface levels.** The point of `background < card < surface < muted` is that a
reader can tell three depths apart: the canvas holds a tile, the tile holds a
surface, the surface holds chips. In the dark palette `--surface` is *lighter*
than `--card`, because elevation there reads as light, not as shadow.

**The featured tile** is its own token set (`--featured` / `--on-featured` /
`--on-featured-muted` / `--on-featured-line`) rather than a reuse of the primary
utilities, so that "what featured looks like" is one decision per theme and no
component can reach for `--muted-foreground` on a filled blue surface — a pairing
that measures 1.6:1.

**Color Notes:** Professional blue, single accent hue. Overridden from the
generator's green palette at the user's request: modern, composed, blue.
**No color gradients anywhere** — flat fills only, no `linear-gradient`, no
`bg-gradient-to-*`, no gradient text or overlays. A `backdrop-blur` and a
token-with-alpha fill (`bg-card/80` on the header bar) are not gradients.
Success green `#047857` is reserved for the "published" badge and is not a
general accent.

### Typography

- **Heading Font:** Quicksand 600/700 — `--font-display`
- **Body Font:** Lexend 400/500/600/700 — `--font-sans`
- **Mood:** rounded, composed, calm, highly legible, product-grade
- **Google Fonts:** [Lexend + Quicksand](https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Quicksand:wght@600;700&display=swap)

Quicksand's geometric roundness gives the tiles their soft product voice; Lexend
is tuned for reading ease and carries everything else.

`@layer base` puts the display face on `h1`–`h4` globally, so a component only
reaches for `font-display` when it is styling something that is not a heading — a
stat numeral, a wordmark, the initials on a drawn thumbnail.

> **Only Quicksand 600 and 700 are loaded.** Anything given `font-display` must
> also carry `font-semibold` or `font-bold`, or the browser will synthesise a fake
> light weight.

**Loaded via `<link>` in `index.html`**, not a CSS `@import` — and the CSP in
`firebase.json` already allows `fonts.googleapis.com` and `fonts.gstatic.com`.

### Spacing Variables

*Density: 5/10 — Standard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Radius

Radius is the signature of this design. The scale is renamed in meaning, not in
name, so `tailwind-merge` keeps resolving a caller's override against a
primitive's default — **never introduce a custom radius name.**

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | `4px` | Data marks only: chart bars, inline `<code>`, image crops |
| `--radius-sm` | `10px` | Chips, badges, filter buttons |
| `--radius-md` | `12px` | Buttons, inputs, icon pads, inset panels |
| `--radius-lg` | `24px` | Tiles: `Card`, `Modal`, `EmptyState` |

Nothing on page chrome goes below 10px. The header bar and its nav pills are
`rounded-full`.

### Shadow Depths

Two levels, not four — a tile is either resting or lifted.

| Token | Usage |
|-------|-------|
| `--shadow-tile` | Every tile at rest |
| `--shadow-lift` | A tile under the pointer, via `.tile-hover` |

Both resolve through `--tile-shadow` / `--lift-shadow`, which are redefined per
theme. **Light mode** uses a soft two-layer drop. **Dark mode does not** — a soft
shadow is invisible on a dark canvas, so there the shadow is a 1px spread ring
plus a tight deep drop, the canvas sits darker than any tile, and the hairline
brightens to `--border-strong` on hover.

---

## Component Specs

The tokens are the specification; these are the shapes they compose into. Reach
for the primitive in `src/components/ui/`, never these class strings.

### Tiles (`Card`)

`rounded-lg border border-border bg-card shadow-tile`. `elevation="flat"` drops
the shadow, `elevation="featured"` fills with `bg-featured text-on-featured`, and
`interactive` adds `.tile-hover` — a 200ms `--ease-tile` transition into a 2px
lift, `--shadow-lift`, and a `--border-strong` hairline.

### Buttons

`rounded-md`, `h-11` (`md`) at or above the 44px touch target. Variants:
`primary` (filled, `shadow-tile`), `secondary` (card fill, hairline), `soft`
(`--primary-subtle` wash), `ghost`, `inverse` (for a control *on* a featured
tile), `destructive`. `shape="pill"` for header and nav. `size="icon"` for a
square 44px control.

### Chips (`Badge`, `FilterChip`)

`rounded-sm px-2.5 py-1 text-xs font-medium`. A pressed `FilterChip` carries a
check icon **as well as** the fill, so its state never depends on colour alone.

### Inputs

`rounded-md border border-border bg-surface h-11`, `focus:border-primary`. The
surface fill is what makes a field read as a well inside a white tile.

### Inset panels (`Surface`)

`rounded-md border border-border bg-surface`, never a shadow — a tile lifts, an
inset recedes.

### Modals

`rounded-lg` panel with `shadow-lift` over a flat `--overlay` scrim. No gradient.

---

## Style Guidelines

**Style:** Bento — modular tiles on a shared grid

**Keywords:** Modular, composed, calm, rounded, layered, grid-based, product-grade

The whole page is one 12-column board. Hero, stats, value points, filters and
games are all tiles of different spans in the same system, so scrolling feels
like panning across a well-organised board rather than descending through stacked
sections. The restraint is in the colour; the interest is in the composition.

**The one rule that keeps it recognisable:** nothing is full-bleed and nothing is
a plain row. An even grid kills the concept — do not give every tile the same
span.

**Best For:** Catalogs, directories, dashboards, product marketing

**Key Effects:** 200ms `cubic-bezier(0.2, 0, 0, 1)` hover lift (2px + shadow),
staggered fade-and-rise on first view, soft depth, clear type hierarchy

### Page Pattern

**Pattern Name:** Marketplace / Directory

- **Conversion Strategy:** Search is the primary CTA. Reduce friction with useful suggestions. For featured-listing carousels, provide previous/next and play/pause buttons, full keyboard access, and a single-pointer alternative to swiping; stop rotation on focus, hover, offscreen/hidden, or reduced motion and render the selected listing as the static final state.
- **CTA Placement:** Hero Search Bar + Navbar 'List your item'
- **Section Order:** Hero (Search focused) > Categories > Featured Listings > Trust/Safety > CTA (Become a host/seller)

---

## Motion

**Hover lift** — 200ms `--ease-tile` (`cubic-bezier(0.2, 0, 0, 1)`) into
`translateY(-2px)`, `--shadow-lift` and a `--border-strong` hairline. Applied by
`.tile-hover`, which `Card interactive` adds. Never `scale()` — see the
layout-shifting-hovers anti-pattern below.

**Scroll reveal** — a one-shot staggered fade-and-rise as game tiles first enter
the viewport: 300ms, 40ms apart (capped at the seventh tile),
`translateY(12px)` to 0. Implemented by `src/hooks/useRevealOnScroll.ts` with
`IntersectionObserver` and applied by `BentoItem`. **No animation library** —
GSAP is not a dependency and should not become one.

**Reduced motion** is guarded three times over, deliberately redundantly:

1. `.tile-enter`'s hidden initial state lives entirely inside
   `@media (prefers-reduced-motion: no-preference)`, so a reduced-motion reader
   never has invisible content — putting `opacity: 0` outside that query would
   leave the catalog blank, because the global kill switch collapses the
   *transition* but not the starting state.
2. The global `transition-duration: 0.01ms !important` rule in `@layer base`.
3. The hook itself checks `matchMedia` and reveals on mount with no observer.

The hover lift is cancelled inside `@layer components`, immediately after the
rule it cancels — a `@layer base` rule cannot outrank a components-layer one.

---

## Anti-Patterns (Do NOT Use)

- ❌ No trust cues
- ❌ Text-heavy cards
- ❌ hidden filters

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light **and dark** mode: text contrast 4.5:1 minimum
- [ ] Nothing inside a `featured` tile uses `--muted-foreground` (1.6:1 on the fill)
- [ ] No radius below 10px on page chrome; data marks use `--radius-xs`
- [ ] Every new color defined in `@theme inline`, `:root` **and** `.dark`
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
