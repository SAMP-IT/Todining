# DESIGN.md — ToDining · Warm Editorial

The locked visual system. Derived from the approved sample
`design-samples/2-warm-editorial.html`. Every screen inherits this. See
[PRODUCT.md](PRODUCT.md) for who/why.

> **Implementation rule that protects the app:** the Tailwind token *names*
> (`ember`, `sage`, `gold`, `ink`, `cream`) are **frozen** — only their *values*
> are retuned to the palette below. 350+ existing className references inherit the
> new look with zero edits. UI primitives are restyled but keep their exact prop
> APIs (see the barrel in `src/components/ui/index.ts`).

---

## Visual theme

A warm printed page, not a screen. Cream paper with a faint tactile grain, deep
warm ink for text, a single drop of **ember** for action, **forest** green for
"live / served", **gold** for signatures. Hairline rules and leader dots do the
structural work that boxes usually do. Confident, editorial, timeless. Light mode
only (the diner "after-dark" Ember Noir variant is a future, separate theme).

**Feels like:** a beautifully set fine-dining menu. **Never:** SaaS-cream with an
orange button and identical icon cards.

## Color — OKLCH, warm-tinted (no pure black/white)

Retune these Tailwind scales. `DEFAULT` shown where the token is used bare.

| Token | Role | Value (OKLCH) | ~Hex |
|---|---|---|---|
| `cream.DEFAULT` | page / paper | `oklch(0.976 0.008 78)` | `#faf6ef` |
| `cream.deep` | rest / inset fill | `oklch(0.958 0.013 74)` | `#f3ebdf` |
| `cream.3` | deepest paper | `oklch(0.938 0.018 72)` | `#ece0d0` |
| `ink.DEFAULT` | primary text | `oklch(0.235 0.022 42)` | `#2a211b` |
| `ink.soft` | secondary text | `oklch(0.40 0.022 44)` | `#5a4c42` |
| `ink.muted` | tertiary / labels | `oklch(0.565 0.018 52)` | `#8a7d6f` |
| `ember.500` | **primary action** | `oklch(0.55 0.185 37)` | `#c0451c` |
| `ember.600` | action hover | `oklch(0.48 0.18 35)` | `#a53a16` |
| `ember.100` | ember tint bg | `oklch(0.935 0.038 46)` | `#f6e2d6` |
| `sage.500` | **forest** / live / served | `oklch(0.44 0.085 152)` | `#3d6b4c` |
| `sage.100` | forest tint bg | `oklch(0.93 0.04 150)` | `#dbeade` |
| `gold.400` | signature / rating | `oklch(0.60 0.10 78)` | `#a8802f` |
| `gold.100`* | gold tint bg | `oklch(0.925 0.06 82)` | `#efe0c2` |
| hairline | borders | `ink` @ 8–12% or `oklch(0.83 0.014 60)` | |

Keep the intermediate ramp steps (200/300/700 etc.) proportionally retuned so
gradients-of-tint stay smooth. `sage` is deliberately a **deep bottle green**
now, not a mid green. Gold stays low-chroma and dark enough for text on cream.

**Strategy:** Restrained. Ink + cream carry the surface; ember ≤10% of any view;
forest and gold are accents on top of that. No decorative gradient fills, no
gradient text, no glass.

## Typography

- **Display / headings:** `Fraunces` (`font-display`), optical sizing on.
  `font-optical-sizing:auto`. Import **italic** axis (used for accents).
- **Body / UI:** `Plus Jakarta Sans` (`font-sans`).
- **Money & data:** always `font-variant-numeric: tabular-nums`.

Weights (bolder tuning, approved):

