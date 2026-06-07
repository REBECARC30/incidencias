#!/usr/bin/env bash
# Configura Supabase para APP Incidencias.
# Requisitos: `npx supabase login` y acceso al proyecto.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_NAME="${SUPABASE_PROJECT_NAME:-appincidencias}"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)}"
ORG_SLUG="${SUPABASE_ORG:-}"

echo "→ Proyecto Supabase: $PROJECT_NAME"

if ! npx supabase projects list >/dev/null 2>&1; then
  echo "Error: ejecuta primero: npx supabase login"
  exit 1
fi

if [[ -z "$ORG_SLUG" ]]; then
  echo "Organizaciones disponibles:"
  npx supabase orgs list
  echo ""
  echo "Exporta SUPABASE_ORG=slug-de-tu-org y vuelve a ejecutar."
  exit 1
fi

if ! npx supabase projects list 2>/dev/null | grep -q "$PROJECT_NAME"; then
  echo "→ Creando proyecto…"
  npx supabase projects create "$PROJECT_NAME" --org-id "$ORG_SLUG" --db-password "$DB_PASSWORD" --region eu-west-1
fi

REF="$(npx supabase projects list 2>/dev/null | awk -v n="$PROJECT_NAME" '$0 ~ n {print $1; exit}')"
if [[ -z "$REF" ]]; then
  echo "No se pudo obtener el project ref."
  exit 1
fi

echo "→ Project ref: $REF"
echo "→ Aplicando schema SQL…"
npx supabase db execute --project-ref "$REF" --file supabase/schema.sql

URL="https://${REF}.supabase.co"
ANON="$(npx supabase projects api-keys --project-ref "$REF" 2>/dev/null | awk '/anon/ {print $3; exit}')"

cat > .env.production.local <<EOF
VITE_SUPABASE_URL=$URL
VITE_SUPABASE_ANON_KEY=$ANON
VITE_SUPABASE_AUTH_EMAIL=centro@appincidencias.local
EOF

echo ""
echo "✓ Supabase configurado."
echo "  URL: $URL"
echo "  Variables guardadas en .env.production.local"
echo ""
echo "Siguiente paso manual en el panel de Supabase:"
echo "  Authentication → Users → Add user"
echo "    Email: centro@appincidencias.local"
echo "    Password: (la del centro)"
echo "    Metadata: {\"displayName\": \"Personal del centro\"}"
echo ""
echo "Luego reconstruye y despliega:"
echo "  set -a && source .env.production.local && set +a && npm run build"
echo "  npx wrangler pages deploy dist --project-name=appincidencias"
