-- Fechas por apartado (Dieta, Tratamiento, Proceso)
-- Ejecutar en Supabase → SQL Editor si la tabla incidencias ya existía

ALTER TABLE public.incidencias
  ADD COLUMN IF NOT EXISTS dieta_fecha text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tratamiento_fecha text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS proceso_fecha text NOT NULL DEFAULT '';
