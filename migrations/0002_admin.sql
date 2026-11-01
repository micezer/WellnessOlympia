-- Migración manual: cuenta de administrador y solicitudes de restablecer de coaches.
-- Idempotente. Aplicar con: psql "$DATABASE_URL" -f migrations/0002_admin.sql
-- Después, crear la cuenta admin: npm run create-admin -- <identifier> "<nombre>"

BEGIN;

ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS reset_requested_at timestamp;

CREATE TABLE IF NOT EXISTS admins (
  id serial PRIMARY KEY,
  name varchar(100) NOT NULL,
  identifier varchar(50) NOT NULL CONSTRAINT admins_identifier_unique UNIQUE,
  created_at timestamp DEFAULT now(),
  password_hash varchar(100),
  password_set_at timestamp,
  token_version integer NOT NULL DEFAULT 0,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamp
);

COMMIT;
