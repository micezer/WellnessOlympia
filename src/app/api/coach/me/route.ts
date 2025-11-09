// /api/coach/me/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { coaches } from '@/db/schema';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'clave-secreta-super-segura';
export async function GET() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('user_token')?.value;
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const decoded: any = jwt.verify(token, SECRET_KEY);
    const coachData = await db
      .select({
        firstname: coaches.firstname,
        secondname: coaches.secondname,
        chosen_team: coaches.chosen_team, // 🔹 añadir aquí
      })
      .from(coaches)
      .where(eq(coaches.identifier, decoded.identifier));

    if (!coachData.length) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    return NextResponse.json({
      firstname: coachData[0].firstname,
      secondname: coachData[0].secondname,
      chosen_team: coachData[0].chosen_team, // 🔹 devolver también
    });
  } catch (err) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}
