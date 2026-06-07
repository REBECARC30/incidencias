-- DE y A: selección múltiple (text[])
-- Ejecutar en Supabase → SQL Editor (proyecto obczvycvnmhduopntshz).
-- Seguro: detecta el tipo actual y solo migra si hace falta.

DROP INDEX IF EXISTS public.incidencias_de_a_idx;
DROP INDEX IF EXISTS public.incidencias_de_gin_idx;
DROP INDEX IF EXISTS public.incidencias_a_gin_idx;

-- La vista bloquea ALTER TYPE si existe
DROP VIEW IF EXISTS public.incidencias_con_persona;

DO $$
DECLARE
  de_udt text;
  a_udt text;
BEGIN
  SELECT udt_name INTO de_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'incidencias'
    AND column_name = 'de';

  SELECT udt_name INTO a_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'incidencias'
    AND column_name = 'a';

  IF de_udt IS NULL OR a_udt IS NULL THEN
    RAISE EXCEPTION 'No existen las columnas de o a en public.incidencias';
  END IF;

  IF de_udt = 'area_code' THEN
    EXECUTE 'ALTER TABLE public.incidencias ALTER COLUMN de DROP DEFAULT';
    EXECUTE $sql$
      ALTER TABLE public.incidencias
        ALTER COLUMN de TYPE text[] USING ARRAY[de::text]
    $sql$;
    EXECUTE $sql$
      ALTER TABLE public.incidencias
        ALTER COLUMN de SET DEFAULT '{}'::text[],
        ALTER COLUMN de SET NOT NULL
    $sql$;
  ELSIF de_udt = '_area_code' THEN
    EXECUTE $sql$
      ALTER TABLE public.incidencias
        ALTER COLUMN de TYPE text[] USING de::text[]
    $sql$;
    EXECUTE $sql$
      ALTER TABLE public.incidencias
        ALTER COLUMN de SET DEFAULT '{}'::text[],
        ALTER COLUMN de SET NOT NULL
    $sql$;
  ELSIF de_udt <> '_text' THEN
    RAISE EXCEPTION 'Tipo inesperado en incidencias.de: %', de_udt;
  END IF;

  IF a_udt = 'area_code' THEN
    EXECUTE 'ALTER TABLE public.incidencias ALTER COLUMN a DROP DEFAULT';
    EXECUTE $sql$
      ALTER TABLE public.incidencias
        ALTER COLUMN a TYPE text[] USING ARRAY[a::text]
    $sql$;
    EXECUTE $sql$
      ALTER TABLE public.incidencias
        ALTER COLUMN a SET DEFAULT '{}'::text[],
        ALTER COLUMN a SET NOT NULL
    $sql$;
  ELSIF a_udt = '_area_code' THEN
    EXECUTE $sql$
      ALTER TABLE public.incidencias
        ALTER COLUMN a TYPE text[] USING a::text[]
    $sql$;
    EXECUTE $sql$
      ALTER TABLE public.incidencias
        ALTER COLUMN a SET DEFAULT '{}'::text[],
        ALTER COLUMN a SET NOT NULL
    $sql$;
  ELSIF a_udt <> '_text' THEN
    RAISE EXCEPTION 'Tipo inesperado en incidencias.a: %', a_udt;
  END IF;
END $$;

ALTER TABLE public.incidencias
  DROP CONSTRAINT IF EXISTS incidencias_de_check,
  DROP CONSTRAINT IF EXISTS incidencias_a_check;

ALTER TABLE public.incidencias
  ADD CONSTRAINT incidencias_de_check CHECK (
    de <@ ARRAY['A.D', 'A.S', 'A.T', 'P.R', 'EQ', 'A.C', 'A.L', 'A.R', 'A.CO']::text[]
  ),
  ADD CONSTRAINT incidencias_a_check CHECK (
    a <@ ARRAY['A.D', 'A.S', 'A.T', 'P.R', 'EQ', 'A.C', 'A.L', 'A.R', 'A.CO']::text[]
  );

CREATE INDEX IF NOT EXISTS incidencias_de_gin_idx
  ON public.incidencias USING gin (de array_ops);

CREATE INDEX IF NOT EXISTS incidencias_a_gin_idx
  ON public.incidencias USING gin (a array_ops);

CREATE OR REPLACE VIEW public.incidencias_con_persona AS
SELECT
  i.*,
  p.codigo AS persona_codigo,
  p.ala AS persona_ala,
  p.habitacion AS persona_habitacion
FROM public.incidencias i
LEFT JOIN public.personas p ON p.id = i.persona_id;

GRANT SELECT ON public.incidencias_con_persona TO authenticated;

NOTIFY pgrst, 'reload schema';

-- Comprobar (debe mostrar ARRAY / _text para de y a)
SELECT column_name, udt_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'incidencias'
  AND column_name IN ('de', 'a')
ORDER BY column_name;
