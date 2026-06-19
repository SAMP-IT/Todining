# ToDining — Explainer Video (Remotion)

A ~95-second animated explainer covering the entire ToDining product — the customer
mobile-first ordering journey and the staff/admin web dashboards — built with
[Remotion](https://remotion.dev).

## Output
- **`out/todining-explainer.mp4`** — 1920×1080, 30fps, H.264, ~95s.

## Run it
```bash
npm install
npm run studio    # open the Remotion preview/editor
npm run render    # render to out/todining-explainer.mp4
```

## What's inside
- `src/scenes.ts` — the 18-scene storyboard (authored by the scripting agent in `script.md`),
  with narration, captions, per-scene accent and the screenshot each scene shows.
- `src/Explainer.tsx` — sequences the scenes over a persistent, accent-shifting background.
- `src/components/` — device frames (phone + browser), animated headings/chips, subtitles, chrome.
- `public/shots/` — real screenshots of every ToDining screen (mobile + desktop) captured from the running app.

## Source material
- `script.md` — full storyboard (Visual Storyteller agent).
- `copy.md` — taglines, feature one-liners, chapter headlines, CTA (Content Creator agent).

## Scene coverage (all 16 product features)
Intro → the problem → the one-platform solution → **customer journey** (QR scan, digital menu,
AI upsell, live order tracking, one-tap service calls, auto bill + feedback) → **kitchen & waiter**
real-time boards → **owner tools** (orders, live tables + QR, menu editing, reservations, inventory,
billing, feedback, WhatsApp notifications, analytics) → **multi-restaurant SaaS** → tech stack + CTA.

> Note: the video has no audio track — narration is shown as on-screen subtitles. To add a
> voiceover, drop an audio file in `public/` and add an `<Audio>` tag in `Explainer.tsx`.
