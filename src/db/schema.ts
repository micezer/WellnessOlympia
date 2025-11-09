import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  jsonb,
  date,
  timestamp,
} from 'drizzle-orm/pg-core';

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
});

export const coaches = pgTable('coaches', {
  id: serial('id').primaryKey(),
  firstname: varchar('firstname', { length: 50 }).notNull(),
  secondname: varchar('secondname', { length: 50 }),
  identifier: varchar('identifier', { length: 50 }).notNull().unique(),
  assigned_team: varchar('assigned_team', { length: 50 }),
  chosen_team: varchar('chosen_team', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
});

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  firstname: varchar('firstname', { length: 50 }).notNull(),
  lastname: varchar('lastname', { length: 50 }).notNull(),
  position: varchar('position', { length: 50 }),
  injured: boolean('injured').default(false),
  load_percentage: integer('load_percentage'),
  last_rpe_date: timestamp('last_rpe_date'),
  last_wellness_date: timestamp('last_wellness_date'),
  picture: varchar('picture', { length: 255 }),
  identifier: varchar('identifier', { length: 50 }).notNull().unique(),
  team: varchar('team', { length: 50 }).notNull(),
  birth_date: date('birth_date'), // ← nueva columna
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
