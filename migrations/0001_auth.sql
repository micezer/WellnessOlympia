-- Migración manual: contraseñas y auditoría.
-- Idempotente (IF NOT EXISTS) porque la BD de producción se modificó a mano y no tiene historial de drizzle.
-- Aplicar con: psql "$DATABASE_URL" -f migrations/0001_auth.sql

BEGIN;

ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS password_hash varchar(100),
  ADD COLUMN IF NOT EXISTS password_set_at timestamp,
  ADD COLUMN IF NOT EXISTS token_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamp;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS password_hash varchar(100),
  ADD COLUMN IF NOT EXISTS password_set_at timestamp,
  ADD COLUMN IF NOT EXISTS token_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamp,
  ADD COLUMN IF NOT EXISTS reset_requested_at timestamp;

CREATE TABLE IF NOT EXISTS auth_events (
  id serial PRIMARY KEY,
  role varchar(10) NOT NULL,
  identifier varchar(50) NOT NULL,
  event varchar(20) NOT NULL,
  ip varchar(100),
  user_agent text,
  actor varchar(50),
  created_at timestamp DEFAULT now()
);

COMMIT;
