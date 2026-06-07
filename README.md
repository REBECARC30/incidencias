# APP Incidencias

App web para registro de incidencias en centros de atención, basada en la plantilla Word del centro.

## Arrancar en local

```bash
npm install
cp .env.example .env
```

Edita `.env` y define `VITE_APP_PASSWORD` con la contraseña del centro. Luego:

```bash
npm run dev
```

Abre `http://localhost:5173` en el navegador.

> **Importante:** el archivo `.env` no se sube a Git. Cada entorno (local, Cloudflare Pages, etc.) debe tener su propia contraseña configurada.

## Conectar Supabase (recomendado en producción)

1. Ejecuta el SQL de [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor de Supabase.
2. Sigue la guía en [`supabase/README.md`](supabase/README.md) para crear el usuario y configurar `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_AUTH_EMAIL` (opcional)

Si Supabase está configurado, la app usa autenticación del servidor en lugar de la contraseña local.

## Despliegue Cloudflare Pages

Proyecto: **appincidencias** → [https://appincidencias.pages.dev](https://appincidencias.pages.dev)

### Despliegue manual

```bash
npm run build
npx wrangler pages deploy dist --project-name=appincidencias
```

O con el script (requiere variables Supabase en el entorno):

```bash
chmod +x scripts/deploy-cloudflare.sh
./scripts/deploy-cloudflare.sh
```

### Configurar Supabase en producción

1. Crea el proyecto en [supabase.com](https://supabase.com) y ejecuta [`supabase/schema.sql`](supabase/schema.sql).
2. Crea el usuario en **Authentication → Users** (ver [`supabase/README.md`](supabase/README.md)).
3. Reconstruye con las variables Supabase (Vite las embebe en el build):

```bash
export VITE_SUPABASE_URL=https://xxxx.supabase.co
export VITE_SUPABASE_ANON_KEY=eyJ...
export VITE_SUPABASE_AUTH_EMAIL=centro@appincidencias.local
npm run build
npx wrangler pages deploy dist --project-name=appincidencias
```

También puedes usar `scripts/setup-supabase.sh` tras `npx supabase login`.

Variables de entorno en Cloudflare Pages (si conectas Git): las mismas `VITE_*` en **Settings → Environment variables** del proyecto.
