// Restablece la contraseña de un coach, jugadora o admin desde la terminal.
// Uso local:       npm run reset-password -- <identifier>
// Uso producción:  DATABASE_URL="<url de Neon>" npm run reset-password -- <identifier>
// (una variable ya definida en el entorno tiene prioridad sobre .env.local)
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, sql } from 'drizzle-orm';
import { Pool } from 'pg';
import { admins, auth_events, coaches, players } from '../src/db/schema';

const identifier = process.argv[2];
if (!identifier) {
  console.error('Uso: npm run reset-password -- <identifier>');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  const host = new URL(process.env.DATABASE_URL!).hostname;
  for (const [role, table] of [
    ['coach', coaches],
    ['player', players],
    ['admin', admins],
  ] as const) {
    const [user] = await db
      .update(table)
      .set({
        password_hash: null,
        password_set_at: null,
        failed_attempts: 0,
        locked_until: null,
        token_version: sql`${table.token_version} + 1`,
        ...(role !== 'admin' ? { reset_requested_at: null } : {}),
      })
      .where(eq(table.identifier, identifier))
      .returning({ identifier: table.identifier });

    if (user) {
      await db.insert(auth_events).values({ role, identifier, event: 'reset', actor: 'cli' });
      console.log(`✅ Contraseña restablecida (${role}) "${identifier}" en ${host}`);
      return;
    }
  }
  console.error(`❌ No existe ningún usuario "${identifier}" en ${host}`);
  process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
