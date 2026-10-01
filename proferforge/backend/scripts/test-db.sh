#!/usr/bin/env bash
# Throwaway local PostgreSQL: applies the assistant migrations and runs the RLS / constraint tests.
#   bash proferforge/backend/scripts/test-db.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PGBIN="$(ls -d /usr/lib/postgresql/*/bin | tail -1)"
TMP="$(mktemp -d)"; PORT=54331
trap '"$PGBIN/pg_ctl" -D "$TMP/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$TMP"' EXIT
if [ "$(id -u)" = "0" ]; then RUN="runuser -u postgres --"; chown -R postgres "$TMP"; else RUN=""; fi
$RUN "$PGBIN/initdb" -D "$TMP/data" -U postgres -A trust >/dev/null
$RUN "$PGBIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/log" start >/dev/null
PSQL="psql -h $TMP -p $PORT -U postgres -d postgres -v ON_ERROR_STOP=1 -q"
$PSQL -f "$ROOT/miam-os/supabase/tests/local_shim.sql"
for f in "$ROOT"/proferforge/backend/supabase/migrations/*.sql; do echo "migrate: $(basename "$f")"; $PSQL -f "$f"; done
$PSQL -f "$ROOT/proferforge/backend/supabase/tests/rls_test.sql" 2>&1 | sed 's/^psql:[^:]*:[0-9]*: //'
