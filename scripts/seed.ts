// Datos FALSOS para la base de datos local de desarrollo.
// Uso: npm run db:seed   (lee DATABASE_URL de .env.local)
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import { admins, coaches, players, player_wellness, player_load } from '../src/db/schema';
import { AVATAR_COLORS } from '../src/lib/forms';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL no definida (.env.local)');

// Nunca sembrar fuera de localhost: el seed borra todas las tablas.
const host = new URL(url).hostname;
if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
  throw new Error(`Seed bloqueado: DATABASE_URL apunta a "${host}", no a localhost`);
}

const pool = new Pool({ connectionString: url });
const db = drizzle(pool);

// PRNG determinista para que el seed sea reproducible
let state = 42;
const rand = () => {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
};
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

const TEAMS = [
  { name: 'Senior A', suffix: 'sa' },
  { name: 'Senior B', suffix: 'sb' },
  { name: 'Senior C', suffix: 'sc' },
] as const;

const FIRSTNAMES = [
  'Lucia', 'Marta', 'Paula', 'Sara', 'Elena', 'Irene', 'Nerea', 'Alba', 'Claudia', 'Julia',
  'Noelia', 'Ainhoa', 'Carla', 'Leire', 'Ines', 'Olga', 'Rocio', 'Vera', 'Celia', 'Ariadna',
];
const LASTNAMES = [
  'Prueba', 'Ejemplo', 'Ficticia', 'Demo', 'Simulada', 'Inventada', 'Modelo', 'Muestra',
];
const POSITIONS = ['Defensa', 'Centrocampista', 'Delantera'] as const;
const MOODS = [
  'bien', 'feliz', 'energica', 'motivada', 'cambios_de_humor', 'triste', 'irritable', 'frustrada',
] as const;
const PHASES = ['folicular', 'ovulatoria', 'lutea', 'menstrual', 'no_aplica'] as const;
const MUSCLES = [
  'abductores', 'cuadriceps', 'gemelos', 'isquiotibiales', 'lumbar',
  'dorsal', 'cervical', 'rodilla', 'tobillo', 'hombro',
] as const;

const DAYS = 21;
const PLAYERS_PER_TEAM = 20;

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split('T')[0];
}

async function main() {
  await db.execute(
    sql`TRUNCATE player_wellness, player_load, players, coaches, admins, auth_events RESTART IDENTITY CASCADE`,
  );

  await db.insert(coaches).values([
    { firstname: 'Entrenadora', secondname: 'Uno', identifier: 'EUnoAdmin' },
    { firstname: 'Entrenador', secondname: 'Dos', identifier: 'EDosAdmin' },
    { firstname: 'Entrenadora', secondname: 'Tres', identifier: 'ETresAdmin', chosen_team: 'Senior A' },
  ]);

  await db.insert(admins).values({ identifier: 'AdminPrueba', name: 'Admin de prueba' });

  const playerRows = TEAMS.flatMap((team) =>
    Array.from({ length: PLAYERS_PER_TEAM }, (_, i) => {
      const firstname = FIRSTNAMES[i];
      const lastname = LASTNAMES[(i + team.suffix.charCodeAt(1)) % LASTNAMES.length];
      // 2 porteras por equipo y una jugadora sin posición (caso NULL)
      const position = i < 2 ? 'Portera' : i === 2 ? null : pick(POSITIONS);
      return {
        firstname,
        lastname,
        position,
        identifier: `${firstname}${lastname}${team.suffix}`.toLowerCase(),
        team: team.name,
        birth_date: i % 4 === 0 ? null : `${int(1995, 2006)}-0${int(1, 9)}-1${int(0, 9)}`,
        // Perfil: dorsal único por equipo; algunas con apodo y color elegido
        shirt_number: i + 1,
        nickname: i % 5 === 1 ? `${firstname.slice(0, 3)}i` : null,
        avatar_color: i % 3 === 0 ? AVATAR_COLORS[i % AVATAR_COLORS.length] : null,
      };
    }),
  );
  const inserted = await db.insert(players).values(playerRows).returning();

  const wellnessRows = [];
  const loadRows = [];
  for (const p of inserted) {
    const name = `${p.firstname} ${p.lastname}`;
    for (let d = DAYS - 1; d >= 0; d--) {
      const date = isoDaysAgo(d);
      if (rand() < 0.85) {
        const injured = rand() < 0.05;
        wellnessRows.push({
          player_id: p.id,
          player_name: name,
          date,
          fatigue_level: int(1, 10),
          tiredness_level: int(1, 10),
          stress_level: int(1, 10),
          mood: pick(MOODS),
          sleep_hours: int(5, 10),
          is_injured: injured,
          injury_details: injured ? 'Molestia en el tobillo (dato de prueba)' : null,
          menstrual_phase: pick(PHASES),
          discomfort: rand() < 0.1 ? 'Carga en gemelos (dato de prueba)' : null,
        });
      }
      if (rand() < 0.75) {
        const musclePain: Record<string, number | string> = Object.fromEntries(
          MUSCLES.map((m) => [m, rand() < 0.8 ? 1 : int(2, 9)]),
        );
        musclePain.otras = '';
        loadRows.push({
          player_id: p.id,
          player_name: name,
          date,
          rpe: int(2, 9),
          muscle_pain: musclePain,
        });
      }
    }
  }
  await db.insert(player_wellness).values(wellnessRows);
  await db.insert(player_load).values(loadRows);

  console.log(
    `Seed OK: 1 admin (AdminPrueba), 3 coaches, ${inserted.length} jugadoras, ${wellnessRows.length} wellness, ${loadRows.length} load`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
