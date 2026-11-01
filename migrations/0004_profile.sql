-- Migración manual: perfil personalizable de la jugadora (apodo, dorsal, color del avatar).
-- Idempotente. Aplicar con: psql "$DATABASE_URL" -f migrations/0004_profile.sql

BEGIN;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS nickname varchar(30),
  ADD COLUMN IF NOT EXISTS shirt_number smallint,
  ADD COLUMN IF NOT EXISTS avatar_color varchar(7);

COMMIT;
