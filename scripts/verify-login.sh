#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
set -a && source .env.production.local && set +a
: "${SUPABASE_AUTH_PASSWORD:?Define SUPABASE_AUTH_PASSWORD con la contraseña del centro}"
curl -s "${VITE_SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${VITE_SUPABASE_AUTH_EMAIL}\",\"password\":\"${SUPABASE_AUTH_PASSWORD}\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('login_ok' if d.get('access_token') else d)"
