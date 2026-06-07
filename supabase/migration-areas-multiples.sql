-- DE y A: de un solo valor (area_code) a selección múltiple (area_code[])
-- Ejecutar en Supabase → SQL Editor si incidencias.de / incidencias.a son enum simples.

DROP INDEX IF EXISTS public.incidencias_de_a_idx;

ALTER TABLE public.incidencias
  ALTER COLUMN de DROP DEFAULT,
  ALTER COLUMN a DROP DEFAULT;

ALTER TABLE public.incidencias
  ALTER COLUMN de TYPE public.area_code[] USING ARRAY[de],
  ALTER COLUMN a TYPE public.area_code[] USING ARRAY[a];

ALTER TABLE public.incidencias
  ALTER COLUMN de SET DEFAULT '{}',
  ALTER COLUMN a SET DEFAULT '{}';

CREATE INDEX IF NOT EXISTS incidencias_de_gin_idx
  ON public.incidencias USING gin (de);

CREATE INDEX IF NOT EXISTS incidencias_a_gin_idx
  ON public.incidencias USING gin (a);

NOTIFY pgrst, 'reload schema';
