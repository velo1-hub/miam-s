# Pro Fer Forgé: virtual assistant backend

A chat assistant on the website that qualifies leads, books free site visits, builds the client dossier, scores each lead (hot / warm / cold), drafts the quote, and tells the owner what to do next. A private staff dashboard at `/admin/` shows all of it.

```
Website widget (src/assistant.js)  ──POST──▶  Supabase Edge Function "assistant"  ──▶  Claude (Anthropic API, tool use)
                                                  │  tools run server-side, validated:
                                                  │  update_dossier · get_available_slots · book_visit · complete_intake · request_human
                                                  ▼
                                    Postgres (leads, conversation, appointments, quote drafts, settings) ── RLS ──▶ /admin/ dashboard
                                                  │
                                                  └─▶ owner email (Resend) on booking, completed intake, urgent call-back
```

## What the model decides, and what it does not

| Decided by Claude | Decided by code (deterministic, tested) |
|---|---|
| What to ask next, how to phrase it, in FR or EN | Validation of every value it saves (phone, email, postal code, enums) |
| When to save facts, offer slots, finish | Which visit slots exist (owner's hours, Montréal time zone, 24 h notice, no double booking) |
| The short summary for the owner | Lead score and temperature (`scoring.ts`, explainable points) |
| | Quote draft lines, quantities, GST/QST (`quote.ts`). **Prices come only from the owner's rate card; never invented** |
| | Next-step suggestions (`suggestions.ts`) |

The prompt forbids giving prices, inventing company facts, or revealing the score. Client messages and tool results are treated as data.

## Files

| Path | Role |
|---|---|
| `supabase/migrations/0001_assistant.sql` | Tables, constraints, RLS, dashboard view. No prices or hours are seeded. |
| `supabase/functions/assistant/index.ts` | Edge Function entry (Anthropic SDK + Supabase repo + email notifier) |
| `supabase/functions/_shared/agent.ts` | The turn loop: append-only history, tool execution, error/refusal handling |
| `supabase/functions/_shared/prompt.ts` | System prompt and tool schemas (byte-stable for prompt caching) |
| `supabase/functions/_shared/{dossier,scoring,slots,quote,suggestions,ics}.ts` | Pure business logic |
| `supabase/functions/_shared/http.ts` | HTTP API, CORS, input limits, rate limiting |
| `dev-server.mjs` | Local preview of site + API with in-memory data (scripted DEMO brain unless an API key is set) |
| `tests/*.test.mjs`, `supabase/tests/rls_test.sql` | Unit/flow tests and database security tests |
| `../src/admin/` | Staff dashboard (built to `dist/admin/`) |

## Run the tests

```bash
node --test proferforge/backend/tests/*.test.mjs  # 17 tests: scoring, slots (DST), quotes, full scripted conversations, HTTP
bash proferforge/backend/scripts/test-db.sh       # migration + RLS on a throwaway local PostgreSQL
```

## Try it locally

```bash
PF_ASSISTANT_URL=/api/assistant PF_ASSISTANT_DEMO=1 node proferforge/build.mjs
node proferforge/backend/dev-server.mjs           # http://localhost:4321 · dashboard: /admin/
```

Without `ANTHROPIC_API_KEY` the widget runs a scripted demo (no AI) so the flow, booking and dashboard can be clicked through. With a key and `npm i @anthropic-ai/sdk`, the real model answers. Rebuild without the two variables before deploying.

## Deploy (owner or developer, once)

1. **Supabase project** (Canada region if offered): run the migration (`supabase db push`, or paste `0001_assistant.sql` in the SQL editor).
2. **Staff access:** create the owner in Authentication → Users (email), then
   `insert into staff_users (auth_user_id, email, role) values ('<user id>', 'owner@…', 'owner');`
   Turn off public sign-ups in Auth settings.
3. **Secrets:** `supabase secrets set ANTHROPIC_API_KEY=… ALLOWED_ORIGINS=https://proferforge.ca RESEND_API_KEY=… NOTIFY_TO=info@proferforge.ca NOTIFY_FROM="Assistant <assistant@proferforge.ca>" DASHBOARD_URL=https://proferforge.ca/admin/`
   Optional: `ASSISTANT_MODEL` (default `claude-opus-5-5`), `ASSISTANT_EFFORT` (default `low` for fast chat replies), `ASSISTANT_FALLBACKS=off`.
4. **Function:** `supabase functions deploy assistant --no-verify-jwt` (public chat; abuse limited by input caps and rate limits).
5. **Site build:** `PF_ASSISTANT_URL=https://<project>.supabase.co/functions/v1/assistant PF_SUPABASE_URL=https://<project>.supabase.co PF_SUPABASE_ANON_KEY=<anon key> node proferforge/build.mjs`
6. **Dashboard → Paramètres:** enter the RBQ number, warranty and payment terms, prices in the rate card, and visit hours. Until hours exist the assistant offers a call-back instead of slots; until prices exist quote lines stay "à compléter".

## Notes

- **Model:** Claude Opus 5.5 (`claude-opus-5-5`) through the official SDK, adaptive thinking (default), effort `low` for chat latency. Server-side refusal fallback (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`) is **on by default**; turn it off with `ASSISTANT_FALLBACKS=off`. The conversation is stored exactly as exchanged and replayed append-only, which keeps prompt caching and thinking blocks valid.
- **Not tested here:** live calls to the Anthropic API, Supabase and Resend (no credentials in this environment). The same code paths run in the tests with a scripted model and an in-memory store; the SQL runs on real PostgreSQL.
- **Cost:** each chat turn is one to three model calls; the system prompt and tools are cached across turns. Watch usage in the Anthropic console during the first weeks.
- **Law 25:** consent is collected in the widget before the first message, the privacy policy has a "virtual assistant" section, and scoring is only a priority aid (a person always decides). The privacy officer must be named in `src/config.mjs`.
