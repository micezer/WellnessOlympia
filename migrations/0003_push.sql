-- Migración manual: notificaciones push.
-- Idempotente. Aplicar con: psql "$DATABASE_URL" -f migrations/0003_push.sql

BEGIN;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS notify_prefs jsonb NOT NULL DEFAULT '{"wellness":true,"load":true}'::jsonb;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id serial PRIMARY KEY,
  role varchar(10) NOT NULL,
  user_id integer NOT NULL,
  endpoint text NOT NULL CONSTRAINT push_subscriptions_endpoint_unique UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamp DEFAULT now(),
  last_success_at timestamp
);

CREATE TABLE IF NOT EXISTS notification_log (
  id serial PRIMARY KEY,
  date date NOT NULL,
  kind varchar(30) NOT NULL,
  user_role varchar(10) NOT NULL,
  user_id integer NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_log_unique
  ON notification_log (date, kind, user_role, user_id);

COMMIT;
