# PRODUCT.md — ToDining

## Register

**Product** (default). ToDining is a working restaurant-operations SaaS: the design serves
the task on every screen. One surface is the exception and is treated **brand-experiential**:
the diner-facing QR ordering flow (`/r/:slug/t/:tableId` → menu → cart → track). That surface is
public, screenshot-able, and carries the brand — it earns expressive, memorable treatment. Admin
and staff surfaces stay product-first: fast, legible, calm under pressure.

## Users

- **Diners** (no account, on their phone, at a table). Scan a QR, browse, add to a shared table
  tab, order, track. Context: a real restaurant — could be a bright café at noon or a dim room at
  night. They decide in seconds whether this feels like a place they want to eat. Impatient,
  one-handed, often mid-conversation. The interface is the restaurant's first impression.
- **Owners / managers.** Live in the admin console for hours: orders, billing, inventory,
  analytics, staff, multi-restaurant switching. Want density without noise, and instant read on
  "what needs me right now."
- **Kitchen & waiter staff.** Glance at boards from arm's length during a rush. Real-time,
  high-stakes, zero patience for decoration that slows the read.

## Product purpose

Turn a phone-and-a-QR-code into a full front-of-house: ordering, kitchen/waiter coordination,
reservations, billing, inventory, feedback, analytics — multi-tenant. Replace clipboard-and-POS
friction with something that feels modern and trustworthy to both the diner and the operator.

## Brand personality (three words)

**Warm. Crafted. Confident.** Hospitality, not software. It should feel like a well-run dining
room: generous, precise, a little bit special — never sterile, never gimmicky.

## Anti-references (what it must NOT look like)

- **Generic SaaS-cream + one-orange-button + identical icon-cards.** The current first-reflex
  look. This is the "AI slop" being escaped.
- **Decorative gradient atmospheres** (the current `body::before` radial glows), gradient text,
  side-stripe accent borders, glassmorphism-by-default, hero-metric templates.
- **Doordash/Uber-Eats delivery-app sameness** — flat, transactional, photo-grid commodity feel.
- **Fintech-dashboard coldness** on the admin side (navy + grid + tiny gray text).

## Strategic design principles

1. **Commit to a point of view.** One confident aesthetic across the system; no hedging toward
   safe defaults. If a stranger could say "an AI made this" without hesitating, it failed.
2. **Typography does the heavy lifting.** Fraunces (display) used with real range and personality;
   Plus Jakarta Sans (body) tuned for legibility. Hierarchy via scale + weight, not boxes.
3. **Food is the hero.** Imagery and the menu-item component get the most craft; chrome recedes.
4. **Motion with intent.** Ease-out (quart/quint/expo), never bounce. Every transition frame-clean.
   Nothing animates layout properties.
5. **Two registers, one family.** Diner surface = expressive; operator surfaces = calm and dense.
   They must read as siblings, not strangers — shared tokens, different volume.
6. **Craft in the details.** Optical alignment, tuned letter-spacing, tabular numerals for money,
   correct focus states, real empty/loading/error states. The 1% lives here.

## Accessibility

Light-first product today (no dark theme yet — the diner "after-dark" direction may add one).
Targets: WCAG AA contrast on all text and controls, visible non-color focus, 44px+ touch targets
on the diner flow, `prefers-reduced-motion` honored for every animation.
