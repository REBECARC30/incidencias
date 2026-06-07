-- =============================================================================
-- APP Incidencias — activar sincronización en tiempo real entre dispositivos
-- =============================================================================
-- Ejecuta este script en Supabase → SQL Editor después de schema.sql
-- =============================================================================

-- Añade las tablas a la publicación Realtime (ignora error si ya existen)
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

-- Replica identity completa para recibir UPDATE/DELETE en Realtime
ALTER TABLE public.personas REPLICA IDENTITY FULL;
ALTER TABLE public.incidencias REPLICA IDENTITY FULL;
