-- Horas múltiples en tratamiento "Otros"
-- Ejecutar en Supabase → SQL Editor si la tabla incidencias ya existía

ALTER TABLE public.incidencias
  ADD COLUMN IF NOT EXISTS tratamiento_otros_horas text[] NOT NULL DEFAULT '{}';

UPDATE public.incidencias
SET tratamiento_otros_horas = ARRAY[tratamiento_otros_hora]
WHERE coalesce(tratamiento_otros_hora, '') <> ''
  AND (tratamiento_otros_horas IS NULL OR tratamiento_otros_horas = '{}');
