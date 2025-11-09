import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// ⚙️ Configura tu conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);