| Use | Font / weight | Notes |
|---|---|---|
| Hero display | Fraunces **400**, `tracking-[-0.03em]`, `leading-[0.98]` | italic ember accent word |
| Page / section H1–H2 | Fraunces **400**, `tracking-tight` | |
| Card / dish title (H3–H4) | Fraunces **600** | |
| Section label | Fraunces italic 400, or JK 700 `.tracking-[0.14em] uppercase text-[0.7rem]` | |
| Body | Jakarta 400, `leading-relaxed`, max 65–75ch | |
| Price / total | Fraunces **600–700**, tabular | |
| Micro-label / eyebrow | Jakarta 700, uppercase, `tracking-[0.2em]`, `text-ink-muted` | |

Scale ratio ≥1.25 between steps. Signature editorial moves available: drop cap,
ghosted index numerals (`01`), leader dots (name · · · price), hairline rules
with a centered ember diamond.

## Elevation, radius, texture

- **Radii:** sm `0.6rem`, md `1rem`, lg `1.4rem`, pill `999px`. Buttons `0.6rem`.
- **Shadows:** soft `0 1px 2px ink/4%, 0 8px 24px -16px ink/18%`;
  lift `0 20px 40px -20px ink/22%`. Prefer hairline borders over heavy shadow.
- **Paper grain:** fixed full-page SVG fractal-noise overlay, `opacity ~0.5`,
  `mix-blend-multiply`, `pointer-events:none`. Replaces the old radial-gradient
  `body::before` (which is removed — it was generic slop).
- **Card default:** `bg-white/paper` + `1px hairline border`, not a heavy shadow.
  Nested cards are banned.

## Motion

- Easing: **out-expo** `cubic-bezier(0.16,1,0.3,1)` (default), `ease-io`
  `cubic-bezier(0.65,0,0.35,1)` for symmetric moves. No bounce, no elastic.
- Durations: micro 0.25–0.35s, reveal 0.6–0.9s.
- Signatures: section reveal (fade + rise 22px, JS-gated so content never stays
  blank), sliding category underline, add-to-cart label→✓ + count bump, pulsing
  "active" step on the order timeline.
- Never animate layout properties. **Always** honor `prefers-reduced-motion`.

## Components (restyle, keep APIs)

- **Button** — `primary` = ember fill / cream text, `radius 0.6rem`, hover
  `ember-600` + `translateY(-1px)`; `secondary` = ink fill; `outline` = paper +
  hairline; `ghost` = ink-soft, hover ink/5; `success` = forest; `danger` = red.
  Sizes sm/md/lg keep current heights. Loading spinner unchanged.
- **Card** — paper + hairline, `radius md`. `CardHeader` = hairline-bottom.
- **Badge / StatusBadge** — pill, uppercase-ish, tint bg + accent text per tone.
  `ember/sage/gold/neutral/red/blue` tones retuned; forest = the `sage` tone.
  `dot` renders a leading current-color dot.
- **Input / Textarea / Select** — paper field, hairline border, focus = ember
  ring; `label` uppercase micro-label; `error` red, `hint` muted.
- **Menu item (marquee)** — leader-dot row (dietary dot + name · · · price),
  description, stepper/add. **Featured** variant = photo band + "Signature" tag.
- **EmptyState / PageHeader / KpiCard / QuantityStepper / RatingStars** — restyle
  to system; APIs unchanged. KpiCard `tone` union stays `ember|sage|gold|ink`.
- **Signature patterns** (new, additive): the printed **check** (dashed rules,
  tabular totals, serif grand total) and the **order timeline** (forest fill,
  pulsing active node).

## Accessibility

WCAG AA text/controls on cream (ink on cream ≈ 11:1; ember-500 on cream ≈ 4.6:1,
use ember-600 for small text). Visible non-color focus (ember ring, offset).
44px min touch targets on the diner flow. `prefers-reduced-motion` fully honored.

## Anti-slop guardrails (reject on sight)

Gradient text · side-stripe accent borders · glassmorphism-by-default ·
decorative radial-gradient page atmospheres · identical icon-card grids ·
hero-metric template · modal-as-first-thought · em dashes in copy (use `·`, `,`,
`:`, or a period).
