-- Migración manual: "Novedades" vistas y consultas al administrador.
-- Idempotente. Aplicar con: psql "$DATABASE_URL" -f migrations/0006_news_inquiries.sql

BEGIN;

ALTER TABLE players ADD COLUMN IF NOT EXISTS news_seen integer NOT NULL DEFAULT 0;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS news_seen integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS inquiries (
  id serial PRIMARY KEY,
  sender_role varchar(10) NOT NULL,
  sender_id integer NOT NULL,
  anonymous boolean NOT NULL DEFAULT false,
  subject varchar(100) NOT NULL,
  status varchar(10) NOT NULL DEFAULT 'open',
  sender_unread boolean NOT NULL DEFAULT false,
  admin_unread boolean NOT NULL DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inquiry_messages (
  id serial PRIMARY KEY,
  inquiry_id integer NOT NULL
    CONSTRAINT inquiry_messages_inquiry_id_inquiries_id_fk REFERENCES inquiries(id) ON DELETE CASCADE,
  author varchar(10) NOT NULL,
  body text NOT NULL,
  created_at timestamp DEFAULT now()
);

COMMIT;
