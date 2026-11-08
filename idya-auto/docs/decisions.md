# Decisions — answers applied to the Phase 0 questions

Recorded so that `CLAUDE.md`, the brief and the code agree. Each entry names the Phase 0 question
(`docs/phase-0-plan.md` §A / §C), the default applied, and what it would take to change it.

| # | Question | Decision applied | To change |
|---|---|---|---|
| A1 | Repository | Build lives in `idya-auto/` of `velo1-hub/miam-s`; the Miam's Resto Café files are untouched. | Move the folder to its own repository; nothing in the code depends on the parent. |
| A2 | Hero video and demo media | No Higgsfield credits spent. Hero loop and 36-frame spins rendered locally from a parametric 3D scene (`scripts/render/`), encoded with the production pipeline. They are placeholders with the correct formats, sizes and behaviour. | Generate with Higgsfield (`docs/credits.md`), encode with `scripts/encode-hero.sh`, replace `public/media/` and `public/demo/vehicles/`. |
| A3 | Where demo media lives | `public/demo/` (24 MB, immutable cache headers via `next.config.ts`). | Move to Supabase Storage: the spin manifest already carries `baseUrl`. |
| A4 / C1 | Smooth scroll | Motion only, no Lenis, no GSAP. The home 360° scene uses native scroll with a sticky stage (`useScroll`). | Add Lenis in `MotionProvider` if the client insists on inertial scroll. |
| A5 | Map | Static directions link; embedded map appears when `NEXT_PUBLIC_GOOGLE_MAPS_KEY` is set. | — |
| A6 | Reviews | Section hidden until a Google Business Profile link is provided. | Fill `settings.reviews`. |
| A7 | Language | No automatic detection; `/` redirects to `/fr`; toggle keeps the equivalent page. | `localeDetection: true` in `i18n/routing.ts`. |
| A8 | Supabase / Vercel | Schema, RLS, triggers and seed delivered in `supabase/`; no project created (no credentials). | Create the project and run the migrations (README → Deploy). |
| A9 | SMS | Not implemented; `preferredContact: sms` is captured on leads for the sales team. | Add a Twilio sender in `lib/email/send.ts`'s sibling. |
| A10 | NL search cache | In-memory LRU per instance plus a 1.5 s race against the rules parser. | Persist in Supabase `search_cache`. |
| A11 | First token < 1.5 s | Measured from request to first streamed token; prompt cached with `cacheControl`; Haiku for parsing, Sonnet for chat. | — |
| C2 | `--text-3` | 0.50 alpha (4.9:1 on `--bg`). | — |
| C3 | Two red buttons | One red CTA per view; secondary actions use the Light button. | — |
| C5 | Credit rate | Displayed rate is the APR including mandatory fees (bisection in `lib/finance/payment.ts`), shown before the payment. | — |
| C6 | Warranty class | Suggested from km and age in the editor, editable, confirmed per vehicle. | — |
| C8 | Demo spins | Rendered in headless Chromium with three.js, not Node WebGL. | — |
| — | Logo sync (§3.2) | The client supplied the official logo as a storefront photo. `--red` moved from `#E10600` to `#E21F26` (sampled), tints re-derived (hover `#F0343B`, pressed `#B9161C`, text `#FF6064` at 6.8:1 on `--bg`, deep `#5C0B0E`). White on `--red` is 4.7:1. The mark is a vector tracing of the photo. | Drop the client SVG into `public/brand/logo.svg` and `components/ui/logo.tsx`. |
| — | AI models | `claude-sonnet-5-5` for chat and descriptions, `claude-haiku-5-5` for parsing and lead briefs; `temperature` omitted (Sonnet 5.5 rejects it with adaptive effort); `effort: "low"` for the fast model. | `lib/ai/client.ts`. |
| — | Red in headless screenshots | `backdrop-filter` does not render in SwiftShader screenshots; glass-3 got a dark base layer so dialogs stay legible everywhere. | — |
| — | Demo admin auth | Signed cookie opened by a 5-digit passcode (`DEMO_ADMIN_PASSCODE`, default `00000`) in demo mode; Supabase Auth + TOTP otherwise. | — |
| — | Robots in demo | `robots.txt` disallows everything and pages carry `noindex` while `DEMO_MODE=true`. | Set `DEMO_MODE=false`. |
