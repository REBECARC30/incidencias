# Supabase — APP Incidencias

## 1. Crear proyecto en Supabase

1. Entra en [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. Espera a que termine el aprovisionamiento.

## 2. Ejecutar el esquema SQL

1. Abre **SQL Editor** en el panel de Supabase.
2. Copia y pega el contenido de [`schema.sql`](./schema.sql).
3. Pulsa **Run**.

Si la tabla `incidencias` **ya existía** de una versión anterior, ejecuta también las migraciones en este orden:

1. [`migration-fechas-apartados.sql`](./migration-fechas-apartados.sql) — columnas Desde/Hasta por apartado
2. [`migration-tratamiento-horas.sql`](./migration-tratamiento-horas.sql) — horas múltiples en tratamiento (si aplica)

Sin estas migraciones verás errores como *Could not find the 'dieta_desde' column in the schema cache* al registrar incidencias.

Esto crea:

- Tabla `personas`
- Tabla `incidencias` (con FK a `personas` y `auth.users`)
- Vista `incidencias_con_persona`
- Índices, RLS y políticas para usuarios autenticados
- Dos personas de ejemplo (opcional)

## 3. Crear usuario de acceso

En **Authentication → Users → Add user**:

| Campo | Valor |
|-------|-------|
| Email | `centro@appincidencias.local` |
| Password | La contraseña del centro |
| Auto Confirm User | Sí |

En **User metadata** (JSON):

```json
{
  "displayName": "Personal del centro"
}
```

## 4. Configurar la app

### Opción A — `public/config.json` (recomendado en Netlify)

La app lee **`/config.json` al arrancar** y usa ese Supabase (ignora el proyecto antiguo `vynreuh…`).

1. En Supabase → **Project Settings → API**, copia la **anon public** key de tu proyecto (`obczvycvnmhduopntshz`).
2. En el repo:

```bash
export SUPABASE_ANON_KEY=eyJ...
./scripts/write-config.sh
```

3. Sube `public/config.json` con el deploy (o commitea el archivo; la anon key es pública por diseño).

Plantilla: [`public/config.json.example`](../public/config.json.example)

### Opción B — variables `.env` (desarrollo local)

```env
VITE_SUPABASE_URL=https://obczvycvnmhduopntshz.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_SUPABASE_AUTH_EMAIL=centro@appincidencias.local
```

### Netlify

- Borra o vacía las variables `VITE_SUPABASE_*` del sitio si apuntaban a otro proyecto.
- Usa `public/config.json` **o** define las variables con la URL de **tu** proyecto.
- Si no hay Supabase válido, la app puede usar modo local con `VITE_APP_PASSWORD`.

Reinicia el servidor de desarrollo:

```bash
npm run dev
```

## 5. Mapeo columnas ↔ TypeScript

| TypeScript (app) | Columna SQL |
|------------------|-------------|
| `id` | `id` |
| `codigo` | `codigo` |
| `nombre` | `nombre` |
| `ala` | `ala` |
| `habitacion` | `habitacion` |
| `createdAt` | `created_at` |
| `personaId` | `persona_id` |
| `estadoOtros` | `estado_otros` |
| `caidaNaf` | `caida_naf` |
| `caidaAf` | `caida_af` |
| `hospitalTras` | `hospital_tras` |
| `hospitalRegr` | `hospital_regr` |
| `dietaOtros` | `dieta_otros` |
| `tratamientoOtros` | `tratamiento_otros` |
| `tratamientoOtrosHora` | `tratamiento_otros_hora` |
| `tratamientoOtrosForma` | `tratamiento_otros_forma` |
| `tratamientoOtrosFormaOtros` | `tratamiento_otros_forma_otros` |
| `procesoOtros` | `proceso_otros` |
| `ctesP` | `ctes_p` |
| `ctesT` | `ctes_t` |
| `ctesS` | `ctes_s` |
| `ctesTa` | `ctes_ta` |
| `ctesGlucemia` | `ctes_glucemia` |
| `ctesPeso` | `ctes_peso` |
| `firmaDibujo` | `firma_dibujo` |
| `createdBy` | `created_by` |
| `createdAt` | `created_at` |

## Estado actual de la app

- **Login:** Supabase Auth (o contraseña local si no hay Supabase).
- **Datos (personas e incidencias):** se guardan en Supabase cuando `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están configuradas; si no, en `localStorage`.
