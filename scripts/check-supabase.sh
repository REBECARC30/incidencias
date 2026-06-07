#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
source .env.production.local
set +a

echo "Checking personas table..."
curl -s "${VITE_SUPABASE_URL}/rest/v1/personas?select=id&limit=1" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}"
