#!/usr/bin/env bash
# Crea proyecto Supabase, aplica schema, crea usuario y despliega en Cloudflare.
#
# Uso (después de obtener token en https://supabase.com/dashboard/account/tokens):
#   export SUPABASE_ACCESS_TOKEN=sbp_...
#   ./scripts/setup-and-deploy.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_NAME="${SUPABASE_PROJECT_NAME:-appincidencias}"
REGION="${SUPABASE_REGION:-eu-west-1}"
AUTH_EMAIL="${VITE_SUPABASE_AUTH_EMAIL:-centro@appincidencias.local}"
AUTH_PASSWORD="${SUPABASE_AUTH_PASSWORD:?Define SUPABASE_AUTH_PASSWORD con la contraseña del centro}"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "❌ Falta SUPABASE_ACCESS_TOKEN"
  echo ""
  echo "El login con GitHub NO funciona en el navegador de Cursor."
  echo "Haz esto en Safari o Chrome:"
  echo "  1. https://supabase.com/dashboard/sign-in → Continue with GitHub"
  echo "  2. https://supabase.com/dashboard/account/tokens → Generate new token"
  echo "  3. export SUPABASE_ACCESS_TOKEN=sbp_tu_token"
  echo "  4. ./scripts/setup-and-deploy.sh"
  exit 1
fi

API="https://api.supabase.com/v1"
auth_hdr=(-H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" -H "Content-Type: application/json")

echo "→ Obteniendo organización…"
ORG_JSON="$(curl -s "${auth_hdr[@]}" "$API/organizations")"
ORG_ID="$(echo "$ORG_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')" 2>/dev/null || true)"
if [[ -z "$ORG_ID" ]]; then
  echo "❌ No se pudo leer la organización. ¿Token válido?"
  echo "$ORG_JSON"
  exit 1
fi
echo "   Org: $ORG_ID"

echo "→ Buscando proyecto '$PROJECT_NAME'…"
PROJECTS="$(curl -s "${auth_hdr[@]}" "$API/projects")"
REF="$(echo "$PROJECTS" | python3 -c "
import sys, json
name = '$PROJECT_NAME'
for p in json.load(sys.stdin):
    if p.get('name') == name:
        print(p['id'])
        break
" 2>/dev/null || true)"

if [[ -z "$REF" ]]; then
  echo "→ Creando proyecto (puede tardar 2-3 min)…"
  CREATE="$(curl -s "${auth_hdr[@]}" -X POST "$API/projects" -d "{
    \"organization_id\": \"$ORG_ID\",
    \"name\": \"$PROJECT_NAME\",
    \"db_pass\": \"$DB_PASSWORD\",
    \"region\": \"$REGION\"
  }")"
  REF="$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || true)"
  if [[ -z "$REF" ]]; then
    echo "❌ Error creando proyecto:"
    echo "$CREATE"
    exit 1
  fi
  echo "   Ref: $REF — esperando a que esté listo…"
  for i in $(seq 1 60); do
    STATUS="$(curl -s "${auth_hdr[@]}" "$API/projects/$REF" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || true)"
    if [[ "$STATUS" == "ACTIVE_HEALTHY" ]]; then
      break
    fi
    sleep 5
  done
else
  echo "   Ya existe: $REF"
fi

URL="https://${REF}.supabase.co"

echo "→ Aplicando schema SQL…"
SQL="$(python3 -c "
import json, pathlib
print(json.dumps({'query': pathlib.Path('supabase/schema.sql').read_text()}))
")"
SQL_RESULT="$(curl -s "${auth_hdr[@]}" -X POST "$API/projects/$REF/database/query" -d "$SQL")"
if echo "$SQL_RESULT" | grep -qi '"error"'; then
  echo "⚠️  SQL (puede ser parcial si tablas ya existían):"
  echo "$SQL_RESULT" | head -c 500
  echo ""
fi

echo "→ Obteniendo API keys…"
KEYS="$(curl -s "${auth_hdr[@]}" "$API/projects/$REF/api-keys")"
ANON="$(echo "$KEYS" | python3 -c "
import sys,json
for k in json.load(sys.stdin):
    if k.get('name')=='anon':
        print(k['api_key']); break
" 2>/dev/null || true)"
SERVICE="$(echo "$KEYS" | python3 -c "
import sys,json
for k in json.load(sys.stdin):
    if k.get('name')=='service_role':
        print(k['api_key']); break
" 2>/dev/null || true)"

if [[ -z "$ANON" || -z "$SERVICE" ]]; then
  echo "❌ No se pudieron obtener las API keys"
  echo "$KEYS"
  exit 1
fi

echo "→ Creando usuario de acceso…"
USER_RESULT="$(curl -s -X POST "$URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE" \
  -H "Authorization: Bearer $SERVICE" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$AUTH_EMAIL\",
    \"password\": \"$AUTH_PASSWORD\",
    \"email_confirm\": true,
    \"user_metadata\": {\"displayName\": \"Personal del centro\"}
  }")"
if echo "$USER_RESULT" | grep -qi 'already been registered'; then
  echo "   Usuario ya existía (ok)"
elif echo "$USER_RESULT" | grep -qi '"id"'; then
  echo "   Usuario creado"
else
  echo "⚠️  Usuario:" "$USER_RESULT"
fi

cat > .env.production.local <<EOF
VITE_SUPABASE_URL=$URL
VITE_SUPABASE_ANON_KEY=$ANON
VITE_SUPABASE_AUTH_EMAIL=$AUTH_EMAIL
EOF

echo "→ Variables guardadas en .env.production.local"
echo "→ Compilando…"
set -a && source .env.production.local && set +a
npm run build

echo "→ Desplegando en Cloudflare Pages…"
npx wrangler pages deploy dist --project-name=appincidencias --commit-dirty=true

echo ""
echo "✅ Listo"
echo "   App:    https://appincidencias.pages.dev"
echo "   Supabase: $URL"
echo "   Login:  $AUTH_EMAIL / (contraseña del centro)"
