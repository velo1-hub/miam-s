# Changelog

All notable changes to the Idya Auto website. Format follows Keep a Changelog; versions
follow the build phases of `IDYA_AUTO_BRIEF.md` §24 until launch.

## [Unreleased]

### Added
- Hero « Signature rouge » (brief §11): the home loop is now built from Higgsfield studio keyframes
  (`docs/brand/hero-keyframe-16x9.png`, `-9x16.png`, GPT Image 2.6) with the light choreography
  composited by `scripts/animate-hero-still.sh` (red blade sweep, headlight flare, floor glow, exact
  7.000 s seamless loop) and encoded by `scripts/encode-hero.sh`. Deliverables: 652 KB H.264,
  164 KB AV1, 179 KB portrait, 12 KB / 6 KB AVIF posters.
- Admin on phones: bottom tab bar (Accueil, Véhicules, Leads, Essais, Plus) with a « Plus » sheet for
  Assistant, Paramètres, Journal and sign-out; sticky top bar with the demo flag and sign-out.
- « Vendre mon auto » (`/fr/vendre-mon-auto`, `/en/sell-my-car`): a private owner offers their
  vehicle to the dealership outright with their asking price, price flexibility, timeline, condition,
  photos and a registered-owner statement. New lead type `sell_car` (« Vente directe ») with the
  offered vehicle and asking price shown in the admin lead list and detail, AI triage, notification
  email, Supabase enum migration, assistant routing, privacy-policy wording, links from the nav,
  footer, home trade-in teaser and trade-in page. Unit, end-to-end and axe tests.

### Changed
- Admin vehicle list and journal render as cards below `md` instead of horizontally scrolling tables;
  editor tabs no longer shrink into each other; the VIN decoder button stacks under its field on phones;
  lead rows put date and badges on one line; booking week navigation uses arrow buttons on phones.
- Admin form controls are 16 px on phones so iOS Safari no longer zooms into focused fields.
- Demo admin login is a 5-digit passcode (`DEMO_ADMIN_PASSCODE`, default `00000`) instead of email/password.
- Inline nav links now start at 1280 px (six links); below that they are in the menu sheet.
- Demo state is written to `/tmp` on serverless hosts (Vercel's filesystem is read-only).

## [0.1.0] — Phases 1–6, demo mode — 2026-11-07

### Added
- Design system: Tailwind v4 `@theme` tokens (palette, glass levels, type scale, motion), UI
  primitives (buttons, fields, chips, badges, segmented control, dialog/sheet, toast, tooltip,
  skeleton, reveal), floating glass nav, footer with live hours, language toggle; `/dev/ui` gallery.
- Home: hero video player (AV1/H.264, portrait cut, idle load, reduced-motion poster), natural-language
  search with cycling placeholders, live inventory counter, sticky 360° scroll scene, rails, categories,
  why-us, financing and trade-in teasers, visit section, final CTA.
- Car360 viewer: canvas renderer, bisection loader with bounded concurrency, drag with inertia,
  scroll mode, keyboard, zoom frame, hover scrub on cards (12 frames).
- Inventory: URL-state filters (nuqs), sort, pagination, facets, AI search parse (`?ai=1`), empty state.
- Vehicle page: media stage, summary panel with sticky mobile bar, key specs, financing calculator
  (APR before payment, Québec taxes, example table), warranty class, similar vehicles, compare,
  favorites, ViewTransition card morph, 60-day sold window, custom 404, OG image, JSON-LD.
- Forms and booking: test drive (slots → details → consent), question, financing, trade-in, contact,
  inventory alert; Zod schemas shared with Server Actions, Turnstile, rate limiting, React Email
  FR/EN, ICS download, demo outbox.
- AI: streaming assistant (Vercel AI SDK, tools for inventory, knowledge base, payment, booking,
  handoff), guardrails and safety cases, daily budget with lead-form fallback, offline rules engine,
  lead briefs, description generator, 50-case eval suite.
- Admin: demo auth (signed cookie) or Supabase Auth, dashboard, vehicle list and editor with
  autosave, VIN decode, spin uploader and image pipeline, leads with AI briefs and CSV export,
  bookings, assistant settings and knowledge base, settings, audit journal.
- Supabase: schema, RLS, triggers, seed, storage buckets, repository implementations, media
  processing route; swappable with the demo seed through repository interfaces.
- SEO, analytics, consent: metadata and hreflang, sitemap, robots (disallow in demo), manifest,
  Plausible events, consent banner, demo label.
- Demo media pipeline: parametric three.js scene rendered in headless Chromium, 13 spin sets and
  galleries (AVIF/WebP, LQIP), placeholder hero loop encoded with `scripts/encode-hero.sh`.
- QA: Vitest suites, Playwright e2e (public, flows, admin) and axe on every page in both locales.
- Docs: README operations guide, `docs/decisions.md`, `docs/photo-guide.md`, `docs/credits.md`.

### Changed
- `--text-3` raised to 0.50 alpha for WCAG AA (Phase 0 review C2).

## [0.0.1] — Phase 0 — 2026-11-07

### Added
- `IDYA_AUTO_BRIEF.md` v2.0 committed as the functional source of truth.
- Next.js 16.4 / React 19.3 / TypeScript strict / Tailwind CSS v4 scaffold (pnpm, Turbopack,
  Cache Components on), reduced to a minimal French placeholder page.
- Tooling: ESLint flat config, `typecheck` script, Vitest with the first unit tests
  (`lib/format/number.ts`: FR/EN price and km formatting from brief §18).
- `CLAUDE.md` project conventions, `.env.example` (brief §22), `docs/client-todo.md`
  (every `[CLIENT: …]` placeholder and legal text to validate), `docs/phase-0-plan.md`
  (questions, phased plan, technical review of the brief).
