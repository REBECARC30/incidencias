-- =============================================================================
-- APP Incidencias — esquema Supabase
-- =============================================================================
-- Ejecuta este script en: Supabase Dashboard → SQL Editor → New query → Run
--
-- Después del SQL, crea el usuario de acceso (ver sección final).
-- Variables .env de la app:
--   VITE_SUPABASE_URL
--   VITE_SUPABASE_ANON_KEY
--   VITE_SUPABASE_AUTH_EMAIL=centro@appincidencias.local  (opcional)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipos enumerados (opcionales, refuerzan integridad)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'turno_code') THEN
    CREATE TYPE public.turno_code AS ENUM ('M', 'T', 'N');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ala_code') THEN
    CREATE TYPE public.ala_code AS ENUM ('1', '2');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'area_code') THEN
    CREATE TYPE public.area_code AS ENUM (
      'A.D', 'A.S', 'A.T', 'P.R', 'EQ', 'A.C', 'A.L', 'A.R', 'A.CO'
    );
  END IF;

END $$;

-- -----------------------------------------------------------------------------
-- Función genérica updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Tabla: personas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.personas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      text NOT NULL,
  nombre      text NOT NULL,
  ala         public.ala_code NOT NULL,
  habitacion  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT personas_codigo_not_blank CHECK (length(trim(codigo)) > 0),
  CONSTRAINT personas_nombre_not_blank CHECK (length(trim(nombre)) > 0),
  CONSTRAINT personas_habitacion_not_blank CHECK (length(trim(habitacion)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS personas_codigo_unique_ci
  ON public.personas (lower(trim(codigo)));

CREATE INDEX IF NOT EXISTS personas_ala_habitacion_idx
  ON public.personas (ala, habitacion);

DROP TRIGGER IF EXISTS personas_set_updated_at ON public.personas;
CREATE TRIGGER personas_set_updated_at
  BEFORE UPDATE ON public.personas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Tabla: incidencias
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incidencias (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id                    uuid NOT NULL REFERENCES public.personas (id) ON DELETE RESTRICT,

  fecha                         date NOT NULL,
  turno                         public.turno_code NOT NULL,
  de                            public.area_code NOT NULL,
  a                             public.area_code NOT NULL,

  estado                        text[] NOT NULL DEFAULT '{}',
  estado_otros                  text NOT NULL DEFAULT '',

  incidencia                    text NOT NULL DEFAULT '',
  prioridad                     text NOT NULL DEFAULT ''
    CHECK (prioridad IN ('', 'baja', 'normal', 'alta', 'urgente')),
  lesiones                      text NOT NULL DEFAULT '',

  caida_naf                     boolean NOT NULL DEFAULT false,
  caida_af                      boolean NOT NULL DEFAULT false,
  hospital_tras                 boolean NOT NULL DEFAULT false,
  hospital_regr                 boolean NOT NULL DEFAULT false,

  dieta                         text[] NOT NULL DEFAULT '{}',
  dieta_otros                   text NOT NULL DEFAULT '',

  -- [{ "nombre": "...", "hora": "08:00", "forma": "oral", "formaOtros": "" }]
  tratamiento                   jsonb NOT NULL DEFAULT '[]'::jsonb,
  tratamiento_otros             text NOT NULL DEFAULT '',
  tratamiento_otros_hora        text NOT NULL DEFAULT '',
  tratamiento_otros_forma       text NOT NULL DEFAULT ''
    CHECK (tratamiento_otros_forma IN (
      '', 'oral', 'sublingual', 'topica', 'intravenosa', 'intramuscular',
      'subcutanea', 'inhalada', 'sonda', 'no_farmacologico', 'otra'
    )),
  tratamiento_otros_forma_otros text NOT NULL DEFAULT '',

  proceso                       text[] NOT NULL DEFAULT '{}',
  proceso_otros                 text NOT NULL DEFAULT '',

  desde                         text NOT NULL DEFAULT '',
  hasta                         text NOT NULL DEFAULT '',

  ctes_p                        text NOT NULL DEFAULT '',
  ctes_t                        text NOT NULL DEFAULT '',
  ctes_s                        text NOT NULL DEFAULT '',
  ctes_ta                       text NOT NULL DEFAULT '',
  ctes_glucemia                 text NOT NULL DEFAULT '',
  ctes_peso                     text NOT NULL DEFAULT '',

  observaciones                 text NOT NULL DEFAULT '',
  firma                         text NOT NULL DEFAULT '',
  firma_dibujo                  text NOT NULL DEFAULT '',

  created_by                    uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT incidencias_tratamiento_is_array
    CHECK (jsonb_typeof(tratamiento) = 'array')
);

CREATE INDEX IF NOT EXISTS incidencias_persona_id_idx
  ON public.incidencias (persona_id);

CREATE INDEX IF NOT EXISTS incidencias_fecha_idx
  ON public.incidencias (fecha DESC);

CREATE INDEX IF NOT EXISTS incidencias_created_at_idx
  ON public.incidencias (created_at DESC);

CREATE INDEX IF NOT EXISTS incidencias_turno_idx
  ON public.incidencias (turno);

CREATE INDEX IF NOT EXISTS incidencias_de_a_idx
  ON public.incidencias (de, a);

CREATE INDEX IF NOT EXISTS incidencias_tratamiento_gin_idx
  ON public.incidencias USING gin (tratamiento jsonb_path_ops);

CREATE INDEX IF NOT EXISTS incidencias_busqueda_idx
  ON public.incidencias USING gin (
    to_tsvector(
      'spanish',
      coalesce(incidencia, '') || ' ' ||
      coalesce(lesiones, '') || ' ' ||
      coalesce(observaciones, '') || ' ' ||
      coalesce(firma, '')
    )
  );

DROP TRIGGER IF EXISTS incidencias_set_updated_at ON public.incidencias;
CREATE TRIGGER incidencias_set_updated_at
  BEFORE UPDATE ON public.incidencias
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Vista útil: incidencias con datos de persona
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.incidencias_con_persona AS
SELECT
  i.*,
  p.codigo  AS persona_codigo,
  p.ala     AS persona_ala,
  p.habitacion AS persona_habitacion
FROM public.incidencias i
JOIN public.personas p ON p.id = i.persona_id;

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- Modelo: un login compartido del centro; cualquier usuario autenticado
-- puede leer y escribir. Anónimos no tienen acceso.
-- -----------------------------------------------------------------------------
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidencias ENABLE ROW LEVEL SECURITY;

-- Personas
DROP POLICY IF EXISTS "personas_select_authenticated" ON public.personas;
CREATE POLICY "personas_select_authenticated"
  ON public.personas FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "personas_insert_authenticated" ON public.personas;
CREATE POLICY "personas_insert_authenticated"
  ON public.personas FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "personas_update_authenticated" ON public.personas;
CREATE POLICY "personas_update_authenticated"
  ON public.personas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "personas_delete_authenticated" ON public.personas;
CREATE POLICY "personas_delete_authenticated"
  ON public.personas FOR DELETE
  TO authenticated
  USING (true);

-- Incidencias
DROP POLICY IF EXISTS "incidencias_select_authenticated" ON public.incidencias;
CREATE POLICY "incidencias_select_authenticated"
  ON public.incidencias FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "incidencias_insert_authenticated" ON public.incidencias;
CREATE POLICY "incidencias_insert_authenticated"
  ON public.incidencias FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "incidencias_update_authenticated" ON public.incidencias;
CREATE POLICY "incidencias_update_authenticated"
  ON public.incidencias FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "incidencias_delete_authenticated" ON public.incidencias;
CREATE POLICY "incidencias_delete_authenticated"
  ON public.incidencias FOR DELETE
  TO authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- Permisos
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incidencias TO authenticated;
GRANT SELECT ON public.incidencias_con_persona TO authenticated;

-- -----------------------------------------------------------------------------
-- Datos de ejemplo (opcional — comenta este bloque en producción)
-- -----------------------------------------------------------------------------
INSERT INTO public.personas (codigo, nombre, ala, habitacion)
SELECT 'USR-001', 'USR-001', '1'::public.ala_code, '101'
WHERE NOT EXISTS (
  SELECT 1 FROM public.personas WHERE lower(trim(codigo)) = 'usr-001'
);

INSERT INTO public.personas (codigo, nombre, ala, habitacion)
SELECT 'USR-002', 'USR-002', '2'::public.ala_code, '205'
WHERE NOT EXISTS (
  SELECT 1 FROM public.personas WHERE lower(trim(codigo)) = 'usr-002'
);

-- -----------------------------------------------------------------------------
-- Realtime: sincronización entre dispositivos (móvil, tablet, PC)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.personas;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.incidencias;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.personas REPLICA IDENTITY FULL;
ALTER TABLE public.incidencias REPLICA IDENTITY FULL;

-- =============================================================================
-- CONFIGURACIÓN DE AUTENTICACIÓN (manual en el panel de Supabase)
-- =============================================================================
-- 1. Authentication → Providers → Email: activado
-- 2. Authentication → Users → Add user → Create new user
--      Email:    centro@appincidencias.local
--      Password: (la contraseña del centro)
--      User metadata (JSON):
--        { "displayName": "Personal del centro" }
-- 3. Project Settings → API: copia URL y anon key a tu .env
-- 4. En la app (.env):
--      VITE_SUPABASE_URL=https://xxxx.supabase.co
--      VITE_SUPABASE_ANON_KEY=eyJ...
--      VITE_SUPABASE_AUTH_EMAIL=centro@appincidencias.local
--
-- Nota: la app ya usa Supabase Auth para el login. Para guardar personas e
-- incidencias en estas tablas (en lugar de localStorage), hay que conectar
-- la capa de datos de la app a Supabase en un siguiente paso.
-- =============================================================================
