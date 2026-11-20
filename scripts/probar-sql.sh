#!/usr/bin/env bash
# Prueba el esquema en un Postgres temporal (sin Supabase): corre la migración
# y la semilla DOS veces (deben ser idempotentes) y luego supabase/pruebas/*_test.sql (base_test primero).
# En Windows usa scripts/probar-sql.ps1 (corre este mismo script dentro de Docker).
# Uso: bash scripts/probar-sql.sh   (necesita Postgres 15+ instalado: initdb, pg_ctl, psql)
set -euo pipefail
cd "$(dirname "$0")/.."

PGBIN="${PGBIN:-$(dirname "$(command -v pg_ctl 2>/dev/null || ls /usr/lib/postgresql/*/bin/pg_ctl | tail -1)")}"
TMP="$(mktemp -d)"
PORT="${PORT:-55432}"
trap '"$PGBIN/pg_ctl" -D "$TMP/data" stop -m fast >/dev/null 2>&1 || true; rm -rf "$TMP"' EXIT

"$PGBIN/initdb" -D "$TMP/data" -U postgres -A trust >/dev/null
"$PGBIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP" -l "$TMP/log" start >/dev/null
PSQL=(psql -h "$TMP" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
export PGOPTIONS="-c client_min_messages=warning"

"${PSQL[@]}" -f supabase/pruebas/postgres_local_auth_stub.sql
for i in 1 2; do
  for f in supabase/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
  "${PSQL[@]}" -f supabase/seed.sql
done
echo "Migración y semilla corren dos veces sin error."
for f in supabase/pruebas/*_test.sql; do "${PSQL[@]}" -f "$f"; done
