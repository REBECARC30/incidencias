# Supabase — APP Incidencias

## 1. Crear proyecto en Supabase

1. Entra en [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. Espera a que termine el aprovisionamiento.

## 2. Ejecutar el esquema SQL

1. Abre **SQL Editor** en el panel de Supabase.
2. Copia y pega el contenido de [`schema.sql`](./schema.sql).
3. Pulsa **Run**.

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

En tu `.env`:

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_SUPABASE_AUTH_EMAIL=centro@appincidencias.local
```

La URL y la anon key están en **Project Settings → API**.

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
