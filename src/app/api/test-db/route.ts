// app/api/test-db/route.ts
//import { NextResponse } from 'next/server';
//import pkg from 'pg';
//const { Pool } = pkg;

// Detecta si estás en producción (Vercel/Neon)
//const isProduction = process.env.NODE_ENV === 'production';

// Pool de conexiones
//const pool = new Pool({
//  connectionString: process.env.DATABASE_URL,
//  ssl: isProduction ? { rejectUnauthorized: false } : false,
//});

//export async function GET() {
//  try {
//    const result = await pool.query('SELECT * FROM public.coaches LIMIT 5;');
//    return NextResponse.json({ success: true, rows: result.rows });
//  } catch (err: any) {
//    console.error('DB ERROR:', err);
//    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
//  }
//}
