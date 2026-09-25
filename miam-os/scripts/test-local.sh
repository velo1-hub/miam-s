#!/usr/bin/env bash
# Spins up a throwaway local PostgreSQL, applies the MIAM OS migrations + seed, runs the RLS/behaviour tests.
#   bash miam-os/scripts/test-local.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGBIN="$(ls -d /usr/lib/postgresql/*/bin | tail -1)"
TMP="$(mktemp -d)"
PORT=54329
trap '"$PGBIN/pg_ctl" -D "$TMP/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$TMP"' EXIT
if [ "$(id -u)" = "0" ]; then RUN="runuser -u postgres --"; chown -R postgres "$TMP"; else RUN=""; fi
$RUN "$PGBIN/initdb" -D "$TMP/data" -U postgres -A trust >/dev/null
$RUN "$PGBIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/log" start >/dev/null
PSQL="psql -h $TMP -p $PORT -U postgres -d postgres -v ON_ERROR_STOP=1 -q"
$PSQL -f "$ROOT/miam-os/supabase/tests/local_shim.sql"
for f in "$ROOT"/miam-os/supabase/migrations/*.sql; do echo "migrate: $(basename "$f")"; $PSQL -f "$f"; done
$PSQL -f "$ROOT/miam-os/supabase/seed.sql"
echo "tables: $($PSQL -tAc "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'")  views: $($PSQL -tAc "select count(*) from information_schema.views where table_schema='public'")"
$PSQL -f "$ROOT/miam-os/supabase/tests/rls_test.sql" 2>&1 | sed 's/^psql:[^:]*:[0-9]*: //'
