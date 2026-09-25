# MIAM OS

The management layer for Miam's Resto Café (spec: [docs/09-miam-os.md](../docs/09-miam-os.md)).

| Path | What |
|---|---|
| `supabase/migrations/…_core.sql` | 73 tables: menu, orders, KDS, inventory, recipes, staff, CRM, finance, compliance, ecosystem hub |
| `supabase/migrations/…_logic_rls.sql` | Permission matrix, 86-everywhere, stock deduction, GST/QST totals, audits, alerts, reporting views, row-level security |
| `supabase/seed.sql` | Generated from `data/menu.json` by `scripts/generate-seed.mjs` |
| `supabase/tests/` | `local_shim.sql` (auth stub for plain Postgres) + `rls_test.sql` (behaviour and security tests) |
| `scripts/test-local.sh` | Creates a throwaway Postgres, applies everything, runs the tests |

```bash
node miam-os/scripts/generate-seed.mjs   # after menu changes
bash miam-os/scripts/test-local.sh       # needs PostgreSQL 15+ binaries installed locally
```

**Deploying to Supabase** (⚠️ owner creates the project in their own account, region Canada if available): `supabase link --project-ref <ref>` → `supabase db push` → run `seed.sql` once. Don't apply `tests/local_shim.sql` on Supabase.

**Never store card data here.** Payments keep only the certified provider's reference ids. The certified POS remains the sales record of truth for Revenu Québec.
