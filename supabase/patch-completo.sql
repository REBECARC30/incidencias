-- =============================================================================
-- PATCH COMPLETO — APP Incidencias
-- Proyecto: obczvycvnmhduopntshz (o el tuyo)
-- Supabase → SQL Editor → pegar todo → Run
--
-- Seguro: solo AÑADE columnas si faltan. No falla si ya existen.
-- =============================================================================

ALTER TABLE public.incidencias
  ADD COLUMN IF NOT EXISTS dieta_desde                   text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS dieta_hasta                   text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tratamiento_desde             text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tratamiento_hasta             text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS proceso_desde                 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS proceso_hasta                 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tratamiento_otros_horas       text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ctes_glucemia                 text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ctes_peso                     text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS firma_dibujo                  text NOT NULL DEFAULT '';

-- Copiar periodo global antiguo (desde/hasta) → tratamiento, si aplica
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incidencias' AND column_name = 'desde'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incidencias' AND column_name = 'hasta'
  ) THEN
    EXECUTE $sql$
      UPDATE public.incidencias
      SET
        tratamiento_desde = COALESCE(NULLIF(tratamiento_desde, ''), NULLIF(desde, ''), ''),
        tratamiento_hasta = COALESCE(NULLIF(tratamiento_hasta, ''), NULLIF(hasta, ''), '')
      WHERE (COALESCE(tratamiento_desde, '') = '' AND COALESCE(desde, '') <> '')
         OR (COALESCE(tratamiento_hasta, '') = '' AND COALESCE(hasta, '') <> '')
    $sql$;
  END IF;
END $$;

-- Horas múltiples en "Otros" (desde hora única antigua)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incidencias' AND column_name = 'tratamiento_otros_hora'
  ) THEN
    EXECUTE $sql$
      UPDATE public.incidencias
      SET tratamiento_otros_horas = ARRAY[tratamiento_otros_hora]
      WHERE COALESCE(tratamiento_otros_hora, '') <> ''
        AND (tratamiento_otros_horas IS NULL OR tratamiento_otros_horas = '{}')
    $sql$;
  END IF;
END $$;

-- DE / A: varias áreas por incidencia (text[])
-- Ejecuta supabase/migration-areas-multiples.sql si de/a siguen siendo area_code simple.

-- Persona opcional en incidencias
-- Ejecuta supabase/migration-persona-opcional.sql si persona_id sigue siendo NOT NULL.

-- Refrescar API (obligatorio tras añadir columnas)
NOTIFY pgrst, 'reload schema';

-- Comprobar que las columnas nuevas existen (debe devolver 6 filas)
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'incidencias'
  AND column_name IN (
    'dieta_desde', 'dieta_hasta',
    'tratamiento_desde', 'tratamiento_hasta',
    'proceso_desde', 'proceso_hasta'
  )
ORDER BY column_name;
