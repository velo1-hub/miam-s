# Groupe Nettoyage Montréal — website

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Claude API booking assistant · Supabase (optional) · Resend (optional).

```bash
pnpm install
cp .env.example .env.local      # add ANTHROPIC_API_KEY for the assistant
pnpm dev                        # http://localhost:3000
pnpm test                       # pricing unit tests
pnpm build && pnpm e2e          # Playwright smoke + booking flow
```

- French at `/`, English at `/en`. Content lives in `src/content/*` (services, zones, posts, FAQ, business facts).
- Pricing rules: `src/lib/pricing.ts` (`DEFAULT_RULES`). Availability rules: `src/lib/availability.ts` (`SCHEDULE`).
- Data: file store in `.data/db.json` by default; set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` to use Postgres (`supabase/migrations/0001_init.sql`).
- Admin: `/admin` with `ADMIN_PASSWORD`. Legacy URL redirects: `src/i18n/redirects.ts`.
- Assistant: `src/lib/assistant/run.ts` (tools: estimate_price, get_availability, book_appointment, create_lead). Model `claude-opus-5-5`, server-side refusal fallback enabled.
