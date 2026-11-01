// Crea la cuenta de administrador (sin contraseña: se crea en el primer acceso, como el resto).
// Uso local:       npm run create-admin -- <identifier> "<nombre>"
// Uso producción:  DATABASE_URL="<url de Neon>" npm run create-admin -- <identifier> "<nombre>"
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { admins } from '../src/db/schema';

const [identifier, name] = process.argv.slice(2);
if (!identifier || !name) {
  console.error('Uso: npm run create-admin -- <identifier> "<nombre>"');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  const host = new URL(process.env.DATABASE_URL!).hostname;
  const [created] = await db
    .insert(admins)
    .values({ identifier, name })
    .onConflictDoNothing()
    .returning({ identifier: admins.identifier });

  if (!created) {
    console.error(`❌ Ya existe un admin "${identifier}" en ${host}`);
    process.exitCode = 1;
    return;
  }
  console.log(`✅ Admin "${identifier}" creado en ${host}. Entra en la app y crea tu contraseña.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
