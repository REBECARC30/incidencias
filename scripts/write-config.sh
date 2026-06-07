#!/usr/bin/env bash
# Genera public/config.json para tu proyecto Supabase (obczvycvnmhduopntshz).
#
# Uso:
#   export SUPABASE_ANON_KEY=eyJ...   # Dashboard → Project Settings → API → anon public
#   ./scripts/write-config.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

KEY="${SUPABASE_ANON_KEY:-${VITE_SUPABASE_ANON_KEY:-}}"
if [[ -z "$KEY" ]]; then
  echo "❌ Define SUPABASE_ANON_KEY con la anon key de tu proyecto."
  echo "   Supabase → obczvycvnmhduopntshz → Project Settings → API → anon public"
  exit 1
fi

cat > public/config.json <<EOF
{
  "supabaseUrl": "https://obczvycvnmhduopntshz.supabase.co",
  "supabaseAnonKey": "$KEY",
  "supabaseAuthEmail": "centro@appincidencias.local"
}
EOF

echo "✓ Escrito public/config.json (no lo subas a Git si no quieres exponer la key; en Netlify puedes subirlo manualmente o usar variables)."
echo "  Para desplegar: npm run build && sube dist/ incluyendo config.json"
