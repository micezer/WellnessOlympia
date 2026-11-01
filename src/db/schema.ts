import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  smallint,
  boolean,
  jsonb,
  date,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Columnas de autenticación compartidas por coaches y players
export type NotifyPrefs = { wellness: boolean; load: boolean };

const authColumns = () => ({
  password_hash: varchar('password_hash', { length: 100 }), // NULL = cuenta sin reclamar
  password_set_at: timestamp('password_set_at'),
  token_version: integer('token_version').notNull().default(0), // +1 invalida todas las sesiones
  failed_attempts: integer('failed_attempts').notNull().default(0),
  locked_until: timestamp('locked_until'),
});

export const coaches = pgTable('coaches', {
  id: serial('id').primaryKey(),
  firstname: varchar('firstname', { length: 50 }).notNull(),
  secondname: varchar('secondname', { length: 50 }),
  identifier: varchar('identifier', { length: 50 }).notNull().unique(),
  assigned_team: varchar('assigned_team', { length: 50 }),
  chosen_team: varchar('chosen_team', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
  ...authColumns(),
  reset_requested_at: timestamp('reset_requested_at'), // el coach pidió restablecer (lo ve el admin)
  news_seen: integer('news_seen').notNull().default(0), // última versión de "Novedades" vista
});

// Administrador: solo gestiona las cuentas de los coaches, no ve datos de equipos
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  identifier: varchar('identifier', { length: 50 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow(),
  ...authColumns(),
});

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  firstname: varchar('firstname', { length: 50 }).notNull(),
  lastname: varchar('lastname', { length: 50 }).notNull(),
  position: varchar('position', { length: 50 }),
  picture: varchar('picture', { length: 255 }),
  identifier: varchar('identifier', { length: 50 }).notNull().unique(),
  team: varchar('team', { length: 50 }).notNull(),
  birth_date: date('birth_date'), // ← nueva columna
  // Perfil personalizable por la jugadora
  nickname: varchar('nickname', { length: 30 }),
  shirt_number: smallint('shirt_number'),
  avatar_color: varchar('avatar_color', { length: 7 }),
  ...authColumns(),
  reset_requested_at: timestamp('reset_requested_at'), // la jugadora pidió restablecer contraseña
  news_seen: integer('news_seen').notNull().default(0), // última versión de "Novedades" vista
  // Recordatorios que quiere recibir (push)
  notify_prefs: jsonb('notify_prefs')
    .$type<NotifyPrefs>()
    .notNull()
    .default({ wellness: true, load: true }),
});

// =====================
// 🧠 Formulario de bienestar (Wellness)
// =====================

export const player_wellness = pgTable('player_wellness', {
  id: serial('id').primaryKey(),
  player_id: integer('player_id').references(() => players.id, { onDelete: 'cascade' }),
  player_name: text('player_name').notNull(),
  date: date('date').notNull(),

  fatigue_level: integer('fatigue_level').notNull(),
  tiredness_level: integer('tiredness_level').notNull(),
  stress_level: integer('stress_level').notNull(),
  mood: text('mood').notNull(),
  sleep_hours: integer('sleep_hours').notNull(),

  is_injured: boolean('is_injured').notNull().default(false),
  injury_details: text('injury_details'),
  menstrual_phase: text('menstrual_phase'),
  discomfort: text('discomfort'),

  created_at: timestamp('created_at').defaultNow(),
});

// =====================
// 💪 Formulario de carga (Training Load)
// =====================
export const player_load = pgTable('player_load', {
  id: serial('id').primaryKey(),
  player_id: integer('player_id').notNull(),
  player_name: text('player_name').notNull(), // 👈 este debe estar
  date: date('date').notNull(),
  rpe: integer('rpe').notNull(),
  muscle_pain: jsonb('muscle_pain').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

// =====================
// 🔐 Registro de eventos de autenticación (auditoría)
// =====================
export const auth_events = pgTable('auth_events', {
  id: serial('id').primaryKey(),
  role: varchar('role', { length: 10 }).notNull(),
  identifier: varchar('identifier', { length: 50 }).notNull(),
  event: varchar('event', { length: 20 }).notNull(), // claim | login_fail | lockout | reset_request | reset | password_change
  ip: varchar('ip', { length: 100 }),
  user_agent: text('user_agent'),
  actor: varchar('actor', { length: 50 }), // quién hizo el reset (identifier del coach o 'cli')
  created_at: timestamp('created_at').defaultNow(),
});

// =====================
// 🔔 Notificaciones push
// =====================

// Un registro por dispositivo (endpoint). Si otra persona inicia sesión en el mismo móvil,
// el endpoint pasa a ser suyo.
export const push_subscriptions = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  role: varchar('role', { length: 10 }).notNull(), // coach | player | admin
  user_id: integer('user_id').notNull(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  user_agent: text('user_agent'),
  created_at: timestamp('created_at').defaultNow(),
  last_success_at: timestamp('last_success_at'),
});

// Recordatorios ya enviados: evita duplicados si el cron se ejecuta dos veces
export const notification_log = pgTable(
  'notification_log',
  {
    id: serial('id').primaryKey(),
    date: date('date').notNull(),
    kind: varchar('kind', { length: 30 }).notNull(),
    user_role: varchar('user_role', { length: 10 }).notNull(),
    user_id: integer('user_id').notNull(),
    created_at: timestamp('created_at').defaultNow(),
  },
  (t) => [uniqueIndex('notification_log_unique').on(t.date, t.kind, t.user_role, t.user_id)],
);

// =====================
// 💬 Consultas al administrador
// =====================

// La remitente siempre queda guardada (para poder responderle), aunque sea anónima:
// en ese caso el administrador no ve quién es.
export const inquiries = pgTable('inquiries', {
  id: serial('id').primaryKey(),
  sender_role: varchar('sender_role', { length: 10 }).notNull(), // player | coach
  sender_id: integer('sender_id').notNull(),
  anonymous: boolean('anonymous').notNull().default(false),
  subject: varchar('subject', { length: 100 }).notNull(),
  status: varchar('status', { length: 10 }).notNull().default('open'), // open | answered | closed
  sender_unread: boolean('sender_unread').notNull().default(false), // respuesta sin leer
  admin_unread: boolean('admin_unread').notNull().default(true), // mensaje nuevo sin leer
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const inquiry_messages = pgTable('inquiry_messages', {
  id: serial('id').primaryKey(),
  inquiry_id: integer('inquiry_id')
    .notNull()
    .references(() => inquiries.id, { onDelete: 'cascade' }),
  author: varchar('author', { length: 10 }).notNull(), // sender | admin
  body: text('body').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});
