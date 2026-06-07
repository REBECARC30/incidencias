-- Persona opcional en incidencias (incidencias generales sin paciente concreto)
-- Ejecutar en Supabase → SQL Editor.

DROP VIEW IF EXISTS public.incidencias_con_persona;

ALTER TABLE public.incidencias
  ALTER COLUMN persona_id DROP NOT NULL;

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

-- Comprobar (is_nullable debe ser YES)
SELECT column_name, is_nullable, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'incidencias'
  AND column_name = 'persona_id';
