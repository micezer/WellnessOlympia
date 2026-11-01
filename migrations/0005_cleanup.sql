-- Migración manual: elimina columnas y tabla que la app ya no usa.
-- DESTRUCTIVA (borra esos datos). Idempotente. Aplicar la última, después de 0001–0004:
--   psql "$DATABASE_URL" -f migrations/0005_cleanup.sql
-- Las fechas del último formulario salen de player_wellness / player_load, y la lesión de
-- player_wellness.is_injured.

BEGIN;

ALTER TABLE players
  DROP COLUMN IF EXISTS injured,
  DROP COLUMN IF EXISTS load_percentage,
  DROP COLUMN IF EXISTS last_rpe_date,
  DROP COLUMN IF EXISTS last_wellness_date;

DROP TABLE IF EXISTS teams;

COMMIT;
