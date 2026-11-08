# Idya Auto — website

Premium dealership website for Idya Auto (Québec), built by Veloria Labs. Functional brief:
[`IDYA_AUTO_BRIEF.md`](IDYA_AUTO_BRIEF.md). Conventions: [`CLAUDE.md`](CLAUDE.md). History:
[`CHANGELOG.md`](CHANGELOG.md). Decisions taken on the Phase 0 questions: [`docs/decisions.md`](docs/decisions.md).

**Status: full build delivered in demo mode** (brief §24, phases 1–6). The site runs end to end on a
local seed of 13 vehicles with locally rendered 360° media, demo leads and a demo admin account.
Switching `DEMO_MODE=false` with Supabase credentials moves every repository to Postgres without
touching the UI or the AI tools (brief §22 “repository interfaces”).

## Setup

Requires Node 22 and pnpm 10 (`corepack enable`).

```bash
pnpm install
cp .env.example .env.local
pnpm setup:demo        # writes the demo admin credentials into .env.local
pnpm dev               # http://localhost:3000/fr
```

Demo admin: `http://localhost:3000/admin/login`, passcode `00000` (override with `DEMO_ADMIN_PASSCODE`
in `.env.local`; `pnpm setup:demo` writes the default).

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Development server (Turbopack) |
| `pnpm lint` | ESLint (Next core-web-vitals, TypeScript, React Compiler rules) |
| `pnpm typecheck` | `next typegen` + `tsc --noEmit` |
| `pnpm test` | Vitest unit tests (finance, taxes, slots, ICS, hours, formatting, search parsing) |
| `pnpm build` | Production build (Cache Components) |
| `pnpm e2e` | Playwright end-to-end + axe on every public page, both locales, 390 px and 1440 px. Needs a prior `pnpm build`. |
| `pnpm eval` | AI assistant eval suite (50 cases, needs `ANTHROPIC_API_KEY`) |
| `pnpm render:spin` | Render demo 36-frame spins from the parametric 3D scene (headless Chromium) |
| `pnpm render:hero` | Render the 3D placeholder hero loop frames (superseded by the Higgsfield keyframes in `docs/brand/`) |
| `scripts/animate-hero-still.sh` | Composite the « Signature rouge » light choreography over a still keyframe into a 7 s loop master; then `scripts/encode-hero.sh` encodes H.264 + AV1 |
| `pnpm media:process` | Resize/encode rendered spins and galleries into `public/demo/vehicles` (AVIF + WebP, LQIP) |
| `pnpm setup:demo` | Create demo admin credentials in `.env.local` |

## Environment variables

All variables are listed with comments in [`.env.example`](.env.example). What each one unlocks:

| Variable | Effect when set |
|---|---|
| `DEMO_MODE` | `true`: seed JSON, demo media, demo leads, demo admin, « Mode démonstration » label, `robots` disallow. `false`: Supabase for everything. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, hreflang, OG images, email links |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Vehicles, leads, bookings, settings, knowledge base, chat logs, audit, storage, admin auth |
| `ADMIN_SESSION_SECRET` | Signs the demo admin cookie (falls back to the service-role key) |
| `ANTHROPIC_API_KEY`, `AI_DAILY_BUDGET_USD` | Assistant, natural-language search, lead briefs, description generator. Without a key the assistant runs its offline rules engine. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Confirmation and notification emails. Without a key, emails are written to `.cache/outbox/` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Anti-spam on every form (invisible). Skipped when absent. |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Embedded map in « Nous visiter » (static directions link otherwise) |
| `PLAUSIBLE_DOMAIN` | Cookieless analytics script + custom events (brief §21) |
| `PHOTOROOM_API_KEY` | Background removal in the spin pipeline (optional) |
| `DEMO_ADMIN_PASSCODE`, `DEMO_ADMIN_EMAIL` | Demo admin passcode (5 digits, default `00000`) and display email (demo mode only) |

Never commit `.env*` files. Demo-mode state (leads, settings overrides, vehicle drafts, outbox,
chat logs, AI usage) lives in the git-ignored `.cache/` folder.

## Deploy (Vercel)

1. Create the Vercel project from this repository with **Root Directory** `idya-auto`.
2. Add the environment variables above (Production + Preview). Set `DEMO_MODE=false` for production.
3. Create the Supabase project, run `supabase/migrations/*.sql` in order, then `supabase/seed.sql`
   (settings row, demo knowledge base). Create the storage buckets described at the top of
   `supabase/migrations/20261107000001_schema.sql`.
4. Create the first admin user in Supabase Auth and insert its `profiles` row with role `owner`
   (TOTP 2FA is enforced for owners, brief §15).
5. Point the domain, then set `NEXT_PUBLIC_SITE_URL` to it. `robots.txt` and the sitemap switch to
   indexable automatically when `DEMO_MODE` is off.

## Operations guide (brief §25)

### Replace the hero video
The home hero plays `settings.hero` sources (admin → Paramètres → Médias) or, when empty, the files in
`public/media/`: `hero-1080.av1.mp4`, `hero-1080.h264.mp4`, `hero-mobile.h264.mp4`, posters
`hero-poster.avif` / `hero-poster-mobile.avif`. Encode a new master with `scripts/encode-hero.sh in.mp4`
(H.264 High at 1080p ≤ 4 Mb/s, AV1, portrait cut, posters) and upload the five files, or drop them in
`public/media/`. The player idle-loads the video, prefers AV1 where supported, pauses off-screen and shows
the poster only under `prefers-reduced-motion` or `Save-Data`.

### Shoot and upload a 360° set
Follow [`docs/photo-guide.md`](docs/photo-guide.md) (36 photos, fixed tripod, turntable or marked
positions). In admin → Véhicules → vehicle → Médias, drop the 36 files: they are sorted by name,
uploaded to the private `originals` bucket, processed frame by frame (optional background removal,
union crop box, 4 sizes × AVIF/WebP, LQIP) and published to the public `spins` bucket with a new
`version`. The vehicle page picks it up on the next revalidation (tag `vehicles`).

### Edit the assistant knowledge base
Admin → Assistant → Base de connaissances: FR/EN question-answer pairs with an active switch. They
feed the `search_knowledge_base` tool. The same page shows top questions, recent conversations, the
on/off switch, after-hours behaviour and the daily budget. Once the budget is reached the launcher
turns into a lead form for the rest of the day.

### Vehicle lifecycle
Draft → Disponible → Réservé (pending) → Vendu. A sold vehicle stays reachable for 60 days (page shows
« Vendu » and similar vehicles), then returns 404 with a « Ce véhicule a déjà trouvé preneur » page
listing recent arrivals. The sitemap only lists visible vehicles.

### Leads
Every form and booking creates a lead (admin → Leads) with consent text and timestamp, an AI brief
(summary, intent, score, suggested reply) and a notification email. Bookings get an ICS file and a
confirmation email. Export: Leads → « Exporter CSV ». Retention is enforced by a scheduled job
(brief §17.4, to configure with Vercel Cron, UTC).

## Project layout

See `CLAUDE.md` → Repository layout, and the brief §22.
