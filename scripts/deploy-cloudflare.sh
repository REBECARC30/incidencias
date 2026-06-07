#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${VITE_SUPABASE_URL:-}" || -z "${VITE_SUPABASE_ANON_KEY:-}" ]]; then
  echo "Error: define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY antes de desplegar."
  echo "Ejemplo:"
  echo "  export VITE_SUPABASE_URL=https://xxxx.supabase.co"
  echo "  export VITE_SUPABASE_ANON_KEY=eyJ..."
  exit 1
fi

echo "→ Compilando…"
npm run build

echo "→ Desplegando en Cloudflare Pages…"
npx wrangler pages deploy dist --project-name=appincidencias --commit-dirty=true

echo "✓ Despliegue completado."
