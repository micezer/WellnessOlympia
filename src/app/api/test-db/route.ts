import { NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export async function GET() {
  try {
    const result = await db.execute(`SELECT NOW()`);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('❌ Error al conectar a la base de datos:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
